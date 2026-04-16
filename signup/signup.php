<?php
declare(strict_types=1);

require __DIR__ . '/../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

$fullName        = trim((string)($_POST['full_name']        ?? ''));
$email           = trim((string)($_POST['email']            ?? ''));
$username        = trim((string)($_POST['username']         ?? ''));
$password        = (string)($_POST['password']              ?? '');
$confirmPassword = (string)($_POST['confirm_password']      ?? '');

// Validation 
if ($fullName === '' || $email === '' || $username === '' || $password === '' || $confirmPassword === '') {
    header('Location: index.html?error=' . urlencode('Please fill in all fields'));
    exit;
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: index.html?error=' . urlencode('Please enter a valid email address'));
    exit;
}
if (strlen($username) < 3) {
    header('Location: index.html?error=' . urlencode('Username must be at least 3 characters'));
    exit;
}
if (strlen($password) < 8) {
    header('Location: index.html?error=' . urlencode('Password must be at least 8 characters'));
    exit;
}
if ($password !== $confirmPassword) {
    header('Location: index.html?error=' . urlencode('Passwords do not match'));
    exit;
}

// Check for duplicates 
try {
    $chkUser = $pdo->prepare("SELECT userID FROM Users WHERE username = ?");
    $chkUser->execute([$username]);
    if ($chkUser->fetch()) {
        header('Location: index.html?error=' . urlencode('Username already taken'));
        exit;
    }

    $chkEmail = $pdo->prepare("SELECT userID FROM Users WHERE email = ?");
    $chkEmail->execute([$email]);
    if ($chkEmail->fetch()) {
        header('Location: index.html?error=' . urlencode('Email already registered'));
        exit;
    }

    // Insert new user 
    $hash = md5($password);
    $stmt = $pdo->prepare(
        "INSERT INTO Users (full_name, email, username, password, role, status)
         VALUES (?, ?, ?, ?, 'researcher', 'active')"
    );
    $stmt->execute([$fullName, $email, $username, $hash]);

    header('Location: ../login/index.html?success=' . urlencode('Account created! Please log in.'));
    exit;

} catch (Throwable $e) {
    header('Location: index.html?error=' . urlencode('Signup failed: ' . $e->getMessage()));
    exit;
}
?>