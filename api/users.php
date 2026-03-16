<?php
declare(strict_types=1);

require __DIR__ . '/_helpers.php';

api_require_admin();

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

try {
    if ($method === 'GET') {
        $stmt = $pdo->query("SELECT userID, username, role FROM Users ORDER BY userID DESC");
        api_json(200, ['ok' => true, 'users' => $stmt->fetchAll()]);
    }

    if ($method === 'POST') {
        $body = api_read_json_body();
        $username = trim((string)($body['username'] ?? ''));
        $password = (string)($body['password'] ?? '');
        $role = trim((string)($body['role'] ?? 'researcher'));

        if ($username === '' || $password === '') {
            api_json(400, ['ok' => false, 'error' => 'username and password are required']);
        }
        if (!in_array($role, ['admin', 'analyst', 'researcher'], true)) {
            api_json(400, ['ok' => false, 'error' => 'invalid role']);
        }

        $check = $pdo->prepare("SELECT userID FROM Users WHERE username = ?");
        $check->execute([$username]);
        if ($check->fetch()) {
            api_json(409, ['ok' => false, 'error' => 'username already exists']);
        }

        $hash = md5($password);
        $ins = $pdo->prepare("INSERT INTO Users (username, password, role) VALUES (?, ?, ?)");
        $ins->execute([$username, $hash, $role]);
        api_json(201, ['ok' => true, 'userID' => (int)$pdo->lastInsertId()]);
    }

    if ($method === 'PUT') {
        $body = api_read_json_body();
        $userID = (int)($body['userID'] ?? 0);
        $role = isset($body['role']) ? trim((string)$body['role']) : null;
        $password = isset($body['password']) ? (string)$body['password'] : null;

        if ($userID <= 0) api_json(400, ['ok' => false, 'error' => 'userID required']);

        $fields = [];
        $params = [];

        if ($role !== null) {
            if (!in_array($role, ['admin', 'analyst', 'researcher'], true)) {
                api_json(400, ['ok' => false, 'error' => 'invalid role']);
            }
            $fields[] = "role = ?";
            $params[] = $role;
        }
        if ($password !== null && $password !== '') {
            $fields[] = "password = ?";
            $params[] = md5($password);
        }

        if (!$fields) api_json(400, ['ok' => false, 'error' => 'no fields to update']);

        $params[] = $userID;
        $sql = "UPDATE Users SET " . implode(', ', $fields) . " WHERE userID = ?";
        $upd = $pdo->prepare($sql);
        $upd->execute($params);
        api_json(200, ['ok' => true]);
    }

    if ($method === 'DELETE') {
        $body = api_read_json_body();
        $userID = (int)($body['userID'] ?? 0);
        if ($userID <= 0) api_json(400, ['ok' => false, 'error' => 'userID required']);

        $del = $pdo->prepare("DELETE FROM Users WHERE userID = ?");
        $del->execute([$userID]);
        api_json(200, ['ok' => true]);
    }

    api_json(405, ['ok' => false, 'error' => 'method not allowed']);
} catch (Throwable $e) {
    api_json(500, ['ok' => false, 'error' => $e->getMessage()]);
}

