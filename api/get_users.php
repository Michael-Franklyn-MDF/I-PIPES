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
    $stmt = $pdo->query("SELECT userID, full_name, email, username, role, status FROM Users ORDER BY full_name ASC");
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
        $user['statusLabel'] = ($user['status'] === 'active') ? 'Active' : 'Inactive';
        $user['lastLogin'] = '—'; // Placeholder for now, could be added to DB later
    }
    
    echo json_encode(['success' => true, 'data' => $users]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
