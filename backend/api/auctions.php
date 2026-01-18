<?php
// auctions.php - API for fetching auctions and placing bids
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Set timezone to match database
date_default_timezone_set('Europe/Sofia');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../core/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = getDBConnection();
        
        // Get search parameters
        $search = $_GET['search'] ?? '';
        $category = $_GET['category'] ?? '';
        $status = $_GET['status'] ?? 'active';
        $priceSort = $_GET['price_sort'] ?? '';
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
        
        // Build query
        $sql = "SELECT a.*, u.username, u.full_name,
                       a.buy_now_price, a.auction_type,
                       CASE 
                           WHEN a.end_time < NOW() THEN 'ended'
                           ELSE a.status 
                       END as actual_status,
                       EXTRACT(EPOCH FROM (a.end_time - NOW())) as time_remaining,
                       EXTRACT(EPOCH FROM a.updated_at) as last_updated,
                       (SELECT COUNT(*) FROM bids b WHERE b.auction_id = a.id) as bid_count,
                       (SELECT MAX(bid_amount) FROM bids b WHERE b.auction_id = a.id) as highest_bid
                FROM auctions a 
                LEFT JOIN users u ON a.user_id = u.id 
                WHERE 1=1 AND a.end_time > NOW() - INTERVAL '1 day'";
        $params = [];
        
        // Add status filter
        if ($status === 'active') {
            $sql .= " AND a.status = 'active' AND a.end_time > NOW()";
        } elseif ($status === 'ended') {
            $sql .= " AND (a.status = 'ended' OR a.end_time <= NOW())";
        }
        
        // Add search filter
        if (!empty($search)) {
            $sql .= " AND (a.title ILIKE ? OR a.description ILIKE ?)";
            $searchTerm = "%{$search}%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        // Add category filter
        if (!empty($category)) {
            $sql .= " AND a.category = ?";
            $params[] = $category;
        }
        
        // Add ORDER BY clause with price sorting if specified
        if ($priceSort === 'asc') {
            $sql .= " ORDER BY COALESCE((SELECT MAX(bid_amount) FROM bids b WHERE b.auction_id = a.id), a.starting_price) ASC";
        } elseif ($priceSort === 'desc') {
            $sql .= " ORDER BY COALESCE((SELECT MAX(bid_amount) FROM bids b WHERE b.auction_id = a.id), a.starting_price) DESC";
        } else {
            $sql .= " ORDER BY a.created_at DESC";
        }
        
        $sql .= " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $auctions = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Process auction data
        foreach ($auctions as &$auction) {
            $auction['time_remaining'] = max(0, $auction['time_remaining']);
            $auction['current_price'] = $auction['highest_bid'] ?? $auction['starting_price'];
            $auction['has_bids'] = $auction['bid_count'] > 0;
            $auction['total_bids'] = $auction['bid_count']; // For compatibility
            
            // Get top 3 bidders for main page display
            $topBiddersStmt = $pdo->prepare("
                SELECT u.username, b.bid_amount, b.is_winning
                FROM bids b 
                JOIN users u ON b.user_id = u.id 
                WHERE b.auction_id = ? 
                ORDER BY b.is_winning DESC, b.bid_amount DESC, b.bid_time DESC
                LIMIT 3
            ");
            $topBiddersStmt->execute([$auction['id']]);
            $auction['top_bidders'] = $topBiddersStmt->fetchAll(PDO::FETCH_ASSOC);
        }
        
        // Get total count for pagination
        $countSql = "SELECT COUNT(*) as total FROM auctions a WHERE 1=1 AND a.end_time > NOW() - INTERVAL '1 day'";
        $countParams = [];
        
        if ($status === 'active') {
            $countSql .= " AND a.status = 'active' AND a.end_time > NOW()";
        } elseif ($status === 'ended') {
            $countSql .= " AND (a.status = 'ended' OR a.end_time <= NOW())";
        }
        
        if (!empty($search)) {
            $countSql .= " AND (a.title ILIKE ? OR a.description ILIKE ?)";
            $countParams[] = $searchTerm;
            $countParams[] = $searchTerm;
        }
        
        if (!empty($category)) {
            $countSql .= " AND a.category = ?";
            $countParams[] = $category;
        }
        
        $countStmt = $pdo->prepare($countSql);
        $countStmt->execute($countParams);
        $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        
        echo json_encode([
            'success' => true,
            'auctions' => $auctions,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset
        ]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Грешка при извличане на търгове: ' . $e->getMessage()]);
    }

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle bidding and buy now
    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Трябва да сте влезли в профила си за да наддавате!']);
        exit();
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? 'bid';
    $auctionId = $data['auction_id'] ?? null;
    
    if (!$auctionId) {
        echo json_encode(['success' => false, 'message' => 'Невалидни данни!']);
        exit();
    }
    
    if ($action === 'buy_now') {
        // Handle buy now functionality
        try {
            $pdo = getDBConnection();
            $pdo->beginTransaction();
            
            // Get auction details
            $stmt = $pdo->prepare("SELECT *, 
                                          (SELECT MAX(bid_amount) FROM bids WHERE auction_id = ?) as highest_bid
                                   FROM auctions 
                                   WHERE id = ?");
            $stmt->execute([$auctionId, $auctionId]);
            $auction = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$auction) {
                throw new Exception('Търгът не е намерен!');
            }
            
            // Check if auction is still active
            if ($auction['status'] !== 'active') {
                throw new Exception('Този търг вече е приключил!');
            }
            
            // Check if auction time has expired
            if (strtotime($auction['end_time']) <= time()) {
                throw new Exception('Времето на този търг е изтекло!');
            }
            
            if ($auction['user_id'] == $_SESSION['user_id']) {
                throw new Exception('Не можете да купите собствен търг!');
            }
            
            if (!$auction['buy_now_price'] || ($auction['auction_type'] !== 'both' && $auction['auction_type'] !== 'buy_now')) {
                throw new Exception('Този търг не поддържа "Купи сега" опция!');
            }
            
            // Mark all previous bids as not winning
            $stmt = $pdo->prepare("UPDATE bids SET is_winning = FALSE WHERE auction_id = ?");
            $stmt->execute([$auctionId]);
            
            // Create a "buy now" bid record and mark it as winning
            $stmt = $pdo->prepare("INSERT INTO bids (auction_id, user_id, bid_amount, is_winning) VALUES (?, ?, ?, TRUE)");
            $stmt->execute([$auctionId, $_SESSION['user_id'], $auction['buy_now_price']]);
            
            // End the auction and set winner
            $stmt = $pdo->prepare("UPDATE auctions SET status = 'ended', winner_id = ?, current_price = ?, total_bids = total_bids + 1, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$_SESSION['user_id'], $auction['buy_now_price'], $auctionId]);
            
            $pdo->commit();
            
            // Log successful purchase for debugging
            error_log("Buy now successful: Auction {$auctionId} purchased by user {$_SESSION['user_id']} for {$auction['buy_now_price']}");
            
            // Get buyer username for response
            $userStmt = $pdo->prepare("SELECT username FROM users WHERE id = ?");
            $userStmt->execute([$_SESSION['user_id']]);
            $buyer = $userStmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Успешно закупихте артикула!',
                'final_price' => $auction['buy_now_price'],
                'auction_ended' => true,
                'auction_id' => $auctionId,
                'winner' => [
                    'username' => $buyer['username'],
                    'bid_amount' => $auction['buy_now_price']
                ]
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            error_log("Buy now error for auction {$auctionId}: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            error_log("Database error in buy now for auction {$auctionId}: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Internal Server Error']);
        }
        
    } else {
        // Handle regular bidding
        $bidAmount = $data['bid_amount'] ?? null;
        
        if (!$bidAmount) {
            echo json_encode(['success' => false, 'message' => 'Невалидни данни!']);
            exit();
        }
        
        if ($bidAmount <= 0) {
            echo json_encode(['success' => false, 'message' => 'Наддавката трябва да бъде положително число!']);
            exit();
        }
        
        try {
            $pdo = getDBConnection();
            $pdo->beginTransaction();
            
            // Get auction details
            $stmt = $pdo->prepare("SELECT *, 
                                          (SELECT MAX(bid_amount) FROM bids WHERE auction_id = ?) as highest_bid
                                   FROM auctions 
                                   WHERE id = ? AND status = 'active' AND end_time > NOW()");
            $stmt->execute([$auctionId, $auctionId]);
            $auction = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$auction) {
                // Check if auction exists but has ended
                $endedStmt = $pdo->prepare("SELECT id, end_time FROM auctions WHERE id = ?");
                $endedStmt->execute([$auctionId]);
                $endedAuction = $endedStmt->fetch();
                
                if ($endedAuction) {
                    throw new Exception('Този търг е приключил и не можете да наддавате!');
                } else {
                    throw new Exception('Търгът не е намерен!');
                }
            }
            
            if ($auction['user_id'] == $_SESSION['user_id']) {
                throw new Exception('Не можете да наддавате на собствен търг!');
            }
            
            $currentPrice = $auction['highest_bid'] ?? $auction['starting_price'];
            $minBid = $currentPrice + $auction['min_bid_increment'];
            
            if ($bidAmount < $minBid) {
                throw new Exception("Минималната наддавка е {$minBid} лв.!");
            }
            
            // Mark previous winning bid as not winning
            $stmt = $pdo->prepare("UPDATE bids SET is_winning = FALSE WHERE auction_id = ? AND is_winning = TRUE");
            $stmt->execute([$auctionId]);
            
            // Insert new bid
            $stmt = $pdo->prepare("INSERT INTO bids (auction_id, user_id, bid_amount, is_winning) VALUES (?, ?, ?, TRUE)");
            $stmt->execute([$auctionId, $_SESSION['user_id'], $bidAmount]);
            
            // Update auction
            $stmt = $pdo->prepare("UPDATE auctions SET current_price = ?, total_bids = total_bids + 1, updated_at = NOW() WHERE id = ?");
            $stmt->execute([$bidAmount, $auctionId]);
            
            $pdo->commit();
            
            // Get updated top bidders for immediate UI update
            $topBiddersStmt = $pdo->prepare("
                SELECT u.username, MAX(b.bid_amount) as bid_amount
                FROM bids b 
                JOIN users u ON b.user_id = u.id 
                WHERE b.auction_id = ? 
                GROUP BY u.id, u.username
                ORDER BY MAX(b.bid_amount) DESC
                LIMIT 3
            ");
            $topBiddersStmt->execute([$auctionId]);
            $topBidders = $topBiddersStmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Успешно наддаване!',
                'new_price' => $bidAmount,
                'total_bids' => $auction['total_bids'] + 1,
                'top_bidders' => $topBidders
            ]);
            
        } catch (Exception $e) {
            $pdo->rollBack();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        } catch (PDOException $e) {
            $pdo->rollBack();
            // Log the actual error for debugging
            error_log("Database error in bidding: " . $e->getMessage());
            // Return generic error message to user
            echo json_encode(['success' => false, 'message' => 'Internal Server Error']);
        }
    }
    
} else {
    echo json_encode(['success' => false, 'message' => 'Невалидна заявка!']);
}
?>
