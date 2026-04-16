<?php
session_start();
header('Content-Type: application/json');
require '../config/db.php';

try {
    // Schema compatibility: Policies name column may be `policyName` or `name`.
    $cols = $pdo->query("SHOW COLUMNS FROM Policies")->fetchAll(PDO::FETCH_COLUMN, 0);
    $colsLower = array_map('strtolower', $cols ?: []);
    $nameCol = in_array('policyname', $colsLower, true) ? 'policyName' : 'name';

    $scope = strtolower(trim($_GET['scope'] ?? 'all'));
    $params = [];
    $where = '';

    if ($scope === 'mine') {
        $userID = (int)($_SESSION['userID'] ?? 0);
        if ($userID <= 0) {
            echo json_encode(['success' => true, 'data' => []]);
            exit;
        }
        $where = 'WHERE e.evaluatedBy = :userID';
        $params['userID'] = $userID;
    }

    $sql = "
        SELECT
            e.*,
            p.{$nameCol} AS policyName,
            u.full_name AS evaluatedByName
        FROM Evaluations e
        LEFT JOIN Policies p ON e.policyID = p.policyID
        LEFT JOIN Users u ON e.evaluatedBy = u.userID
        {$where}
        ORDER BY
            e.createdAt DESC,
            STR_TO_DATE(e.evaluationDate, '%d %b %Y') DESC,
            e.runId DESC
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $evaluations = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $evaluations]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
