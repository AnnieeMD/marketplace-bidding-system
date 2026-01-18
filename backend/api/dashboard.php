<?php
// dashboard.php
require_once '../core/config.php';

// Проверка дали потребителят е влязъл
if (!isset($_SESSION['user_id'])) {
    header('Location: index.html');
    exit;
}

$username = $_SESSION['username'];
$email = $_SESSION['email'];
$fullName = $_SESSION['full_name'];
?>
<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Профил</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .profile-card {
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            text-align: center;
        }
        h1 { color: #333; margin-bottom: 30px; }
        .info { margin: 15px 0; font-size: 1.1rem; }
        .logout-btn {
            margin-top: 30px;
            padding: 12px 30px;
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
        }
        .logout-btn:hover { opacity: 0.9; }
    </style>
</head>
<body>
    <div class="profile-card">
        <h1>Добре дошъл, <?php echo htmlspecialchars($fullName); ?>!</h1>
        <div class="info"><strong>Потребителско име:</strong> <?php echo htmlspecialchars($username); ?></div>
        <div class="info"><strong>Имейл:</strong> <?php echo htmlspecialchars($email); ?></div>
        <a href="logout.php" class="logout-btn">Изход</a>
    </div>
</body>
</html>