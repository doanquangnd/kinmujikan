<?php
/**
 * Entry point API. Routing đơn giản theo METHOD và path.
 * Cấu hình server: document root = public/, mọi request (trừ file tĩnh) trỏ về index.php.
 * Ví dụ Apache: FallbackResource /index.php hoặc RewriteRule ^(.*)$ index.php?path=$1
 */

require_once dirname(__DIR__) . '/includes/response.php';
require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/includes/logger.php';

// Giảm rò rỉ thông tin lỗi ra client (production). Lỗi chi tiết nên xem ở log.
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');
@ini_set('error_log', app_log_path());
@ini_set('expose_php', '0');

set_exception_handler(function (Throwable $e) {
    log_exception($e, [
        'method' => $_SERVER['REQUEST_METHOD'] ?? null,
        'path' => $_SERVER['REQUEST_URI'] ?? null,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);
    json_response(500, ['error' => 'Internal Server Error']);
});
set_error_handler(function ($severity, $message, $file, $line) {
    // Chỉ convert warning/error thành exception để gom một chỗ, tránh lộ thông tin
    throw new ErrorException($message, 0, $severity, $file, $line);
});
register_shutdown_function(function () {
    $err = error_get_last();
    if (!$err) return;

    $fatal_types = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];
    if (!in_array($err['type'] ?? 0, $fatal_types, true)) return;

    log_error_message('Fatal error', [
        'type' => $err['type'] ?? null,
        'message' => $err['message'] ?? null,
        'file' => $err['file'] ?? null,
        'line' => $err['line'] ?? null,
        'method' => $_SERVER['REQUEST_METHOD'] ?? null,
        'path' => $_SERVER['REQUEST_URI'] ?? null,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
    ]);
});

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    send_cors_preflight();
}

// Chỉ chấp nhận request từ frontend (Origin khớp CORS_ORIGIN)
if (!is_origin_allowed_for_request()) {
    $payload = ['error' => 'Forbidden', 'message' => 'Chỉ chấp nhận request từ nguồn được phép'];
    if (defined('APP_ENV') && APP_ENV === 'development') {
        $payload['debug_origin_received'] = $_SERVER['HTTP_ORIGIN'] ?? '(không có)';
    }
    json_response(403, $payload);
    exit;
}

// Chặn bot quét: từ chối User-Agent phổ biến của crawler/scanner
$ua = (string) ($_SERVER['HTTP_USER_AGENT'] ?? '');
$blocked_ua_patterns = ['bot', 'crawler', 'spider', 'scanner', 'googlebot', 'bingbot', 'yandexbot', 'baiduspider', 'facebookexternalhit'];
$ua_lower = strtolower($ua);
foreach ($blocked_ua_patterns as $p) {
    if ($p !== '' && str_contains($ua_lower, $p)) {
        json_response(403, ['error' => 'Forbidden']);
        exit;
    }
}

$path = $_GET['path'] ?? $_SERVER['PATH_INFO'] ?? $_SERVER['REQUEST_URI'] ?? '';
$path = preg_replace('#\?.*$#', '', $path);
$path = '/' . trim($path, '/');
if ($path === '/') $path = '/api';

$method = $_SERVER['REQUEST_METHOD'];

// Chuyển path vào GET để các file con có thể dùng (ví dụ update.php cần id)
$_GET['_path'] = $path;

$router = [
    'POST' => [
        '/api/auth/register' => '/api/auth/register.php',
        '/api/auth/login' => '/api/auth/login.php',
        '/api/auth/change-password' => '/api/auth/change-password.php',
        '/api/work-records' => '/api/work-records/create.php',
    ],
    'GET' => [
        '/api' => '/api/health.php',
        '/api/auth/me' => '/api/auth/me.php',
        '/api/work-records' => '/api/work-records/index.php',
    ],
    'PUT' => [
        '/api/work-records' => '/api/work-records/update.php',
    ],
];

$file = null;
if ($method === 'GET' && strpos($path, '/api/work-records') === 0) {
    $file = $router['GET']['/api/work-records'];
} else {
    $file = $router[$method][$path] ?? null;
}
if (!$file) {
    json_response(404, ['error' => 'Not Found', 'path' => $path]);
    exit;
}

require dirname(__DIR__) . $file;
