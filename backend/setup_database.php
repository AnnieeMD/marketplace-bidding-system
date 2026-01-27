<?php

header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=localhost;port=3306;charset=utf8mb4", 'root', '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("CREATE DATABASE IF NOT EXISTS marketplace_bidding CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE marketplace_bidding");

    $sql = file_get_contents(__DIR__ . '/schema_mysql.sql');
    $statements = explode(';', $sql);

    foreach ($statements as $statement) {
        $statement = trim($statement);
        if (!empty($statement)) {
            $pdo->exec($statement);
        }
    }

    echo json_encode(['success' => true, 'message' => 'Database setup completed successfully!']);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database setup failed: ' . $e->getMessage()]);
}
?>