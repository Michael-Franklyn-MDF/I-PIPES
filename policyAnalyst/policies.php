<?php
declare(strict_types=1);
require __DIR__ . '/../auth/session.php';
ipipes_require_role('analyst', '../login/index.html');
readfile(__DIR__ . '/policies.html');

