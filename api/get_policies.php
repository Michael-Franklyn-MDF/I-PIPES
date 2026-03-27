<?php
header('Content-Type: application/json');
require_once '../config/db.php';

try {
    $cols = $pdo->query("SHOW COLUMNS FROM Policies")->fetchAll(PDO::FETCH_COLUMN, 0);
    $colsLower = array_map('strtolower', $cols ?: []);
    $has = fn($c) => in_array(strtolower($c), $colsLower, true);

    $idCol        = $has('policyid')   ? 'policyID'   : ($has('id') ? 'id' : ($has('policy_id') ? 'policy_id' : null));
    $nameCol      = $has('policyname') ? 'policyName' : ($has('name') ? 'name' : null);
    $targetCol    = $has('targetarea') ? 'targetArea' : ($has('target_area') ? 'target_area' : null);
    $dateCol      = $has('datecreated')? 'dateCreated': ($has('created_at') ? 'created_at' : null);
    $statusCol    = $has('status')     ? 'status'     : null;
    $categoryCol  = $has('category')   ? 'category'   : null;
    $yearCol      = $has('year')       ? 'year'       : null;
    $agencyCol    = $has('agency')     ? 'agency'     : null;
    $descCol      = $has('description')? 'description': null;

    $selectParts = [
        ($idCol       ? "`{$idCol}`"       : "NULL") . " AS policyID",
        ($nameCol     ? "`{$nameCol}`"     : "NULL") . " AS policyName",
        ($descCol     ? "`{$descCol}`"     : "NULL") . " AS description",
        ($targetCol   ? "`{$targetCol}`"   : "NULL") . " AS targetArea",
        ($dateCol     ? "`{$dateCol}`"     : "NULL") . " AS dateCreated",
        ($statusCol   ? "`{$statusCol}`"   : "NULL") . " AS status",
        ($categoryCol ? "`{$categoryCol}`" : "NULL") . " AS category",
        ($yearCol     ? "`{$yearCol}`"     : "NULL") . " AS year",
        ($agencyCol   ? "`{$agencyCol}`"   : "NULL") . " AS agency",
    ];

    $orderBy = $dateCol ? " ORDER BY `{$dateCol}` DESC" : "";
    $sql = "SELECT " . implode(', ', $selectParts) . " FROM Policies" . $orderBy;
    $stmt = $pdo->query($sql);
    $policies = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($policies);
} catch (Throwable $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
