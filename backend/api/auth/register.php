<?php
/**
 * POST /api/auth/register
 * Body: email, password, display_name?, turnstile_response (token Cloudflare Turnstile)
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

rate_limit_register();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$turnstile_token = trim((string) ($body['turnstile_response'] ?? $body['cf-turnstile-response'] ?? ''));
if (!turnstile_verify($turnstile_token)) {
    json_response(400, ['error' => 'Bad Request', 'message' => 'Xác thực bảo mật không hợp lệ. Vui lòng thử lại.']);
    exit;
}

$email = trim($body['email'] ?? '');
$password = $body['password'] ?? '';
$display_name = isset($body['display_name']) ? trim($body['display_name']) : null;

$errors = [];
if ($email === '') $errors[] = 'email là bắt buộc';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email không hợp lệ';
if (strlen($password) < 6) $errors[] = 'mật khẩu tối thiểu 6 ký tự';

if (!empty($errors)) {
    json_response(422, ['error' => 'Validation failed', 'errors' => $errors]);
    exit;
}

$pdo = get_pdo();

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    json_response(409, ['error' => 'Conflict', 'message' => 'Email đã được sử dụng']);
    exit;
}

$password_hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)');
$stmt->execute([$email, $password_hash, $display_name]);

$id = (int) $pdo->lastInsertId();
$stmt = $pdo->prepare('SELECT id, email, display_name, created_at FROM users WHERE id = ?');
$stmt->execute([$id]);
$user = $stmt->fetch();
$user['id'] = (int) $user['id'];

$token = jwt_encode(['sub' => (string) $id]);
json_response(201, ['token' => $token, 'user' => $user]);
