<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/razorpay.php';

// Validate Razorpay configuration
if (!defined('RAZORPAY_KEY_ID') || RAZORPAY_KEY_ID === 'YOUR_RAZORPAY_KEY_ID' || empty(RAZORPAY_KEY_ID)) {
    send_error_response('Razorpay Key ID is not configured. Please check config/razorpay.php', 500);
}

if (!defined('RAZORPAY_KEY_SECRET') || RAZORPAY_KEY_SECRET === 'YOUR_RAZORPAY_KEY_SECRET_HERE' || empty(RAZORPAY_KEY_SECRET)) {
    send_error_response('Razorpay Key Secret is not configured. Please add your Key Secret in config/razorpay.php', 500);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error_response('Only POST method allowed', 405);
}

$input = json_decode(file_get_contents('php://input'), true);

// Check authentication
$user_id = null;
if (is_logged_in()) {
    $user_id = get_user_id();
} else {
    $headers = getallheaders();
    $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (strpos($auth_header, 'Bearer ') === 0) {
        $token = substr($auth_header, 7);
        $user_id = validate_token($token);
    }
}

if (!$user_id) {
    send_error_response('You must be logged in to make a payment', 401);
}

$action = $input['action'] ?? '';

switch ($action) {
    case 'create_order':
        // Create Razorpay order
        $amount = floatval($input['amount'] ?? 0);
        $booking_id = $input['booking_id'] ?? null;
        
        if ($amount <= 0) {
            send_error_response('Invalid amount');
        }
        
        // Convert amount to paise (Razorpay uses smallest currency unit)
        $amount_in_paise = (int)($amount * 100);
        
        // Create order data
        $order_data = [
            'amount' => $amount_in_paise,
            'currency' => 'INR',
            'receipt' => 'booking_' . ($booking_id ?? time()),
            'notes' => [
                'user_id' => (string)$user_id,
                'booking_id' => $booking_id ? (string)$booking_id : null
            ]
        ];
        
        // Create Razorpay order using cURL
        $ch = curl_init(RAZORPAY_API_URL . 'orders');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($order_data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Authorization: Basic ' . base64_encode(RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET)
        ]);
        
        $response = curl_exec($ch);
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curl_error = curl_error($ch);
        curl_close($ch);
        
        if ($curl_error) {
            error_log("Razorpay cURL Error: " . $curl_error);
            send_error_response('Failed to connect to Razorpay: ' . $curl_error);
        }
        
        if ($http_code === 200 || $http_code === 201) {
            $razorpayOrder = json_decode($response, true);
            
            if (isset($razorpayOrder['id'])) {
                send_success_response('Order created successfully', [
                    'order_id' => $razorpayOrder['id'],
                    'amount' => $amount,
                    'currency' => 'INR',
                    'key_id' => RAZORPAY_KEY_ID
                ]);
            } else {
                error_log("Razorpay order response: " . $response);
                send_error_response('Invalid response from Razorpay. Please check your API keys.');
            }
        } else {
            $error = json_decode($response, true);
            $error_message = 'Failed to create payment order';
            
            if (isset($error['error'])) {
                if (isset($error['error']['description'])) {
                    $error_message .= ': ' . $error['error']['description'];
                } elseif (isset($error['error']['reason'])) {
                    $error_message .= ': ' . $error['error']['reason'];
                } elseif (isset($error['error']['code'])) {
                    $error_message .= ': ' . $error['error']['code'];
                }
            }
            
            // Check for authentication errors
            if ($http_code === 401) {
                $error_message = 'Razorpay authentication failed. Please check your Key ID and Key Secret in config/razorpay.php. Make sure you have added your Key Secret.';
            }
            
            error_log("Razorpay Error (HTTP $http_code): " . $response);
            send_error_response($error_message);
        }
        break;
        
    case 'verify_payment':
        // Verify payment signature
        $razorpay_order_id = $input['razorpay_order_id'] ?? '';
        $razorpay_payment_id = $input['razorpay_payment_id'] ?? '';
        $razorpay_signature = $input['razorpay_signature'] ?? '';
        $booking_id = $input['booking_id'] ?? null;
        
        if (empty($razorpay_order_id) || empty($razorpay_payment_id) || empty($razorpay_signature)) {
            send_error_response('Payment verification data missing');
        }
        
        // Verify signature
        $generated_signature = hash_hmac('sha256', $razorpay_order_id . '|' . $razorpay_payment_id, RAZORPAY_KEY_SECRET);
        
        // Log for debugging (remove in production)
        error_log("Payment Verification - Order ID: $razorpay_order_id, Payment ID: $razorpay_payment_id");
        error_log("Generated Signature: $generated_signature");
        error_log("Received Signature: $razorpay_signature");
        
        if ($generated_signature !== $razorpay_signature) {
            error_log("Signature mismatch! Generated: $generated_signature, Received: $razorpay_signature");
            send_error_response('Payment verification failed: Signature mismatch. Please contact support with payment ID: ' . $razorpay_payment_id);
        }
        
        // Update booking status to confirmed
        if ($booking_id) {
            try {
                $database = new Database();
                $db = $database->getConnection();
                
                // Check if payment columns exist, if not use basic update
                $checkColumns = $db->query("SHOW COLUMNS FROM bookings LIKE 'payment_status'");
                $hasPaymentColumns = $checkColumns->rowCount() > 0;
                
                if ($hasPaymentColumns) {
                    $query = "UPDATE bookings SET 
                              booking_status = 'confirmed',
                              payment_status = 'paid',
                              payment_id = :payment_id,
                              payment_date = NOW()
                              WHERE id = :booking_id AND user_id = :user_id";
                } else {
                    // Fallback if payment columns don't exist
                    $query = "UPDATE bookings SET 
                              booking_status = 'confirmed'
                              WHERE id = :booking_id AND user_id = :user_id";
                }
                
                $stmt = $db->prepare($query);
                if ($hasPaymentColumns) {
                    $stmt->bindParam(':payment_id', $razorpay_payment_id);
                }
                $stmt->bindParam(':booking_id', $booking_id);
                $stmt->bindParam(':user_id', $user_id);
                
                if ($stmt->execute()) {
                    $rowsAffected = $stmt->rowCount();
                    if ($rowsAffected > 0) {
                        send_success_response('Payment verified and booking confirmed', [
                            'booking_id' => $booking_id,
                            'payment_id' => $razorpay_payment_id
                        ]);
                    } else {
                        error_log("No booking found with ID: $booking_id for user: $user_id");
                        send_error_response('Booking not found or already updated');
                    }
                } else {
                    $errorInfo = $stmt->errorInfo();
                    error_log("Database update error: " . print_r($errorInfo, true));
                    send_error_response('Failed to update booking: ' . ($errorInfo[2] ?? 'Unknown error'));
                }
            } catch (Exception $e) {
                error_log("Booking update error: " . $e->getMessage());
                error_log("Stack trace: " . $e->getTraceAsString());
                send_error_response('Payment verified but failed to update booking: ' . $e->getMessage());
            }
        } else {
            send_success_response('Payment verified successfully');
        }
        break;
        
    default:
        send_error_response('Invalid action');
}

