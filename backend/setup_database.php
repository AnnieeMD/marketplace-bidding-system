<?php
// setup_database.php
require_once 'config.php';

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
    echo "Таблицата 'users' е създадена успешно!";
    
} catch(PDOException $e) {
    echo "Грешка: " . $e->getMessage();
}
?>