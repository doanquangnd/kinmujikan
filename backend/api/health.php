<?php
/**
 * Healthcheck đơn giản cho backend.
 * GET /api
 */

require_once dirname(__DIR__) . '/includes/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(405, ['error' => 'Method Not Allowed']);
    exit;
}

json_response(200, ['status' => 'ok']);

