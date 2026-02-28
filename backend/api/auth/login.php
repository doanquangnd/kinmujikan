<?php
/**
 * POST /api/auth/login
 * Body: email, password, turnstile_response (token Cloudflare Turnstile)
 * Trả về: token, user
 */

require_once dirname(__DIR__, 2) . '/includes/db.php';
require_once dirname(__DIR__, 2) . '/includes/jwt.php';
require_once dirname(__DIR__, 2) . '/includes/response.php';
require_once dirname(__DIR__, 2) . '/includes/rate_limit.php';
require_once dirname(__DIR__, 2) . '/includes/turnstile.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['error' => 'Method Not Allowed']);
    exit;
}

rate_limit_login();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$turnstile_token = trim((string) ($body['turnstile_response'] ?? $body['cf-turnstile-response'] ?? ''));
if (!turnstile_verify($turnstile_token)) {
    json_response(400, ['error' => 'Bad Request', 'message' => 'Xác thực bảo mật không hợp lệ. Vui lòng thử lại.']);
    exit;
}

$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';

if ($email === '' || $password === '') {
    json_response(422, ['error' => 'Validation failed', 'message' => 'Email và mật khẩu là bắt buộc']);
    exit;
}

$pdo = get_pdo();
$stmt = $pdo->prepare('SELECT id, email, password_hash, display_name FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(401, ['error' => 'Unauthorized', 'message' => 'Email hoặc mật khẩu không đúng']);
    exit;
}

unset($user['password_hash']);
$user['id'] = (int) $user['id'];

$token = jwt_encode(['sub' => (string) $user['id']]);

json_response(200, ['token' => $token, 'user' => $user]);
