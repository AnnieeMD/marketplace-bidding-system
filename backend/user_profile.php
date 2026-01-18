<?php
header('Content-Type: application/json');
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not logged in']);
    exit();
}

try {
    $pdo = getDBConnection();
    $userId = $_SESSION['user_id'];
    
    // Get user info
    $userStmt = $pdo->prepare("SELECT username, email, created_at FROM users WHERE id = ?");
    $userStmt->execute([$userId]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    // Get created auctions
    $createdStmt = $pdo->prepare("SELECT title, starting_price, current_price, status, created_at, (SELECT COUNT(*) FROM bids WHERE auction_id = auctions.id) as bid_count FROM auctions WHERE user_id = ? ORDER BY created_at DESC LIMIT 5");
    $createdStmt->execute([$userId]);
    $created = $createdStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get won auctions - auctions where user has the highest bid and auction is ended
    $wonStmt = $pdo->prepare("
        SELECT a.title, b.bid_amount, a.end_time, 
               (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as total_bidders
        FROM auctions a 
        JOIN bids b ON a.id = b.auction_id 
        WHERE b.user_id = ? AND a.status = 'ended'
        AND b.bid_amount = (SELECT MAX(bid_amount) FROM bids WHERE auction_id = a.id)
        ORDER BY a.end_time DESC LIMIT 5
    ");
    $wonStmt->execute([$userId]);
    $won = $wonStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get recent bidding activity
    $recentBidsStmt = $pdo->prepare("
        SELECT a.title, b.bid_amount, b.bid_time, a.status,
               CASE WHEN b.bid_amount = (SELECT MAX(bid_amount) FROM bids WHERE auction_id = a.id) THEN 1 ELSE 0 END as is_winning
        FROM bids b 
        JOIN auctions a ON b.auction_id = a.id 
        WHERE b.user_id = ? 
        ORDER BY b.bid_time DESC LIMIT 5
    ");
    $recentBidsStmt->execute([$userId]);
    $recentBids = $recentBidsStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get comprehensive statistics
    $statsStmt = $pdo->prepare("
        SELECT 
            (SELECT COUNT(*) FROM auctions WHERE user_id = ?) as auctions_created,
            (SELECT COUNT(*) FROM bids WHERE user_id = ?) as total_bids_placed,
            (SELECT COUNT(DISTINCT auction_id) FROM bids WHERE user_id = ?) as auctions_participated,
            (SELECT COUNT(*) FROM (
                SELECT DISTINCT b.auction_id 
                FROM bids b 
                JOIN auctions a ON b.auction_id = a.id 
                WHERE b.user_id = ? AND a.status = 'ended'
                AND b.bid_amount = (SELECT MAX(bid_amount) FROM bids WHERE auction_id = b.auction_id)
            ) AS won_auctions) as auctions_won,
            (SELECT COALESCE(SUM(b.bid_amount), 0) FROM bids b 
             JOIN auctions a ON b.auction_id = a.id 
             WHERE b.user_id = ? AND a.status = 'ended'
             AND b.bid_amount = (SELECT MAX(bid_amount) FROM bids WHERE auction_id = b.auction_id)) as total_money_won,
            (SELECT COALESCE(SUM(starting_price), 0) FROM auctions WHERE user_id = ?) as total_auction_value,
            (SELECT COALESCE(AVG(bid_amount), 0) FROM bids WHERE user_id = ?) as avg_bid_amount
    ");
    $statsStmt->execute([$userId, $userId, $userId, $userId, $userId, $userId, $userId]);
    $stats = $statsStmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'user' => $user,
        'created' => $created,
        'won' => $won,
        'recentBids' => $recentBids,
        'stats' => $stats
    ]);
    
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>