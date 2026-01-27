<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Трябва да сте влезли в профила си.']);
        exit();
    }

    try {
        $pdo = getDBConnection();

        $input = json_decode(file_get_contents('php://input'), true);
        $auction_id = intval($input['auction_id'] ?? 0);
        
        if ($auction_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Невалиден ID на търг.']);
            exit();
        }

        $stmt = $pdo->prepare("SELECT user_id, title, status, end_time FROM auctions WHERE id = ?");
        $stmt->execute([$auction_id]);
        $auction = $stmt->fetch();
        
        if (!$auction) {
            echo json_encode(['success' => false, 'message' => 'Търгът не е намерен.']);
            exit();
        }
        
        if ($auction['user_id'] != $_SESSION['user_id']) {
            echo json_encode(['success' => false, 'message' => 'Нямате право да изтриете този търг.']);
            exit();
        }

        if ($auction['status'] === 'ended' || strtotime($auction['end_time']) <= time()) {
            echo json_encode(['success' => false, 'message' => 'Не можете да изтриете приключил търг.']);
            exit();
        }

        $stmt = $pdo->prepare("SELECT COUNT(*) as bid_count FROM bids WHERE auction_id = ?");
        $stmt->execute([$auction_id]);
        $bid_count = $stmt->fetch()['bid_count'];
        
        if ($bid_count > 0) {
            echo json_encode(['success' => false, 'message' => 'Не можете да изтриете търг, който има наддавания.']);
            exit();
        }

        $stmt = $pdo->prepare("DELETE FROM auctions WHERE id = ? AND user_id = ?");
        $stmt->execute([$auction_id, $_SESSION['user_id']]);
        
        if ($stmt->rowCount() > 0) {
            echo json_encode([
                'success' => true, 
                'message' => 'Търгът беше изтрит успешно.'
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Търгът не можа да бъде изтрит.']);
        }
        
    } catch(PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Възникна грешка при изтриването на търга.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не е позволен.']);
}
?>