# Razorpay Payment Gateway Setup Guide

## Step 1: Create Razorpay Account

1. Go to [https://razorpay.com](https://razorpay.com)
2. Sign up for a Razorpay account
3. Complete the KYC verification process

## Step 2: Get API Keys

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Go to **Settings** → **API Keys**
3. Generate **Test Keys** for development or **Live Keys** for production
4. Copy your **Key ID** and **Key Secret**

## Step 3: Configure API Keys

1. Open `config/razorpay.php`
2. Add your **Key Secret** (Key ID is already configured):

```php
define('RAZORPAY_KEY_SECRET', 'your_key_secret_here');  // Add your Key Secret
```

**Current Configuration:**
- Key ID: `rzp_test_liiTEyI0hWRLIh` (already set)
- Key Secret: Add your Key Secret from Razorpay Dashboard

**Note:** The `config/razorpay.php` file is in `.gitignore` to keep your keys secure.

## Step 4: Update Database

Run the SQL script to add payment fields to the bookings table:

```sql
-- Add payment fields to bookings table
ALTER TABLE bookings 
ADD COLUMN payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
ADD COLUMN payment_id VARCHAR(255) NULL,
ADD COLUMN payment_date TIMESTAMP NULL;

-- Update existing bookings
UPDATE bookings SET payment_status = 'paid' WHERE booking_status = 'confirmed' AND payment_status IS NULL;
```

Or run the file: `database_payment_update.sql`

## Step 5: Test Payment Flow

1. Use Razorpay test cards for testing:
   - **Card Number**: 4111 1111 1111 1111
   - **CVV**: Any 3 digits
   - **Expiry**: Any future date
   - **Name**: Any name

2. Test the complete booking flow:
   - Select room and dates
   - Fill booking form
   - Click "Proceed to Payment"
   - Complete payment with test card
   - Verify booking confirmation

## Payment Flow

1. User fills booking form
2. System creates a **pending** booking
3. Razorpay payment modal opens
4. User completes payment
5. Payment is verified on server
6. Booking status changes to **confirmed**
7. User receives confirmation

## Security Notes

- **Never commit API keys to version control**
- Use environment variables or config files outside web root
- Always verify payment signatures on server
- Use HTTPS in production
- Keep Key Secret secure and never expose it to client-side code

## Troubleshooting

### Payment order creation fails
- Check if API keys are correct
- Verify cURL is enabled in PHP
- Check Razorpay account status

### Payment verification fails
- Ensure signature verification logic is correct
- Check that Key Secret matches the one used for order creation

### Booking not updating after payment
- Check database connection
- Verify booking_id is being passed correctly
- Check error logs in PHP

## Support

- Razorpay Documentation: [https://razorpay.com/docs](https://razorpay.com/docs)
- Razorpay Support: support@razorpay.com

