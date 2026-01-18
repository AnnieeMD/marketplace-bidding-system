<?php
// setup_database.php
require_once '../core/config.php';

try {
    $pdo = getDBConnection();
    
    // SQL за създаване на таблица users
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
    )";
    
    $pdo->exec($sql);
    echo "Таблицата 'users' е създадена успешно!\n";
    
    // SQL за създаване на таблица auctions
    $sqlAuctions = "CREATE TABLE IF NOT EXISTS auctions (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        starting_price DECIMAL(10, 2) NOT NULL,
        current_price DECIMAL(10, 2),
        buy_now_price DECIMAL(10, 2),
        category VARCHAR(100),
        user_id INTEGER REFERENCES users(id),
        image_url VARCHAR(500),
        location VARCHAR(255),
        auction_type VARCHAR(20) DEFAULT 'auction' CHECK (auction_type IN ('auction', 'buy_now', 'both')),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'ended', 'cancelled')),
        start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_time TIMESTAMP NOT NULL,
        min_bid_increment DECIMAL(10, 2) DEFAULT 1.00,
        total_bids INTEGER DEFAULT 0,
        winner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    
    $pdo->exec($sqlAuctions);
    echo "Таблицата 'auctions' е създадена успешно!\n";
    
    // SQL за създаване на таблица bids
    $sqlBids = "CREATE TABLE IF NOT EXISTS bids (
        id SERIAL PRIMARY KEY,
        auction_id INTEGER REFERENCES auctions(id),
        user_id INTEGER REFERENCES users(id),
        bid_amount DECIMAL(10, 2) NOT NULL,
        bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_winning BOOLEAN DEFAULT FALSE
    )";
    
    $pdo->exec($sqlBids);
    echo "Таблицата 'bids' е създадена успешно!\n";
    
    // Create indexes
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_auctions_end_time ON auctions(end_time)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id)");
    $pdo->exec("CREATE INDEX IF NOT EXISTS idx_bids_user_id ON bids(user_id)");
    echo "Индексите са създадени успешно!\n";
    
} catch(PDOException $e) {
    echo "Грешка: " . $e->getMessage();
}
?>