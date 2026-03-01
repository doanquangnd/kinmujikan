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
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || $line[0] === ';') continue;
        if (strpos($line, '=') === false) continue;
        list($key, $val) = explode('=', $line, 2);
        $val = trim($val, " \t\"'\r\n");
        $val = preg_replace('/\s*;.*$/', '', $val);
        $val = trim($val);
        $_ENV[trim($key)] = $val;
    }
}

defined('DB_HOST') || define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
defined('DB_NAME') || define('DB_NAME', $_ENV['DB_NAME'] ?? 'kinmu_jikan');
defined('DB_USER') || define('DB_USER', $_ENV['DB_USER'] ?? 'root');
defined('DB_PASS') || define('DB_PASS', $_ENV['DB_PASS'] ?? '');
defined('JWT_SECRET') || define('JWT_SECRET', $_ENV['JWT_SECRET'] ?? 'change-me-in-production');
defined('APP_ENV') || define('APP_ENV', $_ENV['APP_ENV'] ?? 'production');

// CORS: bật/tắt giới hạn origin. 1 = chỉ chấp nhận origin trong CORS_ORIGINS; 0 hoặc để trống = cho phép mọi origin (*).
defined('CORS_RESTRICT_ORIGIN') || define('CORS_RESTRICT_ORIGIN', isset($_ENV['CORS_RESTRICT_ORIGIN']) ? (string) $_ENV['CORS_RESTRICT_ORIGIN'] : '0');
// CORS_ORIGINS: danh sách origin được phép khi CORS_RESTRICT_ORIGIN=1 (phân tách bằng dấu phẩy).
defined('CORS_ORIGINS') || define('CORS_ORIGINS', $_ENV['CORS_ORIGINS'] ?? ($_ENV['CORS_ORIGIN'] ?? ''));

// Cloudflare Turnstile: secret key để verify token (lấy từ Cloudflare Dashboard)
defined('TURNSTILE_SECRET') || define('TURNSTILE_SECRET', $_ENV['TURNSTILE_SECRET'] ?? '');
