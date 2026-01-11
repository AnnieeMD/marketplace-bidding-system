<?php
// login.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $email = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    // Валидация
    if (empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'Моля, попълнете всички полета!']);
        exit;
    }
    
    try {
        $pdo = getDBConnection();
        
        // Търсене на потребителя
        $stmt = $pdo->prepare("SELECT id, full_name, email, username, password FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user && password_verify($password, $user['password'])) {
            // Успешен вход
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['full_name'] = $user['full_name'];
            
            // Обновяване на последен вход
            $updateStmt = $pdo->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?");
            $updateStmt->execute([$user['id']]);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Успешен вход!',
                'user' => [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'email' => $user['email'],
                    'full_name' => $user['full_name']
                ]
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Невалиден имейл или парола!']);
        }
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Грешка при вход: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Невалидна заявка!']);
}
?>