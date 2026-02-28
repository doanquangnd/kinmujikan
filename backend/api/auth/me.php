<?php
/**
 * GET /api/auth/me
 * Trả thông tin user từ JWT (để frontend khôi phục session).
 */

require_once dirname(__DIR__, 2) . '/includes/db.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';
require_once dirname(__DIR__, 2) . '/includes/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(405, ['error' => 'Method Not Allowed']);
    exit;
}

$user_id = get_current_user_id();
if ($user_id === null) {
    json_response(401, ['error' => 'Unauthorized']);
    exit;
}

$pdo = get_pdo();
$stmt = $pdo->prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$user = $stmt->fetch();
if (!$user) {
    json_response(401, ['error' => 'Unauthorized']);
    exit;
}

$user['id'] = (int) $user['id'];
json_response(200, ['user' => $user]);
