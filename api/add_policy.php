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

// FIX: match actual column names in the Policies table
$policyName  = trim($data['policy_name']  ?? '');
$description = trim($data['description']  ?? '');
$category    = trim($data['category']     ?? '');
$year        = trim($data['year']         ?? '');
$agency      = trim($data['agency']       ?? '');
$targetArea  = trim($data['targetArea']   ?? '');
$status      = trim($data['status']       ?? 'active');

// FIX: status values must be lowercase to match enum('active','review','inactive')
$allowedStatuses = ['active', 'review', 'inactive'];
if (!in_array($status, $allowedStatuses)) {
    $status = 'active';
}

if (empty($policyName) || empty($category) || empty($year) || empty($agency)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "INSERT INTO Policies (policyName, description, category, year, agency, targetArea, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$policyName, $description, $category, $year, $agency, $targetArea, $status]);

    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
