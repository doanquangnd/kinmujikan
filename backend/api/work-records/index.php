<?php
/**
 * GET /api/work-records?year=2026
 *   Trả danh sách tháng trong năm có bản ghi + tổng phút mỗi tháng (cho Dashboard).
 * GET /api/work-records?year=2026&month=1
 *   Trả danh sách bản ghi từng ngày trong tháng (cho trang Xem/Sửa).
 */

require_once dirname(__DIR__, 2) . '/includes/db.php';
require_once dirname(__DIR__, 2) . '/includes/auth.php';
require_once dirname(__DIR__, 2) . '/includes/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    json_response(405, ['error' => 'Method Not Allowed']);
    exit;
}

$user_id = require_auth();

$year = isset($_GET['year']) ? (int) $_GET['year'] : 0;
if ($year < 2000 || $year > 2100) {
    json_response(400, ['error' => 'Bad Request', 'message' => 'year không hợp lệ']);
    exit;
}

$pdo = get_pdo();

// Có month => trả chi tiết từng ngày trong tháng
$month = isset($_GET['month']) ? (int) $_GET['month'] : 0;
if ($month >= 1 && $month <= 12) {
    $from = sprintf('%04d-%02d-01', $year, $month);
    $last = (int) date('t', strtotime($from));
    $to = sprintf('%04d-%02d-%02d', $year, $month, $last);

    $stmt = $pdo->prepare('
        SELECT id, work_date, time_start, time_end, break_minutes, note, rest_day
        FROM work_records
        WHERE user_id = ? AND work_date >= ? AND work_date <= ?
        ORDER BY work_date
    ');
    $stmt->execute([$user_id, $from, $to]);
    $rows = $stmt->fetchAll();

    foreach ($rows as &$r) {
        $r['id'] = (int) $r['id'];
        $r['work_date'] = $r['work_date'];
        $r['time_start'] = $r['time_start'] ? substr($r['time_start'], 0, 5) : null;
        $r['time_end'] = $r['time_end'] ? substr($r['time_end'], 0, 5) : null;
        $r['break_minutes'] = $r['break_minutes'] !== null ? (int) $r['break_minutes'] : null;
        $r['rest_day'] = (int) $r['rest_day'] ? true : false;
    }

    json_response(200, ['records' => $rows]);
    exit;
}

// Không có month => trả danh sách tháng trong năm có bản ghi + tổng phút
$stmt = $pdo->prepare("
    SELECT
        YEAR(work_date) AS y,
        MONTH(work_date) AS m,
        SUM(
            CASE
                WHEN time_start IS NULL OR time_end IS NULL THEN 0
                ELSE GREATEST(0,
                    (TIME_TO_SEC(time_end) - TIME_TO_SEC(time_start)) / 60 - COALESCE(break_minutes, 0)
                )
            END
        ) AS total_minutes
    FROM work_records
    WHERE user_id = ? AND YEAR(work_date) = ?
    GROUP BY YEAR(work_date), MONTH(work_date)
    ORDER BY y DESC, m DESC
");
$stmt->execute([$user_id, $year]);
$rows = $stmt->fetchAll();

$list = [];
foreach ($rows as $r) {
    $list[] = [
        'year' => (int) $r['y'],
        'month' => (int) $r['m'],
        'label' => $r['y'] . '年' . str_pad($r['m'], 2, '0', STR_PAD_LEFT) . '月',
        'total_minutes' => (int) $r['total_minutes'],
    ];
}

json_response(200, ['months' => $list]);
