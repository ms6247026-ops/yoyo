<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $userId = isset($_GET['id']) ? $_GET['id'] : null;
    
    if ($userId) {
        // Get single user
        $query = "SELECT * FROM users WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $userId);
        $stmt->execute();
        $user = $stmt->fetch();
        
        if ($user) {
            // Remove password from response
            unset($user['password']);
            send_success_response('User retrieved successfully', $user);
        } else {
            send_error_response('User not found', 404);
        }
    } else {
        // Get all users
        $query = "SELECT id, first_name, last_name, email, phone, date_of_birth, country, newsletter_subscription, created_at FROM users ORDER BY created_at DESC";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        send_success_response('Users retrieved successfully', $users);
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}

