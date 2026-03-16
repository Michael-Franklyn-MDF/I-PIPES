<?php
declare(strict_types=1);

require __DIR__ . '/_helpers.php';

api_require_admin();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT policyID, name, category, year, agency, status FROM Policies ORDER BY policyID DESC");
        api_json(200, ['ok' => true, 'policies' => $stmt->fetchAll()]);
    }

    if ($method === 'POST') {
        $body = api_read_json_body();
        $name = trim((string)($body['name'] ?? ''));
        $category = trim((string)($body['category'] ?? ''));
        $year = (int)($body['year'] ?? 0);
        $agency = trim((string)($body['agency'] ?? ''));
        $status = trim((string)($body['status'] ?? 'Active'));

        if ($name === '' || $category === '' || $year <= 0 || $agency === '') {
            api_json(400, ['ok' => false, 'error' => 'name, category, year, agency are required']);
        }

        $ins = $pdo->prepare("INSERT INTO Policies (name, category, year, agency, status) VALUES (?, ?, ?, ?, ?)");
        $ins->execute([$name, $category, $year, $agency, $status]);
        api_json(201, ['ok' => true, 'policyID' => (int)$pdo->lastInsertId()]);
    }

    if ($method === 'PUT') {
        $body = api_read_json_body();
        $policyID = (int)($body['policyID'] ?? 0);
        if ($policyID <= 0) api_json(400, ['ok' => false, 'error' => 'policyID required']);

        $fields = [];
        $params = [];

        foreach (['name', 'category', 'agency', 'status'] as $key) {
            if (array_key_exists($key, $body)) {
                $val = trim((string)$body[$key]);
                $fields[] = "$key = ?";
                $params[] = $val;
            }
        }
        if (array_key_exists('year', $body)) {
            $fields[] = "year = ?";
            $params[] = (int)$body['year'];
        }
        if (!$fields) api_json(400, ['ok' => false, 'error' => 'no fields to update']);

        $params[] = $policyID;
        $sql = "UPDATE Policies SET " . implode(', ', $fields) . " WHERE policyID = ?";
        $upd = $pdo->prepare($sql);
        $upd->execute($params);
        api_json(200, ['ok' => true]);
    }

    if ($method === 'DELETE') {
        $body = api_read_json_body();
        $policyID = (int)($body['policyID'] ?? 0);
        if ($policyID <= 0) api_json(400, ['ok' => false, 'error' => 'policyID required']);

        $del = $pdo->prepare("DELETE FROM Policies WHERE policyID = ?");
        $del->execute([$policyID]);
        api_json(200, ['ok' => true]);
    }

    api_json(405, ['ok' => false, 'error' => 'method not allowed']);
} catch (Throwable $e) {
    api_json(500, ['ok' => false, 'error' => $e->getMessage()]);
}

