<?php
// Database configuration for Next Inn
// Make sure XAMPP is running and MySQL is started

class Database {
    private $host = 'localhost';
    private $db_name = 'next_inn';
    private $username = 'root';
    private $password = '';
    private $conn;

    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            echo "Connection error: " . $exception->getMessage();
        }

        return $this->conn;
    }
}

// Helper functions
function sanitize_input($data) {
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data);
    return $data;
}

function validate_email($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

function validate_phone($phone) {
    return preg_match('/^[\+]?[1-9][\d]{0,15}$/', preg_replace('/[\s\-\(\)]/', '', $phone));
}

function hash_password($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

function verify_password($password, $hash) {
    return password_verify($password, $hash);
}

function calculate_age($dateOfBirth) {
    $today = new DateTime();
    $birthDate = new DateTime($dateOfBirth);
    return $today->diff($birthDate)->y;
}

function calculate_booking_total($room_id, $check_in, $check_out) {
    $database = new Database();
    $db = $database->getConnection();
    
    $query = "SELECT price_per_night FROM rooms WHERE id = :room_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':room_id', $room_id);
    $stmt->execute();
    
    $room = $stmt->fetch();
    if ($room) {
        $check_in_date = new DateTime($check_in);
        $check_out_date = new DateTime($check_out);
        $nights = $check_in_date->diff($check_out_date)->days;
        return $room['price_per_night'] * $nights;
    }
    
    return 0;
}

// Session management
function start_session() {
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }
}

function is_logged_in() {
    start_session();
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

function get_user_id() {
    start_session();
    return $_SESSION['user_id'] ?? null;
}

function get_user_data() {
    start_session();
    return $_SESSION['user_data'] ?? null;
}

function login_user($user_id, $user_data) {
    start_session();
    $_SESSION['user_id'] = $user_id;
    $_SESSION['user_data'] = $user_data;
}

function logout_user() {
    start_session();
    session_destroy();
}

// Response helpers
function send_json_response($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function send_error_response($message, $status_code = 400) {
    send_json_response(['error' => $message], $status_code);
}

function send_success_response($message, $data = null) {
    $response = ['success' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    send_json_response($response);
}

function validate_token($token) {
    // Simple token validation - in a real app, you'd use JWT
    // For now, we'll just check if the token is a valid user ID
    if (is_numeric($token)) {
        try {
            $database = new Database();
            $db = $database->getConnection();
            
            $query = "SELECT id FROM users WHERE id = :user_id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':user_id', $token);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                return (int)$token;
            }
        } catch (Exception $e) {
            error_log("Token validation error: " . $e->getMessage());
        }
    }
    return null;
}
?>
