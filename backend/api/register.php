<?php
// register.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Вземане на данните
    $data = json_decode(file_get_contents('php://input'), true);
    
    $fullName = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    
    // Валидация
    $errors = [];
    
    if (empty($fullName)) {
        $errors[] = "Името е задължително!";
    }
    
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = "Невалиден имейл адрес!";
    }
    
    if (empty($username) || strlen($username) < 3) {
        $errors[] = "Потребителското име трябва да е поне 3 символа!";
    }
    
    if (empty($password) || strlen($password) < 6) {
        $errors[] = "Паролата трябва да е поне 6 символа!";
    }
    
    if (!empty($errors)) {
        echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
        exit;
    }
    
    try {
        $pdo = getDBConnection();
        
        // Проверка дали съществува имейл или потребителско име
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
        $stmt->execute([$email, $username]);
        
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Имейлът или потребителското име вече съществуват!']);
            exit;
        }
        
        // Хеширане на паролата
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Вмъкване в базата данни
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?)");
        $stmt->execute([$fullName, $email, $username, $hashedPassword]);
        
        echo json_encode(['success' => true, 'message' => 'Регистрацията е успешна!']);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Грешка при регистрация: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Невалидна заявка!']);
}
?>
