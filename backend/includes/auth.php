<?php
/**
 * Lấy user hiện tại từ header Authorization: Bearer <token>.
 * Trả về mảng user hoặc null; gửi 401 và dừng nếu bắt buộc đăng nhập.
 */

require_once __DIR__ . '/jwt.php';

function get_current_user_id(): ?int
{
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/', $auth, $m)) {
        $payload = jwt_decode(trim($m[1]));
        if ($payload && !empty($payload['sub'])) {
            return (int) $payload['sub'];
        }
    }
    return null;
}

function require_auth(): int
{
    $user_id = get_current_user_id();
    if ($user_id === null) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized', 'message' => 'Token không hợp lệ hoặc hết hạn']);
        exit;
    }
    return $user_id;
}
