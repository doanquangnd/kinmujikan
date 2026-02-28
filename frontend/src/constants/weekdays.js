/**
 * Thứ trong tuần (0 = 日, 1 = 月, ... 6 = 土)
 */
export const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function getWeekdayLabel(dayOfWeek) {
  return WEEKDAY_LABELS[dayOfWeek] ?? '';
}
