-- Next Inn Database Structure
-- Run this in phpMyAdmin or MySQL command line

CREATE DATABASE IF NOT EXISTS next_inn;
USE next_inn;

-- Users table for registration and login
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL,
    country VARCHAR(50) NOT NULL,
    newsletter_subscription BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rooms table for available rooms
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    floor_number INT NOT NULL,
    price_per_night DECIMAL(10,2) NOT NULL,
    max_occupancy INT NOT NULL,
    description TEXT,
    amenities TEXT,
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Reset OTPs table
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_email_otp (email, otp_code),
    INDEX idx_expires_at (expires_at)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_guests INT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Insert sample rooms data
INSERT INTO rooms (room_name, room_type, floor_number, price_per_night, max_occupancy, description, amenities, image_url) VALUES
('Deluxe Ocean View', 'Deluxe', 1, 299.00, 2, 'Spacious room with stunning ocean views and modern amenities.', 'WiFi, Air Conditioning, Mini Bar, Ocean View, Balcony', 'images/deluxe-room.jpg'),
('Executive Suite', 'Suite', 2, 499.00, 4, 'Luxurious suite with separate living area and premium services.', 'WiFi, Air Conditioning, Mini Bar, Ocean View, Balcony, Living Room, Kitchenette', 'images/executive-suite.jpg'),
('Family Room', 'Family', 3, 399.00, 6, 'Perfect for families with children, featuring multiple beds.', 'WiFi, Air Conditioning, Mini Bar, Ocean View, Balcony, Multiple Beds', 'images/family-room.jpg'),
('Presidential Suite', 'Presidential', 4, 899.00, 4, 'Ultimate luxury with panoramic views and exclusive amenities.', 'WiFi, Air Conditioning, Mini Bar, Ocean View, Balcony, Living Room, Kitchen, Butler Service', 'images/presidential-suite.jpg'),
('Ultra Luxury Penthouse', 'Penthouse', 5, 1299.00, 6, 'The pinnacle of luxury with private terrace and premium services.', 'WiFi, Air Conditioning, Mini Bar, Ocean View, Private Terrace, Living Room, Kitchen, Butler Service, Private Pool', 'images/ultra-luxury.jpg');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_room_id ON bookings(room_id);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_rooms_availability ON rooms(is_available);

-- Create a view for booking details with user and room information
CREATE VIEW booking_details AS
SELECT 
    b.id as booking_id,
    b.user_id,
    b.room_id,
    CONCAT(u.first_name, ' ', u.last_name) as guest_name,
    u.email as guest_email,
    u.phone as guest_phone,
    r.room_name,
    r.room_type,
    r.floor_number,
    b.check_in_date,
    b.check_out_date,
    b.number_of_guests,
    b.total_amount,
    b.booking_status,
    b.special_requests,
    b.created_at as booking_date
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN rooms r ON b.room_id = r.id;
