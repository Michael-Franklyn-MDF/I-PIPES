<?php
session_start();
header('Content-Type: application/json');
require '../config/db.php';

// Only admins should see the full user list
if (!isset($_SESSION['role']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

try {
    $cols = $pdo->query("SHOW COLUMNS FROM Users")->fetchAll(PDO::FETCH_COLUMN, 0);
    $colsLower = array_map('strtolower', $cols ?: []);
    $has = fn($c) => in_array(strtolower($c), $colsLower, true);

    $registeredCol = $has('dateregistered') ? 'dateRegistered' : ($has('createdat') ? 'createdAt' : null);
    $select = "SELECT userID, full_name, email, username, role, status";
    if ($registeredCol) {
        $select .= ", {$registeredCol} AS registeredAt";
    }
    $select .= " FROM Users ORDER BY full_name ASC";

    $stmt = $pdo->query($select);
    $users = $stmt->fetchAll();
    
    // Format the roles and statuses for the frontend
    foreach ($users as &$user) {
        $roleMap = [
            'admin' => ['label' => 'Admin', 'cls' => 'badge-admin'],
            'analyst' => ['label' => 'Analyst', 'cls' => 'badge-analyst'],
            'researcher' => ['label' => 'Researcher', 'cls' => 'badge-researcher']
        ];
        $r = $roleMap[$user['role']] ?? $roleMap['researcher'];
        $user['roleLabel'] = $r['label'];
        $user['roleCls'] = $r['cls'];
        
        $user['statusCls'] = ($user['status'] === 'active') ? 'badge-active' : 'badge-inactive';
        $user['statusLabel'] = ($user['status'] === 'active') ? 'Active' : 'Disabled';
        $user['lastLogin'] = '—'; // Placeholder for now, could be added to DB later
    }
    
    echo json_encode(['success' => true, 'data' => $users]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
