<?php
header('Content-Type: application/json');
require '../config/db.php';

try {
    $stmt = $pdo->query("SELECT e.*, p.name as policyName, u.full_name as evaluatedByName FROM Evaluations e LEFT JOIN Policies p ON e.policyID = p.policyID LEFT JOIN Users u ON e.evaluatedBy = u.userID ORDER BY e.createdAt DESC");
    $evaluations = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $evaluations]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
