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

$runId = trim($data['run_id'] ?? '');
// FIX: accept the value as a string first, validate it is numeric before casting
$rawPolicyId = trim($data['policy_id'] ?? '');
$period = trim($data['period'] ?? '');
$runType = trim($data['run_type'] ?? '');
$dataset = trim($data['dataset'] ?? '');
$score = (float)($data['score'] ?? 0);
$notes = trim($data['notes'] ?? '');

// FIX: explicit "not provided" check before numeric cast
if ($runId === '' || $rawPolicyId === '' || $period === '' || $runType === '' || $dataset === '') {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

if (!is_numeric($rawPolicyId) || (int)$rawPolicyId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid policy ID']);
    exit;
}

$policyID = (int)$rawPolicyId;

// Calculate band
if ($score >= 70)
    $band = 'High';
elseif ($score >= 50)
    $band = 'Moderate';
else
    $band = 'Low';

try {
    $userID = $_SESSION['userID'] ?? null;
    $date = date('d M Y');

    $stmt = $pdo->prepare(
        "INSERT INTO Evaluations
            (runId, policyID, period, runType, dataset, score, band, evaluationDate, notes, evaluatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$runId, $policyID, $period, $runType, $dataset, $score, $band, $date, $notes, $userID]);

    echo json_encode(['success' => true]);
}
catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>