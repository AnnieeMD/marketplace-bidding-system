<?php
// create_auction.php - API for creating new auctions
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Set timezone to match database
date_default_timezone_set('Europe/Sofia');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Трябва да сте влезли в профила си.']);
        exit();
    }

    try {
        $pdo = getDBConnection();
        
        // Get POST data
        $input = json_decode(file_get_contents('php://input'), true);
        
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $starting_price = floatval($input['starting_price'] ?? 0);
        $buy_now_price = !empty($input['buy_now_price']) ? floatval($input['buy_now_price']) : null;
        $category = trim($input['category'] ?? '');
        $location = trim($input['location'] ?? '');
        $auction_type = trim($input['auction_type'] ?? 'auction');
        $duration_hours = floatval($input['duration_hours'] ?? 24);
        $image_url = trim($input['image_url'] ?? '');
        
        // Validation
        if (empty($title)) {
            echo json_encode(['success' => false, 'message' => 'Заглавието е задължително.']);
            exit();
        }
        
        if (empty($description)) {
            echo json_encode(['success' => false, 'message' => 'Описанието е задължително.']);
            exit();
        }
        
        if ($starting_price <= 0) {
            echo json_encode(['success' => false, 'message' => 'Началната цена трябва да бъде положително число.']);
            exit();
        }
        
        if (empty($category)) {
            echo json_encode(['success' => false, 'message' => 'Категорията е задължителна.']);
            exit();
        }
        
        if ($buy_now_price !== null && $buy_now_price <= $starting_price) {
            echo json_encode(['success' => false, 'message' => 'Цената "Купи сега" трябва да бъде по-висока от началната цена.']);
            exit();
        }
        
        // Calculate end time with precise timing
        $end_time = date('Y-m-d H:i:s', time() + ($duration_hours * 3600));
        
        // Insert auction
        $stmt = $pdo->prepare("
            INSERT INTO auctions (title, description, starting_price, buy_now_price, category, location, auction_type, end_time, image_url, user_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
        
        $stmt->execute([
            $title,
            $description,
            $starting_price,
            $buy_now_price,
            $category,
            $location,
            $auction_type,
            $end_time,
            $image_url ?: null,
            $_SESSION['user_id']
        ]);
        
        echo json_encode([
            'success' => true, 
            'message' => 'Търгът беше създаден успешно!',
            'auction_id' => $pdo->lastInsertId()
        ]);
        
    } catch(PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Възникна грешка при създаването на търга.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не е позволен.']);
}
?>