-- Add payment fields to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP NULL;

-- Update existing bookings to have payment_status = 'paid' if they are confirmed
UPDATE bookings SET payment_status = 'paid' WHERE booking_status = 'confirmed' AND payment_status IS NULL;

