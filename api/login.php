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
if (!isset($input['email']) || !isset($input['password'])) {
    send_error_response('Email and password are required');
}

// Sanitize inputs
$email = sanitize_input($input['email']);
$password = $input['password'];

// Validate email format
if (!validate_email($email)) {
    send_error_response('Please enter a valid email address');
}

// Admin credentials
$admin_email = 'admin@gmail.com';
$admin_password = 'admin123';

try {
    // Check if admin login
    if ($email === $admin_email && $password === $admin_password) {
        // Admin login successful
        $admin_data = [
            'id' => 0,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => $admin_email,
            'role' => 'admin'
        ];
        
        // Start session and store admin data
        login_user(0, $admin_data);
        
        send_success_response('Admin login successful!', [
            'user' => $admin_data,
            'role' => 'admin'
        ]);
    }

    // Regular user login
    $database = new Database();
    $db = $database->getConnection();

    // Get user by email
    $query = "SELECT id, first_name, last_name, email, phone, password, date_of_birth, country, newsletter_subscription, created_at 
              FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        send_error_response('Invalid email or password');
    }

    $user = $stmt->fetch();

    // Verify password
    if (!verify_password($password, $user['password'])) {
        send_error_response('Invalid email or password');
    }

    // Remove password from user data
    unset($user['password']);

    // Start session and store user data
    login_user($user['id'], $user);

    // Get user's bookings
    $query = "SELECT b.*, r.room_name, r.room_type, r.floor_number 
              FROM bookings b 
              JOIN rooms r ON b.room_id = r.id 
              WHERE b.user_id = :user_id 
              ORDER BY b.created_at DESC";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user['id']);
    $stmt->execute();
    $bookings = $stmt->fetchAll();

    send_success_response('Login successful!', [
        'user' => $user,
        'bookings' => $bookings,
        'role' => 'user'
    ]);

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}
?>
