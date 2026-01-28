<?php

header('Content-Type: application/json');

require_once "config.php";

try {
    $pdo = new PDO(
      "mysql:host=localhost;port=3306;charset=utf8mb4",
      DB_USER,
      DB_PASS
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = file_get_contents(__DIR__ . '/schema.sql');
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