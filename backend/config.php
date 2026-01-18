<?php
// config.php
session_start();

// Настройки за PostgreSQL
define('DB_HOST', 'localhost');
define('DB_PORT', '5432');
define('DB_NAME', 'marketplace-bidding-system');
define('DB_USER', 'admin');
define('DB_PASS', 'admin');

// Свързване с PostgreSQL
function getDBConnection() {
    try {
        $dsn = "pgsql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME;
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch(PDOException $e) {
        die("Грешка при свързване: " . $e->getMessage());
    }
}
?>