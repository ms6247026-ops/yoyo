<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        // Get all bookings with user and room details
        $bookingId = isset($_GET['id']) ? $_GET['id'] : null;
        
        if ($bookingId) {
            // Get single booking
            $query = "SELECT 
                        b.*,
                        CONCAT(u.first_name, ' ', u.last_name) as guest_name,
                        u.email as guest_email,
                        u.phone as guest_phone,
                        r.room_name,
                        r.room_type,
                        r.floor_number
                      FROM bookings b
                      JOIN users u ON b.user_id = u.id
                      JOIN rooms r ON b.room_id = r.id
                      WHERE b.id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $bookingId);
            $stmt->execute();
            $booking = $stmt->fetch();
            
            if ($booking) {
                send_success_response('Booking retrieved successfully', $booking);
            } else {
                send_error_response('Booking not found', 404);
            }
        } else {
            // Get all bookings
            $query = "SELECT 
                        b.*,
                        CONCAT(u.first_name, ' ', u.last_name) as guest_name,
                        u.email as guest_email,
                        u.phone as guest_phone,
                        r.room_name,
                        r.room_type,
                        r.floor_number
                      FROM bookings b
                      JOIN users u ON b.user_id = u.id
                      JOIN rooms r ON b.room_id = r.id
                      ORDER BY b.created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $bookings = $stmt->fetchAll();
            
            send_success_response('Bookings retrieved successfully', $bookings);
        }
    } elseif ($method === 'PUT') {
        // Update booking status
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($input['booking_id']) || !isset($input['status'])) {
            send_error_response('Booking ID and status are required');
        }
        
        $bookingId = $input['booking_id'];
        $status = $input['status'];
        
        // Validate status
        $validStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!in_array($status, $validStatuses)) {
            send_error_response('Invalid status');
        }
        
        $query = "UPDATE bookings SET booking_status = :status, updated_at = CURRENT_TIMESTAMP WHERE id = :id";
        $stmt = $db->prepare($query);
        $stmt->bindParam(':status', $status);
        $stmt->bindParam(':id', $bookingId);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            send_success_response('Booking status updated successfully');
        } else {
            send_error_response('Booking not found or no changes made');
        }
    } else {
        send_error_response('Method not allowed', 405);
    }

} catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    send_error_response('Database error occurred. Please try again later.');
} catch (Exception $e) {
    error_log("General error: " . $e->getMessage());
    send_error_response('An error occurred. Please try again later.');
}


