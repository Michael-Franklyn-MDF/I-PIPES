<?php
session_start();
header('Content-Type: application/json');
require '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

// Get POST data (either from FormData or JSON)
$data = $_POST;
if (empty($data)) {
    $data = json_decode(file_get_contents('php://input'), true);
}

$name = trim($data['policy_name'] ?? '');
$category = trim($data['category'] ?? '');
$year = trim($data['year'] ?? '');
$agency = trim($data['agency'] ?? '');
$indicators = (int)($data['indicators'] ?? 0);
$status = trim($data['status'] ?? 'active');

$statusMap = [
    'active' => 'Active',
    'review' => 'Under review',
    'inactive' => 'Inactive'
];
$statusLabel = $statusMap[$status] ?? 'Active';

if (empty($name) || empty($category) || empty($year) || empty($agency)) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

try {
    $userID = $_SESSION['userID'] ?? null;
    
    $stmt = $pdo->prepare("INSERT INTO Policies (name, category, year, agency, indicators, status, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$name, $category, $year, $agency, $indicators, $statusLabel, $userID]);
    
    echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
