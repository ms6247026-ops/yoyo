<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    send_error_response('Only POST method allowed', 405);
}

try {
    logout_user();
    send_success_response('Logged out successfully');
} catch (Exception $e) {
    error_log("Logout error: " . $e->getMessage());
    send_error_response('An error occurred during logout');
}
?>
