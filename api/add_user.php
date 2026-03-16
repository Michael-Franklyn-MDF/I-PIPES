<?php
session_start();
header('Content-Type: application/json');
require '../config/db.php';

// Only admins can add new users
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$data = $_POST;
if (empty($data)) {
    $data = json_decode(file_get_contents('php://input'), true);
}

$fullName = trim($data['full_name'] ?? '');
$email = trim($data['email'] ?? '');
$role = trim($data['role'] ?? 'researcher');

if (empty($fullName) || empty($email) || empty($role)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'error' => 'Invalid email address']);
    exit;
}

// Generate a default username (first name + part of last name, lowercase)
$parts = explode(' ', $fullName);
$username = strtolower($parts[0]);
if (isset($parts[1])) {
    $username .= strtolower(substr($parts[1], 0, 3));
}

// Generate a default temporary password
$passwordStr = 'password123';
$hash = md5($passwordStr); // Match existing hashing method

try {
    // Check for duplicates
    $chk = $pdo->prepare("SELECT userID FROM Users WHERE email = ?");
    $chk->execute([$email]);
    if ($chk->fetch()) {
        echo json_encode(['success' => false, 'error' => 'Email already registered']);
        exit;
    }
    
    // Check username, append random number if taken
    $chkU = $pdo->prepare("SELECT userID FROM Users WHERE username = ?");
    $chkU->execute([$username]);
    if ($chkU->fetch()) {
        $username .= rand(10, 99);
    }
    
    $stmt = $pdo->prepare("INSERT INTO Users (full_name, email, username, password, role, status) VALUES (?, ?, ?, ?, ?, 'active')");
    $stmt->execute([$fullName, $email, $username, $hash, $role]);
    
    echo json_encode(['success' => true, 'temporary_password' => $passwordStr, 'username' => $username, 'id' => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
