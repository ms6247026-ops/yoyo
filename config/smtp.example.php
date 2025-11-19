<?php
// Google SMTP Configuration Template
// Copy this file to smtp.php and add your actual credentials
// 
// To get Gmail App Password:
// 1. Enable 2-Step Verification on your Google Account
// 2. Go to: https://myaccount.google.com/apppasswords
// 3. Generate an App Password for "Mail"
// 4. Copy the 16-character password (remove spaces)

// Gmail SMTP Settings
define('SMTP_USERNAME', 'your-email@gmail.com');        // Your Gmail address
define('SMTP_PASSWORD', 'your-app-password');           // Gmail App Password (16 characters)
define('SMTP_FROM_EMAIL', 'your-email@gmail.com');     // Email address to send from
define('SMTP_FROM_NAME', 'Next Inn');                   // Display name for emails

// SMTP Server Settings (Gmail)
define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 587);
define('SMTP_ENCRYPTION', 'tls'); // 'tls' or 'ssl'

