<?php
/**
 * JWT đơn giản (HMAC SHA256) - PHP thuần, không dependency.
 * Chỉ dùng cho access token; production nên dùng thư viện (firebase/php-jwt).
 */

require_once dirname(__DIR__) . '/config/database.php';

function jwt_encode(array $payload): string
{
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['iat'] = time();
    $payload['exp'] = $payload['iat'] + (60 * 60 * 24 * 7); // 7 ngày

    $seg1 = base64url_encode(json_encode($header, JSON_UNESCAPED_UNICODE));
    $seg2 = base64url_encode(json_encode($payload, JSON_UNESCAPED_UNICODE));
    $sign = base64url_encode(hash_hmac('sha256', $seg1 . '.' . $seg2, JWT_SECRET, true));

    return $seg1 . '.' . $seg2 . '.' . $sign;
}

function jwt_decode(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;

    $sig = base64url_decode($parts[2]);
    if (!is_string($sig) || $sig === '') return null;

    $sign = hash_hmac('sha256', $parts[0] . '.' . $parts[1], JWT_SECRET, true);
    if (!hash_equals($sig, $sign)) return null;

    $payload = json_decode(base64url_decode($parts[1]), true);
    if (!$payload || empty($payload['exp']) || $payload['exp'] < time()) return null;

    return $payload;
}

function base64url_encode(string $data): string
{
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string
{
    $padded = strtr($data, '-_', '+/') . str_repeat('=', (4 - strlen($data) % 4) % 4);
    $decoded = base64_decode($padded, true);
    return is_string($decoded) ? $decoded : '';
}
