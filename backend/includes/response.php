<?php
/**
 * Helper gửi JSON response, CORS và security headers.
 */

require_once dirname(__DIR__) . '/config/database.php';

function get_allowed_origin(): ?string
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $origin = trim($origin);
    if ($origin === '') return null;

    $allow = defined('CORS_ORIGINS') ? (string) CORS_ORIGINS : (defined('CORS_ORIGIN') ? (string) CORS_ORIGIN : '*');
    $allow = trim($allow);
    if ($allow === '' || $allow === '*') {
        return '*';
    }

    $allowed_list = array_values(array_filter(array_map(function ($a) {
        return trim($a, " \t\r\n");
    }, explode(',', $allow))));
    foreach ($allowed_list as $a) {
        if ($a !== '' && hash_equals($a, $origin)) {
            return $origin;
        }
    }
    return null;
}

/**
 * Kiểm tra request có Origin hợp lệ (chỉ chấp nhận từ frontend đã cấu hình).
 * Khi CORS_ORIGIN/CORS_ORIGINS không phải '*': nếu có Origin thì phải khớp danh sách;
 * nếu không có Origin (request same-origin hoặc từ curl/Postman) thì cho phép để app chạy khi frontend và API cùng host:port.
 */
function is_origin_allowed_for_request(): bool
{
    $allow = defined('CORS_ORIGINS') ? (string) CORS_ORIGINS : (defined('CORS_ORIGIN') ? (string) CORS_ORIGIN : '*');
    $allow = trim($allow);
    if ($allow === '' || $allow === '*') {
        return true;
    }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $origin = trim($origin);
    if ($origin === '') {
        return true;
    }
    return get_allowed_origin() !== null;
}

function send_security_headers(): void
{
    if (function_exists('header_remove')) {
        @header_remove('X-Powered-By');
    }

    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: no-referrer');
    header('Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()');
    /** Ứng dụng dùng cá nhân: không cho công cụ tìm kiếm index */
    header('X-Robots-Tag: noindex, nofollow, noarchive', true);

    // CSP cho API JSON (thực tế chỉ áp dụng khi response được load như document)
    header("Content-Security-Policy: default-src 'none'; base-uri 'none'; frame-ancestors 'none'");

    // Dữ liệu cá nhân: tránh cache phía trình duyệt/proxy
    header('Cache-Control: no-store');
}

function send_cors_headers(): void
{
    $allowed = get_allowed_origin();
    if ($allowed === '*') {
        header('Access-Control-Allow-Origin: *');
    } elseif ($allowed) {
        header('Access-Control-Allow-Origin: ' . $allowed);
        header('Vary: Origin');
    }

    header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}

function json_response(int $code, $data): void
{
    header('Content-Type: application/json; charset=utf-8');
    send_security_headers();
    send_cors_headers();
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
}

function send_cors_preflight(): void
{
    send_security_headers();
    send_cors_headers();
    header('Access-Control-Max-Age: 86400');
    http_response_code(204);
    exit;
}
