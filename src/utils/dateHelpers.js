/** Múi giờ ứng dụng (hiển thị và so sánh ngày) */
export const APP_TIMEZONE = 'Asia/Tokyo';

/**
 * Lấy ngày hôm nay theo APP_TIMEZONE (Asia/Tokyo).
 * @returns {{ year: number, month: number, day: number }} month 1-12
 */
export function getTodayInAppTimezone() {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = f.format(new Date()).split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function getCurrentYearInAppTimezone() {
  return getTodayInAppTimezone().year;
}

export function getCurrentMonthInAppTimezone() {
  return getTodayInAppTimezone().month;
}

/**
 * Số ngày trong tháng
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ... 6 = Thứ 7)
 */
export function getDayOfWeek(year, month, day) {
  return new Date(year, month - 1, day).getDay();
}

/**
 * YYYY-MM-DD
 */
export function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Trả true nếu (year, month) nằm sau hơn 1 tháng so với hiện tại theo Asia/Tokyo (không cho tạo mới).
 */
export function isMoreThanOneMonthAhead(year, month) {
  const { year: y, month: m } = getTodayInAppTimezone();
  const nextYear = m === 12 ? y + 1 : y;
  const nextMonth = m === 12 ? 1 : m + 1;
  if (year > nextYear) return true;
  if (year < nextYear) return false;
  return month > nextMonth;
}
