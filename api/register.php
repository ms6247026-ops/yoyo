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
$required_fields = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword', 'dateOfBirth', 'country'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || empty(trim($input[$field]))) {
        send_error_response("Field '$field' is required");
    }
}

// Sanitize inputs
$firstName = sanitize_input($input['firstName']);
$lastName = sanitize_input($input['lastName']);
$email = sanitize_input($input['email']);
$phone = sanitize_input($input['phone']);
$password = $input['password'];
$confirmPassword = $input['confirmPassword'];
$dateOfBirth = $input['dateOfBirth'];
$country = sanitize_input($input['country']);
$newsletter = isset($input['newsletter']) ? (bool)$input['newsletter'] : false;

// Validate inputs
if (!validate_email($email)) {
    send_error_response('Please enter a valid email address');
}

if (!validate_phone($phone)) {
    send_error_response('Please enter a valid phone number');
}

if (strlen($password) < 8) {
    send_error_response('Password must be at least 8 characters long');
}

if ($password !== $confirmPassword) {
    send_error_response('Passwords do not match');
}

$age = calculate_age($dateOfBirth);
if ($age < 18) {
    send_error_response('You must be at least 18 years old to register');
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Check if email already exists
    $query = "SELECT id FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        send_error_response('Email address is already registered');
    }

    // Hash password
    $hashedPassword = hash_password($password);

    // Insert new user
    $query = "INSERT INTO users (first_name, last_name, email, phone, password, date_of_birth, country, newsletter_subscription) 
              VALUES (:firstName, :lastName, :email, :phone, :password, :dateOfBirth, :country, :newsletter)";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':firstName', $firstName);
    $stmt->bindParam(':lastName', $lastName);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':phone', $phone);
    $stmt->bindParam(':password', $hashedPassword);
    $stmt->bindParam(':dateOfBirth', $dateOfBirth);
    $stmt->bindParam(':country', $country);
    $stmt->bindParam(':newsletter', $newsletter);

    if ($stmt->execute()) {
        $user_id = $db->lastInsertId();
        
        // Get user data for response
        $query = "SELECT id, first_name, last_name, email, phone, date_of_birth, country, newsletter_subscription, created_at 
                  FROM users WHERE id = :user_id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        $user_data = $stmt->fetch();

        send_success_response('Registration successful! Welcome to Next Inn.', [
            'user_id' => $user_id,
            'user_data' => $user_data
        ]);
    } else {
        send_error_response('Registration failed. Please try again.');
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}
?>
