<?php
header('Content-Type: application/json');
require '../config/db.php';

try {
    $stmt = $pdo->query("SELECT p.*, u.full_name as createdByName FROM Policies p LEFT JOIN Users u ON p.createdBy = u.userID ORDER BY p.createdAt DESC");
    $policies = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $policies]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
