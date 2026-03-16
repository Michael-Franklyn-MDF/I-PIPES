<?php
declare(strict_types=1);

function ipipes_session_start(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function ipipes_current_user(): ?array
{
    ipipes_session_start();
    if (empty($_SESSION['userID'])) {
        return null;
    }

    return [
        'userID' => $_SESSION['userID'] ?? null,
        'username' => $_SESSION['username'] ?? null,
        'role' => $_SESSION['role'] ?? null,
    ];
}

function ipipes_require_login(string $redirectTo = '../login/index.html'): array
{
    $user = ipipes_current_user();
    if ($user === null) {
        header('Location: ' . $redirectTo . '?error=Please log in');
        exit;
    }
    return $user;
}

function ipipes_require_role(array|string $roles, string $redirectTo = '../login/index.html'): array
{
    $user = ipipes_require_login($redirectTo);
    $allowed = is_array($roles) ? $roles : [$roles];
    if (!in_array(($user['role'] ?? null), $allowed, true)) {
        header('Location: ' . $redirectTo . '?error=Access denied');
        exit;
    }
    return $user;
}

function ipipes_logout(string $redirectTo = 'login/index.html'): void
{
    ipipes_session_start();

    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool)$params['secure'], (bool)$params['httponly']);
    }

    session_destroy();
    header('Location: ' . $redirectTo);
    exit;
}

