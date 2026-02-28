<?php
/**
 * Ghi lỗi ra file log (không phụ thuộc framework).
 * Mục tiêu: không lộ chi tiết lỗi ra client, nhưng vẫn có đủ dữ liệu để debug.
 */

function app_log_path(): string
{
    $from_env = $_ENV['ERROR_LOG_FILE'] ?? $_ENV['LOG_FILE'] ?? '';
    $from_env = is_string($from_env) ? trim($from_env) : '';
    if ($from_env !== '') {
        return $from_env;
    }

    return dirname(__DIR__) . '/storage/logs/error.log';
}

function ensure_log_dir_exists(string $file_path): void
{
    $dir = dirname($file_path);
    if (is_dir($dir)) {
        return;
    }
    @mkdir($dir, 0775, true);
}

function log_error_message(string $message, array $context = []): void
{
    $file = app_log_path();
    ensure_log_dir_exists($file);

    $line = [
        'ts' => date('c'),
        'level' => 'error',
        'message' => $message,
        'context' => $context,
    ];

    @file_put_contents($file, json_encode($line, JSON_UNESCAPED_UNICODE) . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function log_exception(Throwable $e, array $context = []): void
{
    $base = [
        'type' => get_class($e),
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        // Trace có thể dài, nhưng rất hữu ích khi debug trong môi trường dev/test
        'trace' => $e->getTraceAsString(),
    ];

    $merged = $context ? array_merge($base, ['extra' => $context]) : $base;
    log_error_message('Unhandled exception', $merged);
}

