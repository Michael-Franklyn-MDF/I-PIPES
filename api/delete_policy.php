<?php
session_start();
header('Content-Type: application/json');
require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

$data = $_POST;
if (empty($data)) {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
}

$policyId = $data['policy_id'] ?? $data['policyID'] ?? null;
$policyId = (int)$policyId;

if ($policyId <= 0) {
    echo json_encode(['error' => 'Invalid policy ID']);
    exit;
}

try {
    $stmt = $pdo->prepare('DELETE FROM Policies WHERE policyID = ?');
    $stmt->execute([$policyId]);
    echo json_encode(['success' => true]);
} catch (Throwable $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
