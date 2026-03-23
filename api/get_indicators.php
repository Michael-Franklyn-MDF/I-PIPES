<?php
header('Content-Type: application/json');
require '../config/db.php';

$policyID = (int)($_GET['policy_id'] ?? 0);
if (!$policyID) {
    echo json_encode(['success' => false, 'error' => 'Missing policy_id']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "SELECT indicatorID, name, weight FROM Indicators WHERE policyID = ? ORDER BY indicatorID ASC"
    );
    $stmt->execute([$policyID]);
    $indicators = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $indicators]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>