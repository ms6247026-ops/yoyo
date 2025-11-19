<?php
// PHPMailer configuration for Google SMTP
// Make sure to install PHPMailer via Composer or download it manually

// Try to load via Composer first
if (file_exists(__DIR__ . '/../vendor/autoload.php')) {
    require_once __DIR__ . '/../vendor/autoload.php';
} else {
    // If downloading PHPMailer manually, update the path below:
    $phpmailer_path = __DIR__ . '/../vendor/PHPMailer/src/';
    if (file_exists($phpmailer_path . 'Exception.php')) {
        require_once $phpmailer_path . 'Exception.php';
        require_once $phpmailer_path . 'PHPMailer.php';
        require_once $phpmailer_path . 'SMTP.php';
    } else {
        throw new Exception('PHPMailer not found. Please install it via Composer or download manually. See SETUP_GOOGLE_SMTP.md for instructions.');
    }
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function getPHPMailer() {
    $mail = new PHPMailer(true);
    
    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'your-email@gmail.com'; // Your Gmail address
        $mail->Password   = 'your-app-password';     // Gmail App Password (not regular password)
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;
        $mail->CharSet    = 'UTF-8';
        
        // Enable verbose debug output (disable in production)
        // $mail->SMTPDebug = 2;
        
        return $mail;
    } catch (Exception $e) {
        error_log("PHPMailer initialization error: " . $e->getMessage());
        throw new Exception("Failed to initialize email service");
    }
}
?>

