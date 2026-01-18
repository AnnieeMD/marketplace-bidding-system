<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

try {
    if (isLoggedIn()) {
        $user = getCurrentUser();
        echo json_encode([
            'logged_in' => true,
            'user' => $user
        ]);
    } else {
        echo json_encode(['logged_in' => false]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'logged_in' => false,
        'error' => 'Session check failed'
    ]);
}
?>