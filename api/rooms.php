<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_error_response('Only GET method allowed', 405);
}

try {
    $database = new Database();
    $db = $database->getConnection();

    // Get all available rooms
    $query = "SELECT * FROM rooms WHERE is_available = 1 ORDER BY price_per_night ASC";
    $stmt = $db->prepare($query);
    $stmt->execute();
    $rooms = $stmt->fetchAll();

    send_success_response('Rooms retrieved successfully', $rooms);

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}
?>
