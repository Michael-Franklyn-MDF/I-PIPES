<?php
declare(strict_types=1);

require __DIR__ . '/../auth/session.php';
require __DIR__ . '/../config/db.php';

function api_json(int $status, array $payload): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload);
    exit;
}

function api_read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function api_require_admin(): array
{
    return ipipes_require_role('admin', '../login/index.html');
}

