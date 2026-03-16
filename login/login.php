<?php
session_start();
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username']);
    $password = md5(trim($_POST['password']));

    if (empty($username) || empty($password)) {
        header('Location: index.html?error=Please fill in all fields');
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM Users WHERE username = ? AND password = ?");
    $stmt->execute([$username, $password]);
    $user = $stmt->fetch();

    if ($user) {
        $_SESSION['userID']   = $user['userID'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role']     = $user['role'];

        // Redirect based on role
        switch ($user['role']) {
            case 'admin':
                header('Location: ../admin/dashboard.html');
                break;
            case 'analyst':
                header('Location: ../policyAnalyst/dashboard.html');
                break;
            case 'researcher':
                header('Location: ../researcher/dashboard.html');
                break;
            default:
                header('Location: index.html?error=Unknown role');
        }
        exit;
    } else {
        header('Location: index.html?error=Invalid username or password');
        exit;
    }
}
?>