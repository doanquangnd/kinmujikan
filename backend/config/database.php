<?php
/**
 * Cấu hình kết nối MySQL.
 * Đọc từ biến môi trường hoặc file .env đơn giản.
 */

date_default_timezone_set('Asia/Tokyo');

$env_file = dirname(__DIR__) . '/.env';
if (is_file($env_file)) {
    $lines = file($env_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') === false) continue;
        list($key, $val) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($val, " \t\"'\r\n");
    }
}

defined('DB_HOST') || define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
defined('DB_NAME') || define('DB_NAME', $_ENV['DB_NAME'] ?? 'kinmu_jikan');
defined('DB_USER') || define('DB_USER', $_ENV['DB_USER'] ?? 'root');
defined('DB_PASS') || define('DB_PASS', $_ENV['DB_PASS'] ?? '');
defined('JWT_SECRET') || define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'change-me-in-production');
defined('APP_ENV') || define('APP_ENV', $_ENV['APP_ENV'] ?? 'production');

// CORS_ORIGINS: danh sách origin, phân tách bằng dấu phẩy (ví dụ: https://a.com,https://b.com)
// Tương thích ngược: nếu chỉ có CORS_ORIGIN thì dùng giá trị đó.
defined('CORS_ORIGINS') || define('CORS_ORIGINS', $_ENV['CORS_ORIGINS'] ?? ($_ENV['CORS_ORIGIN'] ?? '*'));

// Cloudflare Turnstile: secret key để verify token (lấy từ Cloudflare Dashboard)
defined('TURNSTILE_SECRET') || define('TURNSTILE_SECRET', $_ENV['TURNSTILE_SECRET'] ?? '');
