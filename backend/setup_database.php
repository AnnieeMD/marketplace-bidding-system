<?php
// setup_database.php - Database initialization script for PostgreSQL

header('Content-Type: application/json');

try {
    // Connect to PostgreSQL
    $pdo = new PDO("pgsql:host=localhost;port=5432;dbname=marketplace-bidding-system", 'admin', 'admin');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Read and execute the SQL schema
    $sql = file_get_contents(__DIR__ . '/schema.sql');
    
    // Execute the entire script at once for PostgreSQL
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