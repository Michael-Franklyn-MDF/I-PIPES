<?php
header('Content-Type: application/json');
require '../config/db.php';

try {
    // Schema compatibility: Policies name column may be `policyName` or `name`.
    $cols = $pdo->query("SHOW COLUMNS FROM Policies")->fetchAll(PDO::FETCH_COLUMN, 0);
    $colsLower = array_map('strtolower', $cols ?: []);
    $nameCol = in_array('policyname', $colsLower, true) ? 'policyName' : 'name';

    $stmt = $pdo->query(
        "SELECT e.*, p.{$nameCol} as policyName, u.full_name as evaluatedByName
         FROM Evaluations e
         LEFT JOIN Policies p ON e.policyID = p.policyID
         LEFT JOIN Users u ON e.evaluatedBy = u.userID
         ORDER BY e.createdAt DESC"
    );
    $evaluations = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $evaluations]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
