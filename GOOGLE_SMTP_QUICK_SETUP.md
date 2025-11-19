# Google SMTP Quick Setup Guide

This guide will help you quickly set up Google SMTP for the forgot password feature.

## Step 1: Get Gmail App Password

1. **Enable 2-Step Verification** (if not already enabled):
   - Go to: https://myaccount.google.com/security
   - Click on **2-Step Verification** and follow the prompts

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select **Mail** as the app
   - Select **Other (Custom name)** as the device
   - Enter "Next Inn" as the name
   - Click **Generate**
   - **Copy the 16-character password** (it looks like: `abcd efgh ijkl mnop`)

## Step 2: Configure SMTP Settings

1. **Copy the example file**:
   ```bash
   # In your project root (C:\xampp\htdocs\yoyo)
   copy config\smtp.example.php config\smtp.php
   ```

2. **Edit `config/smtp.php`** and update these values:
   ```php
   define('SMTP_USERNAME', 'your-email@gmail.com');        // Your Gmail address
   define('SMTP_PASSWORD', 'abcd efgh ijkl mnop');         // The 16-character app password (remove spaces)
   define('SMTP_FROM_EMAIL', 'your-email@gmail.com');     // Same as username
   define('SMTP_FROM_NAME', 'Next Inn');                   // Display name
   ```

   **Example:**
   ```php
   define('SMTP_USERNAME', 'nextinn.hotel@gmail.com');
   define('SMTP_PASSWORD', 'abcdefghijklmnop');  // Remove spaces from app password
   define('SMTP_FROM_EMAIL', 'nextinn.hotel@gmail.com');
   define('SMTP_FROM_NAME', 'Next Inn');
   ```

## Step 3: Install PHPMailer (if not already installed)

### Option A: Using Composer (Recommended)
```bash
cd C:\xampp\htdocs\yoyo
composer require phpmailer/phpmailer
```

### Option B: Manual Installation
1. Download PHPMailer from: https://github.com/PHPMailer/PHPMailer/releases
2. Extract to: `C:\xampp\htdocs\yoyo\vendor\PHPMailer\`
3. Ensure the structure is:
   ```
   vendor/
   └── PHPMailer/
       └── src/
           ├── Exception.php
           ├── PHPMailer.php
           └── SMTP.php
   ```

## Step 4: Test the Setup

1. Make sure XAMPP (Apache and MySQL) is running
2. Go to: `http://localhost/yoyo/forgot-password.html`
3. Enter a registered user's email address
4. Check the email inbox for the OTP code

## Troubleshooting

### Error: "SMTP credentials not configured"
- Make sure you created `config/smtp.php` from `config/smtp.example.php`
- Verify all constants are defined in `config/smtp.php`

### Error: "SMTP connect() failed"
- Check that you're using the **App Password**, not your regular Gmail password
- Verify 2-Step Verification is enabled
- Make sure there are no spaces in the App Password

### Error: "Authentication failed"
- Regenerate the App Password
- Remove any spaces from the App Password
- Double-check the email and password in `config/smtp.php`

### Error: "PHPMailer not found"
- Install PHPMailer using Composer or download manually
- Check the file paths in `config/phpmailer.php`

### Emails going to Spam
- This is normal for automated emails
- Users should check their spam folder
- Consider using a professional email service for production

## Security Notes

- **Never commit `config/smtp.php` to Git** (it's already in `.gitignore`)
- Use a dedicated Gmail account for sending emails
- Consider using environment variables for production deployments
- Monitor email sending limits (Gmail has daily limits)

## Next Steps

Once configured, the forgot password feature will automatically send OTP codes via email when users request a password reset.

