<?php
session_start();
header('Content-Type: application/json');
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

$data = $_POST;
if (empty($data)) {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
}

$policyName  = trim($data['policy_name']  ?? '');
$description = trim($data['description']  ?? '');
$category    = trim($data['category']     ?? '');
$year        = trim($data['year']         ?? '');
$agency      = trim($data['agency']       ?? '');
$targetArea  = trim($data['targetArea']   ?? '');
$status      = trim($data['status']       ?? 'active');

$allowedStatuses = ['active', 'review', 'inactive'];
if (!in_array($status, $allowedStatuses)) {
    $status = 'active';
}

if (empty($policyName) || empty($category) || empty($year) || empty($agency)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    // Detect Policies column names at runtime
    $cols = $pdo->query("SHOW COLUMNS FROM Policies")->fetchAll(PDO::FETCH_COLUMN, 0);
    $colsLower = array_map('strtolower', $cols ?: []);
    $has = fn($c) => in_array(strtolower($c), $colsLower, true);

    $columns = [];
    $values  = [];

    if ($has('policyName')) {
        $columns[] = 'policyName';
        $values[]  = $policyName;
    } else {
        $columns[] = 'name';
        $values[]  = $policyName;
    }

    if ($has('description')) {
        $columns[] = 'description';
        $values[]  = $description;
    }

    $columns[] = 'category';
    $values[]  = $category;
    $columns[] = 'year';
    $values[]  = $year;
    $columns[] = 'agency';
    $values[]  = $agency;

    if ($has('targetArea')) {
        $columns[] = 'targetArea';
        $values[]  = $targetArea;
    }

    if ($has('status')) {
        $columns[] = 'status';
        $values[]  = $status;
    }

    $placeholders = implode(', ', array_fill(0, count($columns), '?'));
    $colsSql      = implode(', ', $columns);

    $stmt = $pdo->prepare("INSERT INTO Policies ({$colsSql}) VALUES ({$placeholders})");
    $stmt->execute($values);
    $newPolicyID = $pdo->lastInsertId();

    // Save indicators — uses indicatorName to match actual DB column
    $indicators = json_decode($data['indicators'] ?? '[]', true);
    if (is_array($indicators) && count($indicators) >= 3) {
        $iStmt = $pdo->prepare(
            "INSERT INTO Indicators (policyID, indicatorName, weight) VALUES (?, ?, ?)"
        );
        foreach ($indicators as $ind) {
            $iName   = trim($ind['name']   ?? '');
            $iWeight = (float)($ind['weight'] ?? 0);
            if ($iName !== '' && $iWeight > 0) {
                $iStmt->execute([$newPolicyID, $iName, $iWeight]);
            }
        }
    }

    echo json_encode(['success' => true, 'id' => $newPolicyID]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
