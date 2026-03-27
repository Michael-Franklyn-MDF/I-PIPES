<?php
header('Content-Type: application/json');
require '../config/db.php';

$policyID = (int)($_GET['policy_id'] ?? 0);
if (!$policyID) {
    echo json_encode(['success' => false, 'error' => 'Missing policy_id']);
    exit;
}

try {
    $cols = $pdo->query("SHOW COLUMNS FROM Indicators")->fetchAll(PDO::FETCH_COLUMN, 0);
    $colsLower = array_map('strtolower', $cols ?: []);
    $has = fn($c) => in_array(strtolower($c), $colsLower, true);

    $nameCol = $has('indicatorname') ? 'indicatorName' : ($has('name') ? 'name' : null);
    if (!$nameCol) throw new PDOException('Indicators table missing name column');

    $stmt = $pdo->prepare(
        "SELECT indicatorID, {$nameCol} AS name, weight
         FROM Indicators WHERE policyID = ? ORDER BY indicatorID ASC"
    );
    $stmt->execute([$policyID]);
    $indicators = $stmt->fetchAll();
    echo json_encode(['success' => true, 'data' => $indicators]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
