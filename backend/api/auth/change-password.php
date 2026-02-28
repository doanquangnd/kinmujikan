<?php
/**
 * POST /api/auth/change-password
 * Body: current_password, new_password
 * Yêu cầu đăng nhập (Bearer token).
 */

require_once dirname(__DIR__, 2) . '/includes/db.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';
require_once dirname(__DIR__, 2) . '/includes/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['error' => 'Method Not Allowed']);
    exit;
}

$user_id = require_auth();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$current = $body['current_password'] ?? '';
$new = $body['new_password'] ?? '';

if ($current === '' || $new === '') {
    json_response(422, ['error' => 'Validation failed', 'message' => 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc']);
    exit;
}

if (strlen($new) < 6) {
    json_response(422, ['error' => 'Validation failed', 'message' => 'Mật khẩu mới tối thiểu 6 ký tự']);
    exit;
}

$pdo = get_pdo();
$stmt = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?');
$stmt->execute([$user_id]);
$row = $stmt->fetch();

if (!$row || !password_verify($current, $row['password_hash'])) {
    json_response(401, ['error' => 'Unauthorized', 'message' => 'Mật khẩu hiện tại không đúng']);
    exit;
}

$hash = password_hash($new, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
$stmt->execute([$hash, $user_id]);

json_response(200, ['message' => 'Đã đổi mật khẩu']);
