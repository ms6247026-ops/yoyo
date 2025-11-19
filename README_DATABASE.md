# Database Connection Guide

## Database Setup

1. **Start XAMPP**
   - Open XAMPP Control Panel
   - Start Apache and MySQL services

2. **Create Database**
   - Open phpMyAdmin (http://localhost/phpmyadmin)
   - Import `database.sql` file to create the database and tables

3. **Database Configuration**
   - Database Name: `next_inn`
   - Host: `localhost`
   - Username: `root`
   - Password: `` (empty)

## API Endpoints

### Client APIs (Connected to Database)

1. **User Registration**
   - Endpoint: `api/register.php`
   - Method: POST
   - Database: `users` table

2. **User Login**
   - Endpoint: `api/login.php`
   - Method: POST
   - Database: `users` table
   - Returns: User data + bookings

3. **User Logout**
   - Endpoint: `api/logout.php`
   - Method: POST
   - Clears session

4. **Get Rooms**
   - Endpoint: `api/rooms.php`
   - Method: GET
   - Database: `rooms` table

5. **Bookings**
   - Endpoint: `api/booking.php`
   - Methods: GET, POST, PUT, DELETE
   - Database: `bookings` table
   - Requires: User authentication

### Admin APIs (Connected to Database)

1. **Admin Bookings**
   - Endpoint: `api/admin/bookings.php`
   - Methods: GET, PUT
   - Database: `bookings`, `users`, `rooms` tables
   - Features: View all bookings, Update booking status

2. **Admin Users**
   - Endpoint: `api/admin/users.php`
   - Method: GET
   - Database: `users` table
   - Features: View all users, View user details

3. **Admin Rooms**
   - Endpoint: `api/admin/rooms.php`
   - Methods: GET, POST, PUT, DELETE
   - Database: `rooms` table
   - Features: CRUD operations for rooms

## Test Database Connection

Visit: `http://localhost/yoyo/api/test-connection.php`

This will show:
- Database connection status
- Table existence and record counts
- Any connection errors

## Database Tables

1. **users** - User registration and login
2. **rooms** - Available rooms
3. **bookings** - User bookings

## Admin Credentials

- Email: `admin@gmail.com`
- Password: `admin123`

Note: Admin login is handled client-side. In production, this should be in the database.

