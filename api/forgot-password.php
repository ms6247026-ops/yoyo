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
if (!isset($input['email'])) {
    send_error_response('Email is required');
}

// Sanitize inputs
$email = sanitize_input($input['email']);

// Validate email format
if (!validate_email($email)) {
    send_error_response('Please enter a valid email address');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Check if user exists
    $query = "SELECT id, first_name, last_name, email FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        // Don't reveal if email exists for security
        send_success_response('If the email exists, an OTP has been sent to your email address.');
    }

    $user = $stmt->fetch();
    $user_id = $user['id'];

    // Generate 6-digit OTP
    $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Set expiration time (5 minutes from now)
    $expires_at = date('Y-m-d H:i:s', strtotime('+5 minutes'));

    // Invalidate any existing OTPs for this user
    $query = "UPDATE password_reset_otps SET is_used = TRUE WHERE user_id = :user_id AND is_used = FALSE";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();

    // Insert new OTP
    $query = "INSERT INTO password_reset_otps (user_id, email, otp_code, expires_at) 
              VALUES (:user_id, :email, :otp_code, :expires_at)";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':otp_code', $otp);
    $stmt->bindParam(':expires_at', $expires_at);

    if ($stmt->execute()) {
        // Send OTP via email using PHPMailer
        require_once __DIR__ . '/../config/phpmailer.php';
        
        $mail = getPHPMailer();
        $mail->setFrom('your-email@gmail.com', 'Next Inn');
        $mail->addAddress($email, $user['first_name'] . ' ' . $user['last_name']);
        $mail->Subject = 'Password Reset OTP - Next Inn';
        $mail->Body = "
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #2c3e50, #3498db); color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f9f9f9; }
                    .otp-box { background: white; border: 2px solid #3498db; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
                    .otp-code { font-size: 32px; font-weight: bold; color: #2c3e50; letter-spacing: 5px; }
                    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>Next Inn - Password Reset</h1>
                    </div>
                    <div class='content'>
                        <p>Hello " . htmlspecialchars($user['first_name']) . ",</p>
                        <p>You have requested to reset your password. Use the following OTP code to proceed:</p>
                        <div class='otp-box'>
                            <p style='margin: 0; color: #666;'>Your OTP Code:</p>
                            <div class='otp-code'>" . $otp . "</div>
                        </div>
                        <p><strong>This OTP is valid for 5 minutes only.</strong></p>
                        <p>If you didn't request this password reset, please ignore this email.</p>
                        <p>Best regards,<br>Next Inn Team</p>
                    </div>
                    <div class='footer'>
                        <p>&copy; 2023 Next Inn. All Rights Reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        ";
        $mail->AltBody = "Your password reset OTP is: " . $otp . "\n\nThis OTP is valid for 5 minutes only.\n\nIf you didn't request this, please ignore this email.";

        if ($mail->send()) {
            send_success_response('OTP has been sent to your email address. Please check your inbox.');
        } else {
            error_log("Email sending failed: " . $mail->ErrorInfo);
            send_error_response('Failed to send OTP email. Please try again later.');
        }
    } else {
        send_error_response('Failed to generate OTP. Please try again.');
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}
?>

