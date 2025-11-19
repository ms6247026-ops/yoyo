<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error_response('Only POST method allowed', 405);
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['email']) || !isset($input['otp']) || !isset($input['new_password'])) {
    send_error_response('Email, OTP, and new password are required');
}

// Sanitize inputs
$email = sanitize_input($input['email']);
$otp = sanitize_input($input['otp']);
$new_password = $input['new_password'];

// Validate email format
if (!validate_email($email)) {
    send_error_response('Please enter a valid email address');
}

// Validate OTP format (6 digits)
if (!preg_match('/^\d{6}$/', $otp)) {
    send_error_response('OTP must be a 6-digit number');
}

// Validate password length
if (strlen($new_password) < 8) {
    send_error_response('Password must be at least 8 characters long');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Verify OTP
    $query = "SELECT pr.*, u.id as user_id 
              FROM password_reset_otps pr
              JOIN users u ON pr.user_id = u.id
              WHERE pr.email = :email 
              AND pr.otp_code = :otp 
              AND pr.is_used = FALSE 
              AND pr.expires_at > NOW()
              ORDER BY pr.created_at DESC
              LIMIT 1";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':otp', $otp);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        send_error_response('Invalid or expired OTP. Please request a new one.');
    }

    $otp_record = $stmt->fetch();
    $user_id = $otp_record['user_id'];

    // Hash new password
    $hashed_password = hash_password($new_password);

    // Update user password
    $query = "UPDATE users SET password = :password, updated_at = NOW() WHERE id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':password', $hashed_password);
    $stmt->bindParam(':user_id', $user_id);

    if ($stmt->execute()) {
        // Mark OTP as used
        $query = "UPDATE password_reset_otps SET is_used = TRUE WHERE id = :otp_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':otp_id', $otp_record['id']);
        $stmt->execute();

        send_success_response('Password has been reset successfully. You can now login with your new password.');
    } else {
        send_error_response('Failed to reset password. Please try again.');
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}
?>

