/**
 * Chuẩn hóa chuỗi giờ thành HH:mm (24h).
 * Nhận: "9:30", "09:30", "09:30:00" hoặc nhập nhanh "0930", "930", "09", "9".
 * Trả về "" nếu không hợp lệ.
 */
export function toHHmm(value: unknown): string {
  if (value == null || value === '') return '';
  const s = String(value).trim().replace(/\s/g, '');
  // Định dạng có dấu hai chấm: 9:30, 09:30, 09:30:00
  const withColon = s.match(/^(\d{1,2}):(\d{2})(?::\d{0,2})?$/);
  if (withColon) {
    const h = Math.max(0, Math.min(23, parseInt(withColon[1], 10)));
    const min = Math.max(0, Math.min(59, parseInt(withColon[2], 10)));
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  // Nhập nhanh: chỉ số, không có dấu hai chấm
  const digitsOnly = s.replace(/\D/g, '');
  if (digitsOnly.length === 0) return '';
  if (digitsOnly.length === 1) {
    const h = Math.min(23, parseInt(digitsOnly, 10));
    return `${String(h).padStart(2, '0')}:00`;
  }
  if (digitsOnly.length === 2) {
    const h = Math.min(23, parseInt(digitsOnly, 10));
    return `${String(h).padStart(2, '0')}:00`;
  }
  if (digitsOnly.length === 3) {
    const h = Math.min(23, parseInt(digitsOnly.slice(0, 1), 10));
    const min = Math.min(59, parseInt(digitsOnly.slice(1, 3), 10));
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  }
  // 4+ chữ số: HHMM
  const h = Math.min(23, parseInt(digitsOnly.slice(0, 2), 10));
  const min = Math.min(59, parseInt(digitsOnly.slice(2, 4), 10));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/**
 * Chuyển time (HH:mm hoặc raw) thành tổng phút. Trả null nếu không hợp lệ.
 */
export function timeToMinutes(t: unknown): number | null {
  if (t == null || t === '') return null;
  const normalized = toHHmm(t);
  if (!normalized) return null;
  const [h, m] = normalized.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Phút -> "H:MM" hoặc "HH:MM"
 */
export function minutesToTimeString(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) return '0:00';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}:${String(m).padStart(2, '0')}`;
}

/**
 * Tính phút làm việc: (time_end - time_start) - break_minutes
 * time_start, time_end dạng "HH:mm" hoặc "HH:mm:ss"
 */
export function calcWorkMinutes(
  time_start: string | null | undefined,
  time_end: string | null | undefined,
  break_minutes: number | null | undefined = 0
): number {
  if (!time_start || !time_end) return 0;
  const toMinutes = (t: string) => {
    const parts = t.split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0) + (parts[2] || 0) / 60;
  };
  const start = toMinutes(time_start);
  const end = toMinutes(time_end);
  const breakM = Number(break_minutes) || 0;
  return Math.max(0, Math.round(end - start - breakM));
}
