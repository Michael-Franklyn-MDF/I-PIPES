<?php
declare(strict_types=1);

require __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

$fullName = trim((string)($_POST['full_name'] ?? ''));
$email = trim((string)($_POST['email'] ?? ''));
$username = trim((string)($_POST['username'] ?? ''));
$password = (string)($_POST['password'] ?? '');
$confirmPassword = (string)($_POST['confirm_password'] ?? '');

if ($fullName === '' || $email === '' || $username === '' || $password === '' || $confirmPassword === '') {
    header('Location: index.html?error=Please fill in all fields');
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: index.html?error=Invalid email');
    exit;
}
if (strlen($username) < 3) {
    header('Location: index.html?error=Username must be at least 3 characters');
    exit;
}
if (strlen($password) < 8) {
    header('Location: index.html?error=Password must be at least 8 characters');
    exit;
}
if ($password !== $confirmPassword) {
    header('Location: index.html?error=Passwords do not match');
    exit;
}

try {
    $check = $pdo->prepare("SELECT userID FROM Users WHERE username = ?");
    $check->execute([$username]);
    if ($check->fetch()) {
        header('Location: index.html?error=Username already exists');
        exit;
    }

    $hash = md5($password);
    // Note: schema may differ; we insert the columns most likely to exist.
    $stmt = $pdo->prepare("INSERT INTO Users (username, password, role) VALUES (?, ?, 'researcher')");
    $stmt->execute([$username, $hash]);

    header('Location: ../login/index.html?error=Account created. Please log in');
    exit;
} catch (Throwable $e) {
    header('Location: index.html?error=Signup failed');
    exit;
}

