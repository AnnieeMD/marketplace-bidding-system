<?php
// add_sample_auctions.php - Script to add sample auctions for testing
require_once '../core/config.php';

try {
    $pdo = getDBConnection();
    
    // First, create a sample user if none exists
    $stmt = $pdo->prepare("SELECT id FROM users LIMIT 1");
    $stmt->execute();
    
    if (!$stmt->fetch()) {
        // Create a sample user
        $hashedPassword = password_hash('demo123', PASSWORD_DEFAULT);
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, username, password) VALUES (?, ?, ?, ?) RETURNING id");
        $stmt->execute(['Demo User', 'demo@example.com', 'demo', $hashedPassword]);
        $userId = $stmt->fetch()['id'];
        echo "Създаден е примерен потребител: demo@example.com / demo123\n";
    } else {
        // Use existing user
        $stmt = $pdo->prepare("SELECT id FROM users LIMIT 1");
        $stmt->execute();
        $userId = $stmt->fetch()['id'];
    }
    
    // Sample auctions data
    $sampleAuctions = [
        [
            'title' => 'iPhone 13 Pro - като нов',
            'description' => 'Продавам iPhone 13 Pro в отлично състояние. Използван само 6 месеца. Всички аксесоари включени.',
            'starting_price' => 800.00,
            'buy_now_price' => 1200.00,
            'category' => 'electronics',
            'location' => 'София',
            'auction_type' => 'both',
            'end_time' => date('Y-m-d H:i:s', strtotime('+3 days')),
            'image_url' => 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
            'user_id' => $userId
        ],
        [
            'title' => 'Професионални ски - 170см',
            'description' => 'Професионални ски в отлично състояние, използвани само два сезона.',
            'starting_price' => 150.00,
            'buy_now_price' => 300.00,
            'category' => 'sports',
            'location' => 'Банско',
            'auction_type' => 'both',
            'end_time' => date('Y-m-d H:i:s', strtotime('+2 days')),
            'image_url' => 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop',
            'user_id' => $userId
        ],
        [
            'title' => 'Велосипед MTB - планински',
            'description' => 'Планински велосипед в отлично състояние. 21 скорости, алуминиева рама. Търгът започва от 200 лв!',
            'starting_price' => 200.00,
            'category' => 'sports',
            'location' => 'Варна',
            'auction_type' => 'auction',
            'end_time' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'image_url' => 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400&h=300&fit=crop',
            'user_id' => $userId
        ],
        [
            'title' => 'Лаптоп Dell XPS 13',
            'description' => 'Ултрабук Dell XPS 13 с Intel i7 процесор, 16GB RAM, 512GB SSD. Идеален за работа. Търг до утре!',
            'starting_price' => 400.00,
            'buy_now_price' => 800.00,
            'category' => 'electronics',
            'location' => 'София',
            'auction_type' => 'both',
            'end_time' => date('Y-m-d H:i:s', strtotime('+1 day')),
            'image_url' => 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop',
            'user_id' => $userId
        ],
        [
            'title' => 'Комплект мебели за дневна',
            'description' => 'Красив комплект мебели за дневна - диван, маса, два фотьойла. В много добро състояние.',
            'starting_price' => 300.00,
            'category' => 'home',
            'location' => 'Бургас',
            'auction_type' => 'auction',
            'end_time' => date('Y-m-d H:i:s', strtotime('+5 days')),
            'image_url' => 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
            'user_id' => $userId
        ],
        [
            'title' => 'BMW 320d - 2015г. търг!',
            'description' => 'BMW 320d в отлично състояние. Редовно сервизирана, нови гуми. Пробег 120 000 км. Търгът започва от 8000 лв!',
            'starting_price' => 8000.00,
            'category' => 'cars',
            'location' => 'София',
            'auction_type' => 'auction',
            'end_time' => date('Y-m-d H:i:s', strtotime('+7 days')),
            'image_url' => 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop',
            'user_id' => $userId
        ]
    ];
    
    $stmt = $pdo->prepare("INSERT INTO auctions (title, description, starting_price, buy_now_price, category, location, auction_type, end_time, image_url, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    
    foreach ($sampleAuctions as $auction) {
        $stmt->execute([
            $auction['title'],
            $auction['description'],
            $auction['starting_price'],
            $auction['buy_now_price'] ?? null,
            $auction['category'],
            $auction['location'],
            $auction['auction_type'],
            $auction['end_time'],
            $auction['image_url'] ?? null,
            $auction['user_id']
        ]);
    }
    
    echo "Примерните търгове са добавени успешно!";
    
} catch(PDOException $e) {
    echo "Грешка: " . $e->getMessage();
}
?>