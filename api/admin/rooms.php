<?php
// Turn off error display, log errors instead
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

// Set headers first
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Start output buffering to catch any unwanted output
ob_start();

require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $roomId = isset($_GET['id']) ? $_GET['id'] : null;
        
        if ($roomId) {
            $query = "SELECT * FROM rooms WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $roomId);
            $stmt->execute();
            $room = $stmt->fetch();
            
            if ($room) {
                send_success_response('Room retrieved successfully', $room);
            } else {
                send_error_response('Room not found', 404);
            }
        } else {
            $query = "SELECT * FROM rooms ORDER BY floor_number, price_per_night";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $rooms = $stmt->fetchAll();
            
            send_success_response('Rooms retrieved successfully', $rooms);
        }
    } elseif ($method === 'POST') {
        // Create new room
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            ob_end_clean();
            send_error_response('Invalid JSON data received');
        }
        
        $required = ['room_name', 'room_type', 'floor_number', 'price_per_night', 'max_occupancy'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                ob_end_clean();
                send_error_response("Field $field is required");
            }
        }
        
        $query = "INSERT INTO rooms (room_name, room_type, floor_number, price_per_night, max_occupancy, description, amenities, image_url, is_available) 
                  VALUES (:room_name, :room_type, :floor_number, :price_per_night, :max_occupancy, :description, :amenities, :image_url, :is_available)";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            ob_end_clean();
            send_error_response('Failed to prepare query: ' . implode(', ', $db->errorInfo()));
        }
        
        $stmt->bindParam(':room_name', $input['room_name']);
        $stmt->bindParam(':room_type', $input['room_type']);
        $stmt->bindParam(':floor_number', $input['floor_number']);
        $stmt->bindParam(':price_per_night', $input['price_per_night']);
        $stmt->bindParam(':max_occupancy', $input['max_occupancy']);
        $description = $input['description'] ?? null;
        $amenities = $input['amenities'] ?? null;
        $image_url = $input['image_url'] ?? null;
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':amenities', $amenities);
        $stmt->bindParam(':image_url', $image_url);
        $isAvailable = isset($input['is_available']) ? ($input['is_available'] ? 1 : 0) : 1;
        $stmt->bindParam(':is_available', $isAvailable);
        
        if (!$stmt->execute()) {
            ob_end_clean();
            $errorInfo = $stmt->errorInfo();
            send_error_response('Failed to create room: ' . ($errorInfo[2] ?? 'Unknown error'));
        }
        
        $roomId = $db->lastInsertId();
        ob_end_clean();
        send_success_response('Room created successfully', ['id' => $roomId]);
        
    } elseif ($method === 'PUT') {
        // Update room
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            ob_end_clean();
            send_error_response('Invalid JSON data received');
        }
        
        if (!isset($input['id'])) {
            ob_end_clean();
            send_error_response('Room ID is required');
        }
        
        $query = "UPDATE rooms SET 
                    room_name = :room_name,
                    room_type = :room_type,
                    floor_number = :floor_number,
                    price_per_night = :price_per_night,
                    max_occupancy = :max_occupancy,
                    description = :description,
                    amenities = :amenities,
                    image_url = :image_url,
                    is_available = :is_available
                  WHERE id = :id";
        
        $stmt = $db->prepare($query);
        if (!$stmt) {
            ob_end_clean();
            send_error_response('Failed to prepare query: ' . implode(', ', $db->errorInfo()));
        }
        
        $stmt->bindParam(':id', $input['id']);
        $stmt->bindParam(':room_name', $input['room_name']);
        $stmt->bindParam(':room_type', $input['room_type']);
        $stmt->bindParam(':floor_number', $input['floor_number']);
        $stmt->bindParam(':price_per_night', $input['price_per_night']);
        $stmt->bindParam(':max_occupancy', $input['max_occupancy']);
        $description = $input['description'] ?? null;
        $amenities = $input['amenities'] ?? null;
        $image_url = $input['image_url'] ?? null;
        $stmt->bindParam(':description', $description);
        $stmt->bindParam(':amenities', $amenities);
        $stmt->bindParam(':image_url', $image_url);
        $isAvailable = isset($input['is_available']) ? ($input['is_available'] ? 1 : 0) : 1;
        $stmt->bindParam(':is_available', $isAvailable);
        
        if (!$stmt->execute()) {
            ob_end_clean();
            $errorInfo = $stmt->errorInfo();
            send_error_response('Failed to update room: ' . ($errorInfo[2] ?? 'Unknown error'));
        }
        
        ob_end_clean();
        if ($stmt->rowCount() > 0) {
            send_success_response('Room updated successfully');
        } else {
            send_error_response('Room not found or no changes made');
        }
        
    } elseif ($method === 'DELETE') {
        // Delete room
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['id'])) {
            send_error_response('Room ID is required');
        }
        
        // Check if room has bookings
        $checkQuery = "SELECT COUNT(*) as count FROM bookings WHERE room_id = :id";
        $checkStmt = $db->prepare($checkQuery);
        $checkStmt->bindParam(':id', $input['id']);
        $checkStmt->execute();
        $result = $checkStmt->fetch();
        
        if ($result['count'] > 0) {
            send_error_response('Cannot delete room with existing bookings');
        }
        
        $query = "DELETE FROM rooms WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $input['id']);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            send_success_response('Room deleted successfully');
        } else {
            send_error_response('Room not found');
        }
    } else {
        send_error_response('Method not allowed', 405);
    }

} catch (PDOException $e) {
    ob_end_clean(); // Clear any output
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    ob_end_clean(); // Clear any output
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}

// Clean output buffer before sending response (if buffer exists)
if (ob_get_level()) {
    ob_end_clean();
}
