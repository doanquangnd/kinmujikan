<?php
/**
 * Xác thực Cloudflare Turnstile token (Siteverify API).
 */

require_once dirname(__DIR__) . '/config/database.php';
require_once dirname(__DIR__) . '/includes/response.php';

function turnstile_verify(string $token): bool
{
    $secret = defined('TURNSTILE_SECRET') ? (string) TURNSTILE_SECRET : '';
    if ($secret === '') {
        return true; // Tắt xác thực khi chưa cấu hình
    }

    if ($token === '') {
        return false;
    }

    $remote_ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $body = http_build_query([
        'secret' => $secret,
        'response' => $token,
        'remoteip' => $remote_ip,
    ]);

    $ctx = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => 'Content-Type: application/x-www-form-urlencoded',
            'content' => $body,
            'timeout' => 10,
        ],
    ]);

    $response = @file_get_contents('https://challenges.cloudflare.com/turnstile/v0/siteverify', false, $ctx);
    if ($response === false) {
        return false;
    }

    $data = json_decode($response, true);
    return isset($data['success']) && $data['success'] === true;
}
