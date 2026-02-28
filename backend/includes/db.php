<?php
/**
 * PDO singleton cho MySQL.
 */

require_once dirname(__DIR__) . '/config/database.php';

$GLOBALS['_pdo'] = null;

function get_pdo(): PDO
{
    if ($GLOBALS['_pdo'] !== null) {
        return $GLOBALS['_pdo'];
    }
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $GLOBALS['_pdo'] = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $GLOBALS['_pdo'];
}
