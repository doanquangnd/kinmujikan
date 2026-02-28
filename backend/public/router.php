<?php
/**
 * Router cho PHP built-in server.
 * Chạy: php -S localhost:8000 -t public public/router.php (từ thư mục backend)
 * Mọi request không trùng file thật sẽ vào index.php với path = REQUEST_URI.
 */
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
if ($path !== '/' && file_exists(__DIR__ . $path) && !is_dir(__DIR__ . $path)) {
    return false;
}
$_GET['path'] = $path ?: '/api';
require __DIR__ . '/index.php';
