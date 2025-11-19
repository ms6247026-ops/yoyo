<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';

// Check authentication - try session first, then token
$user_id = null;

if (is_logged_in()) {
    // Session-based authentication
    $user_id = get_user_id();
} else {
    // Token-based authentication for API calls
    $headers = getallheaders();
    $auth_header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    
    if (strpos($auth_header, 'Bearer ') === 0) {
        $token = substr($auth_header, 7);
        // For now, we'll use a simple approach - check if user exists in database
        // In a real app, you'd validate the JWT token here
        $user_id = validate_token($token);
    }
}

if (!$user_id) {
    send_error_response('You must be logged in to access this resource', 401);
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $database = new Database();
    $db = $database->getConnection();

    switch ($method) {
        case 'GET':
            // Get user's bookings
            $query = "SELECT b.*, r.room_name, r.room_type, r.floor_number, r.price_per_night 
                      FROM bookings b 
                      JOIN rooms r ON b.room_id = r.id 
                      WHERE b.user_id = :user_id 
                      ORDER BY b.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            $bookings = $stmt->fetchAll();

            send_success_response('Bookings retrieved successfully', $bookings);
            break;

        case 'POST':
            // Create new booking
            $input = json_decode(file_get_contents('php://input'), true);

            $required_fields = ['room_id', 'check_in_date', 'check_out_date', 'number_of_guests'];
            foreach ($required_fields as $field) {
                if (!isset($input[$field]) || empty($input[$field])) {
                    send_error_response("Field '$field' is required");
                }
            }

            $room_id = (int)$input['room_id'];
            $check_in_date = $input['check_in_date'];
            $check_out_date = $input['check_out_date'];
            $number_of_guests = (int)$input['number_of_guests'];
            $special_requests = isset($input['special_requests']) ? sanitize_input($input['special_requests']) : '';

            // Validate dates
            $check_in = new DateTime($check_in_date);
            $check_out = new DateTime($check_out_date);
            $today = new DateTime();

            if ($check_in < $today) {
                send_error_response('Check-in date cannot be in the past');
            }

            if ($check_out <= $check_in) {
                send_error_response('Check-out date must be after check-in date');
            }

            // Check room availability
            $query = "SELECT * FROM rooms WHERE id = :room_id AND is_available = 1";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':room_id', $room_id);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                send_error_response('Room not available');
            }

            $room = $stmt->fetch();

            if ($number_of_guests > $room['max_occupancy']) {
                send_error_response('Number of guests exceeds room capacity');
            }

            // Check for conflicting bookings
            $query = "SELECT id FROM bookings 
                      WHERE room_id = :room_id 
                      AND booking_status IN ('pending', 'confirmed')
                      AND (
                          (check_in_date <= :check_in AND check_out_date > :check_in) OR
                          (check_in_date < :check_out AND check_out_date >= :check_out) OR
                          (check_in_date >= :check_in AND check_out_date <= :check_out)
                      )";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':room_id', $room_id);
            $stmt->bindParam(':check_in', $check_in_date);
            $stmt->bindParam(':check_out', $check_out_date);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                send_error_response('Room is not available for the selected dates');
            }

            // Calculate total amount
            $nights = $check_in->diff($check_out)->days;
            $total_amount = $room['price_per_night'] * $nights;

            // Create booking
            $query = "INSERT INTO bookings (user_id, room_id, check_in_date, check_out_date, number_of_guests, total_amount, special_requests) 
                      VALUES (:user_id, :room_id, :check_in_date, :check_out_date, :number_of_guests, :total_amount, :special_requests)";
            
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':room_id', $room_id);
            $stmt->bindParam(':check_in_date', $check_in_date);
            $stmt->bindParam(':check_out_date', $check_out_date);
            $stmt->bindParam(':number_of_guests', $number_of_guests);
            $stmt->bindParam(':total_amount', $total_amount);
            $stmt->bindParam(':special_requests', $special_requests);

            if ($stmt->execute()) {
                $booking_id = $db->lastInsertId();
                
                // Get booking details
                $query = "SELECT b.*, r.room_name, r.room_type, r.floor_number, r.price_per_night 
                          FROM bookings b 
                          JOIN rooms r ON b.room_id = r.id 
                          WHERE b.id = :booking_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':booking_id', $booking_id);
                $stmt->execute();
                $booking = $stmt->fetch();

                send_success_response('Booking created successfully!', $booking);
            } else {
                send_error_response('Failed to create booking');
            }
            break;

        case 'PUT':
            // Update booking (cancel)
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!isset($input['booking_id']) || !isset($input['action'])) {
                send_error_response('Booking ID and action are required');
            }

            $booking_id = (int)$input['booking_id'];
            $action = $input['action'];

            // Verify booking belongs to user
            $query = "SELECT id FROM bookings WHERE id = :booking_id AND user_id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':booking_id', $booking_id);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();

            if ($stmt->rowCount() === 0) {
                send_error_response('Booking not found');
            }

            if ($action === 'cancel') {
                $query = "UPDATE bookings SET booking_status = 'cancelled' WHERE id = :booking_id AND user_id = :user_id";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':booking_id', $booking_id);
                $stmt->bindParam(':user_id', $user_id);
                
                if ($stmt->execute()) {
                    send_success_response('Booking cancelled successfully');
                } else {
                    send_error_response('Failed to cancel booking');
                }
            } else {
                send_error_response('Invalid action');
            }
            break;

        default:
            send_error_response('Method not allowed', 405);
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}
?>
