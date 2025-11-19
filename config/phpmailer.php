<?php
// PHPMailer configuration for Google SMTP
// Make sure to install PHPMailer via Composer or download it manually

// Load SMTP configuration
$smtp_config_file = __DIR__ . '/smtp.php';
if (file_exists($smtp_config_file)) {
    require_once $smtp_config_file;
} else {
    // Fallback to example file for reference (will throw error if constants not defined)
    if (file_exists(__DIR__ . '/smtp.example.php')) {
        require_once __DIR__ . '/smtp.example.php';
    }
}

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
        // Validate SMTP configuration
        if (!defined('SMTP_USERNAME') || !defined('SMTP_PASSWORD')) {
            throw new Exception('SMTP credentials not configured. Please copy config/smtp.example.php to config/smtp.php and add your Gmail credentials.');
        }
        
        // Server settings
        $mail->isSMTP();
        $mail->Host       = defined('SMTP_HOST') ? SMTP_HOST : 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = SMTP_USERNAME;
        $mail->Password   = SMTP_PASSWORD;
        
        // Encryption settings
        $encryption = defined('SMTP_ENCRYPTION') ? SMTP_ENCRYPTION : 'tls';
        if ($encryption === 'ssl') {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
            $mail->Port       = defined('SMTP_PORT') ? SMTP_PORT : 465;
        } else {
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = defined('SMTP_PORT') ? SMTP_PORT : 587;
        }
        
        $mail->CharSet    = 'UTF-8';
        
        // Enable verbose debug output (disable in production)
        // $mail->SMTPDebug = 2;
        
        return $mail;
    } catch (Exception $e) {
        error_log("PHPMailer initialization error: " . $e->getMessage());
        throw new Exception("Failed to initialize email service: " . $e->getMessage());
    }
}

// Helper function to get default from email and name
function getSMTPFromEmail() {
    return defined('SMTP_FROM_EMAIL') ? SMTP_FROM_EMAIL : (defined('SMTP_USERNAME') ? SMTP_USERNAME : 'noreply@nextinn.com');
}

function getSMTPFromName() {
    return defined('SMTP_FROM_NAME') ? SMTP_FROM_NAME : 'Next Inn';
}
?>

