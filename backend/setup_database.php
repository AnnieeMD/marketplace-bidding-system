<?php

header('Content-Type: application/json');

try {
    $pdo = new PDO("pgsql:host=localhost;port=5432;dbname=marketplace-bidding-system", 'admin', 'admin');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $sql = file_get_contents(__DIR__ . '/schema.sql');

    $pdo->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Database setup completed successfully! Sample data has been added.'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database setup failed: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Setup failed: ' . $e->getMessage()
    ]);
}
?>