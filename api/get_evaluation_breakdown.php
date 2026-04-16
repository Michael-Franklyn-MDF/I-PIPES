<?php
session_start();
header('Content-Type: application/json');
require '../config/db.php';

$runId = trim($_GET['run_id'] ?? '');
$scope = strtolower(trim($_GET['scope'] ?? 'all'));

if ($runId === '') {
    echo json_encode(['success' => false, 'error' => 'Missing run_id']);
    exit;
}

try {
    $cols = $pdo->query("SHOW COLUMNS FROM Indicators")->fetchAll(PDO::FETCH_COLUMN, 0);
    $colsLower = array_map('strtolower', $cols ?: []);
    $has = fn($c) => in_array(strtolower($c), $colsLower, true);

    $nameCol = $has('indicatorname') ? 'indicatorName' : ($has('name') ? 'name' : null);
    if (!$nameCol) {
        throw new PDOException('Indicators table missing name column');
    }

    $params = ['runId' => $runId];
    $scopeSql = '';

    if ($scope === 'mine') {
        $userID = (int)($_SESSION['userID'] ?? 0);
        if ($userID <= 0) {
            echo json_encode(['success' => true, 'data' => []]);
            exit;
        }
        $scopeSql = ' AND e.evaluatedBy = :userID';
        $params['userID'] = $userID;
    }

    $sql = "
        SELECT
            i.indicatorID,
            i.{$nameCol} AS dimension,
            i.weight,
            ei.score
        FROM EvaluationIndicators ei
        INNER JOIN Evaluations e ON e.runId = ei.runId
        INNER JOIN Indicators i ON i.indicatorID = ei.indicatorID
        WHERE ei.runId = :runId{$scopeSql}
        ORDER BY i.indicatorID ASC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$row) {
        $score = (float)($row['score'] ?? 0);
        $row['band'] = $score >= 70 ? 'High' : ($score >= 50 ? 'Moderate' : 'Low');
    }
    unset($row);

    echo json_encode(['success' => true, 'data' => $rows]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
