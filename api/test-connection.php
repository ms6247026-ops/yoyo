<?php
// Database Connection Test
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    
    if ($db) {
        // Test query
        $query = "SELECT COUNT(*) as total FROM users";
        $stmt = $db->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch();
        
        // Check tables
        $tables = ['users', 'rooms', 'bookings'];
        $tableStatus = [];
        
        foreach ($tables as $table) {
            try {
                $query = "SELECT COUNT(*) as count FROM $table";
                $stmt = $db->prepare($query);
                $stmt->execute();
                $count = $stmt->fetch();
                $tableStatus[$table] = [
                    'exists' => true,
                    'count' => $count['count']
                ];
            } catch (Exception $e) {
                $tableStatus[$table] = [
                    'exists' => false,
                    'error' => $e->getMessage()
                ];
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Database connection successful',
            'database' => 'next_inn',
            'tables' => $tableStatus,
            'total_users' => $result['total']
        ], JSON_PRETTY_PRINT);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed'
        ], JSON_PRETTY_PRINT);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Database connection error',
        'error' => $e->getMessage()
    ], JSON_PRETTY_PRINT);
}
?>

