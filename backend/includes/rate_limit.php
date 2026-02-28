<?php
/**
 * Giới hạn tần suất request theo IP (file-based).
 * - Login: tối đa 3 lần / phút.
 * - Đăng ký: tối đa 1 lần / 2 phút.
 */

require_once dirname(__DIR__) . '/includes/response.php';

function rate_limit_storage_dir(): string
{
    $dir = dirname(__DIR__) . '/storage/rate_limit';
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    return $dir;
}

function rate_limit_client_key(): string
{
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($forwarded !== '') {
        $ips = array_map('trim', explode(',', $forwarded));
        $ip = $ips[0] ?? $ip;
    }
    return preg_replace('/[^a-fA-F0-9]/', '', md5($ip)) ?: 'unknown';
}

/**
 * Kiểm tra và tăng bộ đếm đăng nhập. Trả về true nếu được phép, gửi 429 và exit nếu vượt.
 */
function rate_limit_login(): void
{
    $key = rate_limit_client_key();
    $dir = rate_limit_storage_dir();
    $file = $dir . '/login_' . $key . '.json';
    $now = time();
    $window = 60; // 1 phút
    $max = 3;

    $attempts = [];
    if (is_file($file)) {
        $data = @json_decode(file_get_contents($file), true);
        if (is_array($data['attempts'] ?? null)) {
            foreach ($data['attempts'] as $ts) {
                if ($now - (int) $ts < $window) {
                    $attempts[] = (int) $ts;
                }
            }
        }
    }

    if (count($attempts) >= $max) {
        json_response(429, ['error' => 'Too Many Requests', 'message' => 'Đăng nhập tối đa 3 lần mỗi phút. Vui lòng thử lại sau.']);
        exit;
    }

    $attempts[] = $now;
    @file_put_contents($file, json_encode(['attempts' => $attempts]), LOCK_EX);
}

/**
 * Kiểm tra và ghi nhận lần đăng ký. Trả về nếu được phép, gửi 429 và exit nếu chưa đủ 2 phút.
 */
function rate_limit_register(): void
{
    $key = rate_limit_client_key();
    $dir = rate_limit_storage_dir();
    $file = $dir . '/register_' . $key . '.json';
    $now = time();
    $cooldown = 120; // 2 phút

    $last = null;
    if (is_file($file)) {
        $data = @json_decode(file_get_contents($file), true);
        $last = isset($data['last_at']) ? (int) $data['last_at'] : null;
    }

    if ($last !== null && ($now - $last) < $cooldown) {
        $retry_after = $cooldown - ($now - $last);
        header('Retry-After: ' . (string) $retry_after);
        json_response(429, ['error' => 'Too Many Requests', 'message' => 'Đăng ký giới hạn 1 lần mỗi 2 phút. Vui lòng thử lại sau.']);
        exit;
    }

    @file_put_contents($file, json_encode(['last_at' => $now]), LOCK_EX);
}
