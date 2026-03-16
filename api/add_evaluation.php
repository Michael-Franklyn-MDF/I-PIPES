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
    $data = json_decode(file_get_contents('php://input'), true);
}

$runId = trim($data['run_id'] ?? '');
$policyID = (int)($data['policy_id'] ?? 0);
$period = trim($data['period'] ?? '');
$runType = trim($data['run_type'] ?? '');
$dataset = trim($data['dataset'] ?? '');
$score = (float)($data['score'] ?? 0);
$notes = trim($data['notes'] ?? '');

if (empty($runId) || empty($policyID) || empty($period) || empty($runType) || empty($dataset)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

// Calculate Band
$band = 'Low';
if ($score >= 70) $band = 'High';
elseif ($score >= 50) $band = 'Moderate';

try {
    $userID = $_SESSION['userID'] ?? null;
    $date = date('d M Y');
    
    $stmt = $pdo->prepare("INSERT INTO Evaluations (runId, policyID, period, runType, dataset, score, band, evaluationDate, notes, evaluatedBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$runId, $policyID, $period, $runType, $dataset, $score, $band, $date, $notes, $userID]);
    
    echo json_encode(['success' => true]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
