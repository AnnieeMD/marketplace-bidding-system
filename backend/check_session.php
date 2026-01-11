<?php
// check_session.php
header('Content-Type: application/json');
require_once 'config.php';

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'logged_in' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'email' => $_SESSION['email'],
            'full_name' => $_SESSION['full_name']
        ]
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
?>