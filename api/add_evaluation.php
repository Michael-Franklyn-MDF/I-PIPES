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

$runId     = trim($data['run_id']    ?? '');
$rawPolicyId = trim($data['policy_id'] ?? '');
$period    = trim($data['period']    ?? '');
$runType   = trim($data['run_type']  ?? '');
$dataset   = trim($data['dataset']   ?? '');
$notes     = trim($data['notes']     ?? '');

if ($rawPolicyId === '' || $period === '' || $runType === '' || $dataset === '') {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}
if (!is_numeric($rawPolicyId) || (int)$rawPolicyId <= 0) {
    echo json_encode(['success' => false, 'error' => 'Invalid policy ID']);
    exit;
}

$policyID = (int)$rawPolicyId;

// Indicator scores sent as JSON array
$indicatorScores = json_decode($data['indicator_scores'] ?? '[]', true);
if (!is_array($indicatorScores) || count($indicatorScores) < 1) {
    echo json_encode(['success' => false, 'error' => 'No indicator scores provided']);
    exit;
}

function generateNextRunId(PDO $pdo): string {
    $year = date('Y');
    $stmt = $pdo->query("SELECT runId FROM Evaluations ORDER BY createdAt DESC, runId DESC");
    $runIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $max = 0;
    foreach ($runIds as $existingRunId) {
        if (preg_match('/^EV-' . preg_quote($year, '/') . '-(\d+)$/', (string)$existingRunId, $matches)) {
            $max = max($max, (int)$matches[1]);
        }
    }

    return sprintf('EV-%s-%03d', $year, $max + 1);
}

try {
    if ($runId === '') {
        $runId = generateNextRunId($pdo);
    } else {
        $chk = $pdo->prepare("SELECT COUNT(*) FROM Evaluations WHERE runId = ?");
        $chk->execute([$runId]);
        if ((int)$chk->fetchColumn() > 0) {
            $runId = generateNextRunId($pdo);
        }
    }

    // Fetch the indicators for this policy to get their weights
    $iStmt = $pdo->prepare(
        "SELECT indicatorID, weight FROM Indicators WHERE policyID = ?"
    );
    $iStmt->execute([$policyID]);
    $dbIndicators = $iStmt->fetchAll(PDO::FETCH_KEY_PAIR); // indicatorID => weight

    if (empty($dbIndicators)) {
        echo json_encode(['success' => false, 'error' => 'This policy has no indicators defined']);
        exit;
    }

    // Build the saved indicator payload while computing the weighted total.
    $weightedScore = 0.0;
    $totalWeight   = 0.0;
    $scoresToSave  = [];

    foreach ($indicatorScores as $entry) {
        $iID    = (int)($entry['indicatorID'] ?? 0);
        $iScore = min(100, max(0, (float)($entry['score'] ?? 0)));

        if (isset($dbIndicators[$iID])) {
            $weight        = (float)$dbIndicators[$iID];
            $weightedScore += $iScore * ($weight / 100);
            $totalWeight   += $weight;
            $scoresToSave[] = ['indicatorID' => $iID, 'score' => $iScore];
        }
    }

    // Normalise in case weights don't perfectly sum to 100 due to rounding
    if ($totalWeight > 0 && abs($totalWeight - 100) > 0.5) {
        $weightedScore = ($weightedScore / $totalWeight) * 100;
    }

    $score = round($weightedScore, 2);
    $band  = $score >= 70 ? 'High' : ($score >= 50 ? 'Moderate' : 'Low');
    $date  = date('d M Y');
    $userID = $_SESSION['userID'] ?? null;

    // Insert evaluation
    $stmt = $pdo->prepare(
        "INSERT INTO Evaluations
            (runId, policyID, period, runType, dataset, score, band, evaluationDate, notes, evaluatedBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->execute([$runId, $policyID, $period, $runType, $dataset, $score, $band, $date, $notes, $userID]);

    // Insert per-indicator scores
    $eiStmt = $pdo->prepare(
        "INSERT INTO EvaluationIndicators (runId, indicatorID, score) VALUES (?, ?, ?)"
    );
    foreach ($scoresToSave as $s) {
        $eiStmt->execute([$runId, $s['indicatorID'], $s['score']]);
    }

    echo json_encode(['success' => true, 'runId' => $runId, 'score' => $score, 'band' => $band]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?>
