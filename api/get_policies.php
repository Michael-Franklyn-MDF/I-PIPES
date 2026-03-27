<?php
header('Content-Type: application/json');
require_once '../config/db.php';

try {
    $stmt = $pdo->query(
        'SELECT policyID, policyName, description, targetArea, dateCreated, status FROM Policies ORDER BY dateCreated DESC'
    );
    $policies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($policies);
} catch (Throwable $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
