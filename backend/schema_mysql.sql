START TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
                                     id INT AUTO_INCREMENT PRIMARY KEY,
                                     username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS auctions (
                                        id INT AUTO_INCREMENT PRIMARY KEY,
                                        user_id INT NOT NULL,
                                        title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(20) DEFAULT 'others',
    starting_price DECIMAL(10, 2) NOT NULL,
    current_price DECIMAL(10, 2) DEFAULT 0.00,
    buy_now_price DECIMAL(10, 2) DEFAULT NULL,
    location VARCHAR(100),
    image_url VARCHAR(500),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_auctions_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bids (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    auction_id INT NOT NULL,
                                    user_id INT NOT NULL,
                                    bid_amount DECIMAL(10, 2) NOT NULL,
    bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_bids_auction_id (auction_id),
    INDEX idx_bids_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (username, email, password) VALUES
    ('demo_user', 'demo@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
    ON DUPLICATE KEY UPDATE username=username;

INSERT INTO auctions (user_id, title, description, category, starting_price, current_price, buy_now_price, location, image_url, end_time) VALUES
                                                                                                                                              (1, 'iPhone 14 Pro', 'Excellent condition iPhone 14 Pro, 256GB, Space Black. Includes original box and charger.', 'electronics', 800.00, 850.00, 1200.00, 'София', 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500', DATE_ADD(NOW(), INTERVAL 2 DAY)),
                                                                                                                                              (1, 'Vintage Leather Jacket', 'Genuine leather jacket from the 80s, size M. Great condition, no damages.', 'fashion', 50.00, 75.00, 150.00, 'Пловдив', 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500', DATE_ADD(NOW(), INTERVAL 1 DAY)),
                                                                                                                                              (1, 'Gaming Chair', 'Ergonomic gaming chair with lumbar support. Used for 6 months, like new condition.', 'home', 100.00, 120.00, 250.00, 'Варна', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500', DATE_ADD(NOW(), INTERVAL 3 DAY)),
                                                                                                                                              (1, 'MacBook Air M1', '2021 MacBook Air with M1 chip, 8GB RAM, 256GB SSD. Perfect working condition.', 'electronics', 700.00, 750.00, 1000.00, 'София', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500', DATE_ADD(NOW(), INTERVAL 4 DAY)),
                                                                                                                                              (1, 'Nike Running Shoes', 'Brand new Nike Air Max, size 42, never worn. Original packaging included.', 'sports', 80.00, 80.00, 140.00, 'Бургас', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500', DATE_ADD(NOW(), INTERVAL 5 DAY));

COMMIT;
