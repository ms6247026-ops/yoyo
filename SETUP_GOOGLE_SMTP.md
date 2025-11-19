# Google SMTP Setup Guide

This guide will help you set up Google SMTP for sending OTP emails in the Next Inn application.

## Prerequisites

1. A Gmail account
2. PHPMailer library installed

## Step 1: Install PHPMailer

### Option A: Using Composer (Recommended)
```bash
cd C:\xampp\htdocs\yoyo
composer require phpmailer/phpmailer
```

### Option B: Manual Installation
1. Download PHPMailer from: https://github.com/PHPMailer/PHPMailer
2. Extract the files to: `C:\xampp\htdocs\yoyo\vendor\PHPMailer\`
3. The structure should be:
   ```
   vendor/
   └── PHPMailer/
       ├── src/
       │   ├── Exception.php
       │   ├── PHPMailer.php
       │   └── SMTP.php
       └── ...
   ```

## Step 2: Enable 2-Step Verification on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2-Step Verification

## Step 3: Generate App Password

1. Go back to **Security** settings
2. Under "Signing in to Google", click **App passwords**
3. Select **Mail** as the app
4. Select **Other (Custom name)** as the device
5. Enter "Next Inn" as the name
6. Click **Generate**
7. **Copy the 16-character password** (you'll need this in the next step)

## Step 4: Configure PHPMailer

1. Open `config/phpmailer.php`
2. Update the following lines:

```php
$mail->Username   = 'your-email@gmail.com'; // Replace with your Gmail address
$mail->Password   = 'your-app-password';     // Replace with the 16-character app password from Step 3
```

**Example:**
```php
$mail->Username   = 'nextinn.hotel@gmail.com';
$mail->Password   = 'abcd efgh ijkl mnop';  // Your 16-character app password
```

## Step 5: Update Email Address in API

1. Open `api/forgot-password.php`
2. Find this line:
```php
$mail->setFrom('your-email@gmail.com', 'Next Inn');
```
3. Replace `'your-email@gmail.com'` with your Gmail address

## Step 6: Test the Setup

1. Start XAMPP (Apache and MySQL)
2. Go to: `http://localhost/yoyo/forgot-password.html`
3. Enter a registered user's email
4. Check the email inbox for the OTP

## Troubleshooting

### Issue: "SMTP connect() failed"
**Solution:**
- Make sure you're using the App Password, not your regular Gmail password
- Check that 2-Step Verification is enabled
- Verify the email and password in `config/phpmailer.php`

### Issue: "Authentication failed"
**Solution:**
- Regenerate the App Password
- Make sure there are no spaces in the App Password when copying
- Check that "Less secure app access" is not required (App Passwords replace this)

### Issue: Emails going to Spam
**Solution:**
- This is normal for automated emails
- Users should check their spam folder
- Consider using a professional email service for production

### Issue: PHPMailer not found
**Solution:**
- Verify PHPMailer is installed in the correct location
- Check the `require_once` paths in `config/phpmailer.php`
- If using Composer, make sure `vendor/autoload.php` is included

## Security Notes

1. **Never commit your App Password to Git**
   - Add `config/phpmailer.php` to `.gitignore` if it contains credentials
   - Or use environment variables for production

2. **Use Environment Variables (Recommended for Production)**
   ```php
   $mail->Username = getenv('SMTP_USERNAME');
   $mail->Password = getenv('SMTP_PASSWORD');
   ```

3. **Rate Limiting**
   - Consider adding rate limiting to prevent abuse
   - Limit OTP requests per email/IP address

## Alternative: Using Environment Variables

For better security, you can use environment variables:

1. Create a `.env` file in the project root:
```
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

2. Install `vlucas/phpdotenv`:
```bash
composer require vlucas/phpdotenv
```

3. Update `config/phpmailer.php`:
```php
require_once __DIR__ . '/../vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$mail->Username = $_ENV['SMTP_USERNAME'];
$mail->Password = $_ENV['SMTP_PASSWORD'];
```

## Production Recommendations

1. Use a dedicated email service (SendGrid, Mailgun, AWS SES)
2. Implement email templates
3. Add email queuing for better performance
4. Monitor email delivery rates
5. Set up email bounce handling

