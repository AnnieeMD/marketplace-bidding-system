<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

session_start();
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    exit;
}

// Validate required fields
$required_fields = ['title', 'description', 'starting_price', 'category', 'duration_hours', 'auction_type'];
foreach ($required_fields as $field) {
    if (!isset($input[$field]) || trim($input[$field]) === '') {
        echo json_encode(['success' => false, 'message' => "Field '$field' is required"]);
        exit;
    }
}

$title = trim($input['title']);
$description = trim($input['description']);
$starting_price = floatval($input['starting_price']);
$category = trim($input['category']);
$duration_hours = intval($input['duration_hours']);
$auction_type = trim($input['auction_type']);
$location = isset($input['location']) ? trim($input['location']) : null;
$image_url = isset($input['image_url']) ? trim($input['image_url']) : null;
$buy_now_price = null;

// Validate auction type and buy_now_price
if ($auction_type === 'both' && isset($input['buy_now_price']) && trim($input['buy_now_price']) !== '') {
    $buy_now_price = floatval($input['buy_now_price']);
    if ($buy_now_price <= $starting_price) {
        echo json_encode(['success' => false, 'message' => 'Buy now price must be higher than starting price']);
        exit;
    }
}

// Additional validation
if (strlen($title) < 5) {
    echo json_encode(['success' => false, 'message' => 'Title must be at least 5 characters']);
    exit;
}

if (strlen($description) < 20) {
    echo json_encode(['success' => false, 'message' => 'Description must be at least 20 characters']);
    exit;
}

if ($starting_price <= 0 || $starting_price > 99999999.99) {
    echo json_encode(['success' => false, 'message' => 'Starting price must be between 0.01 and 99,999,999.99']);
    exit;
}

if ($duration_hours < 1 || $duration_hours > 168) { // Max 1 week
    echo json_encode(['success' => false, 'message' => 'Duration must be between 1 and 168 hours']);
    exit;
}

try {
    // Calculate end time
    $end_time = date('Y-m-d H:i:s', time() + ($duration_hours * 3600));
    
    // Insert auction into database
    $stmt = $pdo->prepare("
        INSERT INTO auctions (
            user_id, title, description, starting_price, current_price, 
            category, end_time, location, image_url, buy_now_price, 
            auction_type, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NOW())
    ");
    
    $result = $stmt->execute([
        $_SESSION['user_id'],
        $title,
        $description,
        $starting_price,
        $starting_price, // current_price starts as starting_price
        $category,
        $end_time,
        $location,
        $image_url,
        $buy_now_price,
        $auction_type
    ]);
    
    if ($result) {
        $auction_id = $pdo->lastInsertId();
        echo json_encode([
            'success' => true, 
            'message' => 'Auction created successfully!',
            'auction_id' => $auction_id
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to create auction']);
    }
    
} catch (PDOException $e) {
    error_log("Database error in create_auction.php: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Database error occurred']);
}
?>
