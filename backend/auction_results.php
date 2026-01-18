<?php
// auction_results.php - Get auction results and winner information
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Set timezone to match database
date_default_timezone_set('Europe/Sofia');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $auctionId = $_GET['auction_id'] ?? null;
    
    if (!$auctionId) {
        echo json_encode(['success' => false, 'message' => 'Липсва ID на търг.']);
        exit();
    }
    
    try {
        $pdo = getDBConnection();
        
        // Get auction details
        $stmt = $pdo->prepare("
            SELECT a.*, 
                   u_seller.username as seller_username
            FROM auctions a
            LEFT JOIN users u_seller ON a.user_id = u_seller.id
            WHERE a.id = ?
        ");
        $stmt->execute([$auctionId]);
        $auction = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$auction) {
            echo json_encode(['success' => false, 'message' => 'Търгът не е намерен.']);
            exit();
        }
        
        // Get winner information if exists
        $winnerStmt = $pdo->prepare("
            SELECT u.username, b.bid_amount as winning_bid
            FROM bids b
            JOIN users u ON b.user_id = u.id
            WHERE b.auction_id = ? AND b.bid_amount = (SELECT MAX(bid_amount) FROM bids WHERE auction_id = ?)
            ORDER BY b.bid_amount DESC, b.bid_time DESC
            LIMIT 1
        ");
        $winnerStmt->execute([$auctionId, $auctionId]);
        $winner = $winnerStmt->fetch(PDO::FETCH_ASSOC);
        
        // Get total bids count
        $countStmt = $pdo->prepare("SELECT COUNT(*) as total_bids FROM bids WHERE auction_id = ?");
        $countStmt->execute([$auctionId]);
        $totalBids = $countStmt->fetch(PDO::FETCH_ASSOC)['total_bids'];
        
        if (!$auction) {
            echo json_encode(['success' => false, 'message' => 'Търгът не е намерен.']);
            exit();
        }
        
        // Get all bids for this auction
        $bidStmt = $pdo->prepare("
            SELECT b.bid_amount, b.bid_time, u.username, 
                   CASE WHEN b.bid_amount = (SELECT MAX(bid_amount) FROM bids WHERE auction_id = b.auction_id) THEN 1 ELSE 0 END as is_winning
            FROM bids b
            JOIN users u ON b.user_id = u.id
            WHERE b.auction_id = ?
            ORDER BY b.bid_amount DESC, b.bid_time ASC
            LIMIT 10
        ");
        $bidStmt->execute([$auctionId]);
        $bids = $bidStmt->fetchAll(PDO::FETCH_ASSOC);
        
        $result = [
            'success' => true,
            'auction' => [
                'id' => $auction['id'],
                'title' => $auction['title'],
                'description' => $auction['description'],
                'starting_price' => $auction['starting_price'],
                'current_price' => $auction['current_price'] ?? $auction['starting_price'],
                'status' => $auction['status'],
                'end_time' => $auction['end_time'],
                'created_at' => $auction['created_at'],
                'seller_username' => $auction['seller_username'],
                'total_bids' => $totalBids,
                'image_url' => $auction['image_url']
            ],
            'winner' => $winner ? [
                'username' => $winner['username'],
                'winning_bid' => $winner['winning_bid']
            ] : null,
            'bids' => $bids
        ];
        
        echo json_encode($result);
        
    } catch (PDOException $e) {
        error_log("Database error in auction_results.php: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Internal Server Error']);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Метод не е позволен.']);
}
?>