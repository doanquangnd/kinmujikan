<?php
/**
 * POST /api/work-records
 * Body: { year, month, records: [ { day, time_start?, time_end?, break_minutes?, note? }, ... ] }
 * Validation: không cho tạo nếu user đã có bất kỳ bản ghi nào trong năm+tháng đó (409).
 */

require_once dirname(__DIR__, 2) . '/includes/db.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';
require_once dirname(__DIR__, 2) . '/includes/response.php';

function normalize_hhmm_or_null($val): ?string
{
    if ($val === null) return null;
    $val = trim((string) $val);
    if ($val === '') return null;
    if (!preg_match('/^\d{1,2}:(\d{2})(?::\d{0,2})?$/', $val, $m)) return null;
    $parts = explode(':', $val, 2);
    $h = (int) $parts[0];
    $min = (int) (isset($parts[1]) ? substr($parts[1], 0, 2) : 0);
    if ($h < 0 || $h > 23 || $min < 0 || $min > 59) return null;
    return sprintf('%02d:%02d:00', $h, $min);
}

function normalize_break_minutes_or_null($val): ?int
{
    if ($val === null || $val === '') return null;
    if (!is_numeric($val)) return null;
    $n = (int) $val;
    if ($n < 0 || $n > 600) return null;
    return $n;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(405, ['error' => 'Method Not Allowed']);
    exit;
}

$user_id = require_auth();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];

$year = (int) ($body['year'] ?? 0);
$month = (int) ($body['month'] ?? 0);
$records = $body['records'] ?? [];

if ($year < 2000 || $year > 2100 || $month < 1 || $month > 12) {
    json_response(400, ['error' => 'Bad Request', 'message' => 'year, month không hợp lệ']);
    exit;
}

$requested_first = new DateTimeImmutable(sprintf('%04d-%02d-01', $year, $month));
$now = new DateTimeImmutable('today');
$first_of_next_month = $now->modify('first day of next month');
$last_of_next_month = $first_of_next_month->modify('last day of this month');
if ($requested_first > $last_of_next_month) {
    json_response(400, ['error' => 'Bad Request', 'message' => 'Chỉ được tạo tối đa đến tháng sau so với hiện tại']);
    exit;
}

if (!is_array($records)) {
    json_response(400, ['error' => 'Bad Request', 'message' => 'records phải là mảng']);
    exit;
}

$pdo = get_pdo();

// Kiểm tra tháng đã tồn tại chưa
$from = sprintf('%04d-%02d-01', $year, $month);
$stmt = $pdo->prepare('SELECT 1 FROM work_records WHERE user_id = ? AND work_date >= ? AND work_date < DATE_ADD(?, INTERVAL 1 MONTH) LIMIT 1');
$stmt->execute([$user_id, $from, $from]);
if ($stmt->fetch()) {
    json_response(409, ['error' => 'Conflict', 'message' => 'Tháng này đã có bản ghi']);
    exit;
}

$last_day = (int) date('t', strtotime($from));
$insert = $pdo->prepare('
    INSERT INTO work_records (user_id, work_date, time_start, time_end, break_minutes, note, rest_day)
    VALUES (?, ?, ?, ?, ?, ?, ?)
');

$created = 0;
foreach ($records as $r) {
    $day = (int) ($r['day'] ?? 0);
    if ($day < 1 || $day > $last_day) continue;

    $work_date = sprintf('%04d-%02d-%02d', $year, $month, $day);
    $time_start = normalize_hhmm_or_null($r['time_start'] ?? null);
    $time_end = normalize_hhmm_or_null($r['time_end'] ?? null);
    $break_minutes = normalize_break_minutes_or_null($r['break_minutes'] ?? null);
    $note_raw = isset($r['note']) ? trim((string) $r['note']) : '';
    $note = $note_raw === '' ? null : mb_substr($note_raw, 0, 500);
    $rest_day = !empty($r['rest_day']) ? 1 : 0;

    $insert->execute([$user_id, $work_date, $time_start, $time_end, $break_minutes, $note, $rest_day]);
    $created++;
}

json_response(201, ['created' => $created, 'year' => $year, 'month' => $month]);
