<?php
/**
 * PUT /api/work-records
 * Body: { records: [ { id, time_start?, time_end?, break_minutes?, note?, rest_day? }, ... ] }
 * Cập nhật nhiều bản ghi trong một request (chỉ record thuộc user).
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

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    json_response(405, ['error' => 'Method Not Allowed']);
    exit;
}

$user_id = require_auth();

$raw = file_get_contents('php://input');
$body = json_decode($raw, true) ?: [];
$records = $body['records'] ?? [];

if (!is_array($records)) {
    json_response(400, ['error' => 'Bad Request', 'message' => 'records phải là mảng']);
    exit;
}

$pdo = get_pdo();

$ids = [];
foreach ($records as $r) {
    $id = isset($r['id']) ? (int) $r['id'] : 0;
    if ($id > 0) {
        $ids[] = $id;
    }
}
$ids = array_unique($ids);
if (empty($ids)) {
    json_response(200, ['updated' => 0]);
    exit;
}

$placeholders = implode(',', array_fill(0, count($ids), '?'));
$stmt = $pdo->prepare("SELECT id FROM work_records WHERE user_id = ? AND id IN ($placeholders)");
$stmt->execute(array_merge([$user_id], $ids));
$allowed_ids = [];
while ($row = $stmt->fetch()) {
    $allowed_ids[(int) $row['id']] = true;
}

$update_stmt = $pdo->prepare('
    UPDATE work_records SET time_start = ?, time_end = ?, break_minutes = ?, note = ?, rest_day = ?
    WHERE id = ? AND user_id = ?
');
$updated = 0;
foreach ($records as $r) {
    $id = isset($r['id']) ? (int) $r['id'] : 0;
    if ($id <= 0 || !isset($allowed_ids[$id])) {
        continue;
    }
    $time_start = normalize_hhmm_or_null($r['time_start'] ?? null);
    $time_end = normalize_hhmm_or_null($r['time_end'] ?? null);
    $break_minutes = normalize_break_minutes_or_null($r['break_minutes'] ?? null);
    $note_raw = isset($r['note']) ? trim((string) $r['note']) : '';
    $note = $note_raw === '' ? null : mb_substr($note_raw, 0, 500);
    $rest_day = !empty($r['rest_day']) ? 1 : 0;

    $update_stmt->execute([$time_start, $time_end, $break_minutes, $note, $rest_day, $id, $user_id]);
    $updated += $update_stmt->rowCount();
}

json_response(200, ['updated' => $updated]);
