/** Múi giờ ứng dụng (hiển thị và so sánh ngày) */
export const APP_TIMEZONE = 'Asia/Tokyo';

export interface TodayParts {
  year: number;
  month: number;
  day: number;
}

/**
 * Lấy ngày hôm nay theo APP_TIMEZONE (Asia/Tokyo).
 * @returns {{ year: number, month: number, day: number }} month 1-12
 */
export function getTodayInAppTimezone(): TodayParts {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [y, m, d] = f.format(new Date()).split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function getCurrentYearInAppTimezone(): number {
  return getTodayInAppTimezone().year;
}

export function getCurrentMonthInAppTimezone(): number {
  return getTodayInAppTimezone().month;
}

/**
 * Số ngày trong tháng
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Thứ trong tuần (0 = Chủ nhật, 1 = Thứ 2, ... 6 = Thứ 7)
 */
export function getDayOfWeek(year: number, month: number, day: number): number {
  return new Date(year, month - 1, day).getDay();
}

/**
 * YYYY-MM-DD
 */
export function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Trả true nếu (year, month) nằm sau hơn 1 tháng so với hiện tại theo Asia/Tokyo (không cho tạo mới).
 */
export function isMoreThanOneMonthAhead(year: number, month: number): boolean {
  const { year: y, month: m } = getTodayInAppTimezone();
  const nextYear = m === 12 ? y + 1 : y;
  const nextMonth = m === 12 ? 1 : m + 1;
  if (year > nextYear) return true;
  if (year < nextYear) return false;
  return month > nextMonth;
}
