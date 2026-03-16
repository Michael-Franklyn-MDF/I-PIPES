<?php
header('Content-Type: application/json');
require '../config/db.php';

try {
    // FIX: removed JOIN on createdBy (column doesn't exist), use actual column names
    $stmt = $pdo->query(
        "SELECT policyID, policyName AS name, description, category, year, agency, targetArea, status, dateCreated AS createdAt
         FROM Policies
         ORDER BY dateCreated DESC"
    );
    $policies = $stmt->fetchAll();

    // FIX: map lowercase status enum values to display labels for the frontend
    $statusMap = [
        'active'   => ['label' => 'Active',       'cls' => 'badge-active'],
        'review'   => ['label' => 'Under review',  'cls' => 'badge-review'],
        'inactive' => ['label' => 'Inactive',      'cls' => 'badge-inactive'],
    ];

    foreach ($policies as &$p) {
        $s = $statusMap[$p['status']] ?? $statusMap['active'];
        $p['statusLabel'] = $s['label'];
        $p['statusCls']   = $s['cls'];
        // indicators column doesn't exist — default to 0
        $p['indicators']  = 0;
    }

    echo json_encode(['success' => true, 'data' => $policies]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
