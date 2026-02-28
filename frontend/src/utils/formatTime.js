/**
 * Chuẩn hóa chuỗi giờ thành HH:mm (24h). Nhận "9:30", "09:30", "09:30:00".
 * Trả về "" nếu không hợp lệ.
 */
export function toHHmm(value) {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{0,2})?$/);
  if (!m) return '';
  const h = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  const min = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/**
 * Chuyển time (HH:mm hoặc raw) thành tổng phút. Trả null nếu không hợp lệ.
 */
export function timeToMinutes(t) {
  if (t == null || t === '') return null;
  const normalized = toHHmm(t);
  if (!normalized) return null;
  const [h, m] = normalized.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Phút -> "H:MM" hoặc "HH:MM"
 */
export function minutesToTimeString(minutes) {
  if (minutes == null || minutes < 0) return '0:00';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Tính phút làm việc: (time_end - time_start) - break_minutes
 * time_start, time_end dạng "HH:mm" hoặc "HH:mm:ss"
 */
export function calcWorkMinutes(time_start, time_end, break_minutes = 0) {
  if (!time_start || !time_end) return 0;
  const toMinutes = (t) => {
    const parts = t.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0) + (parts[2] || 0) / 60;
  };
  const start = toMinutes(time_start);
  const end = toMinutes(time_end);
  const breakM = Number(break_minutes) || 0;
  return Math.max(0, Math.round(end - start - breakM));
}
