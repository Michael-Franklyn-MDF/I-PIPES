<?php
session_start();
header('Content-Type: application/json');
require '../config/db.php';

// Only admins can update other users
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

$userID = (int)($data['userID'] ?? 0);
$action = trim($data['action'] ?? '');

if (!$userID || !$action) {
    echo json_encode(['success' => false, 'error' => 'Missing user ID or action']);
    exit;
}

try {
    if ($action === 'toggle_status') {
        $status = trim($data['status'] ?? '');
        if ($status !== 'active' && $status !== 'disabled') {
            echo json_encode(['success' => false, 'error' => 'Invalid status']);
            exit;
        }
        $stmt = $pdo->prepare("UPDATE Users SET status = ? WHERE userID = ?");
        $stmt->execute([$status, $userID]);
        echo json_encode(['success' => true]);
        
    } elseif ($action === 'reset_password') {
        $newPassword = trim($data['new_password'] ?? '');
        if (strlen($newPassword) < 8) {
             echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters']);
             exit;
        }
        // Using MD5 to match the existing login logic. In production, use password_hash()
        $hash = md5($newPassword);
        $stmt = $pdo->prepare("UPDATE Users SET password = ? WHERE userID = ?");
        $stmt->execute([$hash, $userID]);
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Unknown action']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
