<?php
header('Content-Type: application/json');
require '../config/db.php';

try {
    // Schema compatibility: detect column names at runtime.
    $cols = $pdo->query("SHOW COLUMNS FROM Policies")->fetchAll(PDO::FETCH_COLUMN, 0);
    $colsLower = array_map('strtolower', $cols ?: []);
    $has = fn($c) => in_array(strtolower($c), $colsLower, true);

    $nameCol = $has('policyName') ? 'policyName' : 'name';
    $descSel = $has('description') ? 'description' : "'' AS description";
    $targetSel = $has('targetArea') ? 'targetArea' : "'' AS targetArea";
    $dateCol = $has('dateCreated') ? 'dateCreated' : ($has('createdAt') ? 'createdAt' : 'NULL');

    $stmt = $pdo->query(
        "SELECT policyID,
                {$nameCol} AS name,
                {$descSel},
                category,
                year,
                agency,
                {$targetSel},
                status,
                {$dateCol} AS createdAt
         FROM Policies
         ORDER BY {$dateCol} DESC"
    );
    $policies = $stmt->fetchAll();

    // Map status values to display labels for the frontend (supports old/new values)
    $statusMap = [
        'active'   => ['label' => 'Active',       'cls' => 'badge-active'],
        'review'   => ['label' => 'Under review',  'cls' => 'badge-review'],
        'inactive' => ['label' => 'Inactive',      'cls' => 'badge-inactive'],
    ];

    foreach ($policies as &$p) {
        $raw = strtolower(trim((string)($p['status'] ?? 'active')));
        if ($raw === 'under review') $raw = 'review';
        $s = $statusMap[$raw] ?? $statusMap['active'];
        $p['statusLabel'] = $s['label'];
        $p['statusCls']   = $s['cls'];
        // indicators column doesn't exist in new schema — default to 0
        $p['indicators']  = 0;
    }

    echo json_encode(['success' => true, 'data' => $policies]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
