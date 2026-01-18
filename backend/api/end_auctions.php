<?php
// end_auctions.php - Process and finalize ended auctions
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

require_once '../core/config.php';

try {
    $pdo = getDBConnection();
    $pdo->beginTransaction();
    
    // Find all auctions that have ended but are still marked as active
    $stmt = $pdo->prepare("
        SELECT a.id, a.title, a.user_id as seller_id, a.starting_price,
               (SELECT user_id FROM bids WHERE auction_id = a.id AND is_winning = TRUE LIMIT 1) as winner_id,
               (SELECT bid_amount FROM bids WHERE auction_id = a.id AND is_winning = TRUE LIMIT 1) as winning_bid,
               (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as total_bids
        FROM auctions a 
        WHERE a.status = 'active' AND a.end_time <= NOW()
    ");
    $stmt->execute();
    $endedAuctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $processedCount = 0;
    $errors = [];
    
    foreach ($endedAuctions as $auction) {
        try {
            // Mark auction as ended
            $updateStmt = $pdo->prepare("UPDATE auctions SET status = 'ended', updated_at = NOW() WHERE id = ?");
            $updateStmt->execute([$auction['id']]);
            
            // If there were bids, ensure the highest bid is marked as winning
            if ($auction['total_bids'] > 0 && $auction['winner_id']) {
                // Mark all other bids as not winning
                $bidStmt = $pdo->prepare("UPDATE bids SET is_winning = FALSE WHERE auction_id = ? AND user_id != ?");
                $bidStmt->execute([$auction['id'], $auction['winner_id']]);
                
                // Ensure winner's bid is marked as winning
                $winStmt = $pdo->prepare("
                    UPDATE bids 
                    SET is_winning = TRUE 
                    WHERE auction_id = ? AND user_id = ? 
                    AND bid_amount = (SELECT MAX(bid_amount) FROM bids WHERE auction_id = ?)
                ");
                $winStmt->execute([$auction['id'], $auction['winner_id'], $auction['id']]);
                
                // Update final price in auction
                $priceStmt = $pdo->prepare("UPDATE auctions SET current_price = ? WHERE id = ?");
                $priceStmt->execute([$auction['winning_bid'], $auction['id']]);
                
                error_log("Auction {$auction['id']} ended with winner: User {$auction['winner_id']}, Amount: {$auction['winning_bid']} лв.");
            } else {
                error_log("Auction {$auction['id']} ended with no bids.");
            }
            
            $processedCount++;
            
        } catch (Exception $e) {
            $errors[] = "Error processing auction {$auction['id']}: " . $e->getMessage();
            error_log("Error ending auction {$auction['id']}: " . $e->getMessage());
        }
    }
    
    $pdo->commit();
    
    echo json_encode([
        'success' => true,
        'processed' => $processedCount,
        'total_found' => count($endedAuctions),
        'errors' => $errors,
        'message' => "Processed {$processedCount} ended auctions"
    ]);
    
} catch (PDOException $e) {
    $pdo->rollBack();
    error_log("Database error in end_auctions.php: " . $e->getMessage());
    echo json_encode([
        'success' => false, 
        'message' => 'Internal Server Error',
        'error' => $e->getMessage()
    ]);
}
?>