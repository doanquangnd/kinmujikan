import { calcWorkMinutes, minutesToTimeString, toHHmm } from '@/utils/formatTime';
import type { WorkRecordRow } from '@/types';

interface InvalidTimeRow {
  index: number;
  day: number;
}

interface MonthFormRowProps {
  row: WorkRecordRow;
  index: number;
  readOnly: boolean;
  isInvalidTime: boolean;
  canFillFromPrev: boolean;
  onUpdateRow: (index: number, field: keyof WorkRecordRow, value: unknown) => void;
  onFillFromPrevious: (index: number) => void;
}

function MonthFormRow({
  row,
  index,
  readOnly,
  isInvalidTime,
  canFillFromPrev,
  onUpdateRow,
  onFillFromPrevious,
}: MonthFormRowProps) {
  const isWeekendOrHoliday = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
  const isRestStyle = isWeekendOrHoliday || row.rest_day;
  const isEmptyWorkDay = !isRestStyle && (!row.time_start || !row.time_end);
  const mins = calcWorkMinutes(row.time_start, row.time_end, row.break_minutes);
  const cellClass = isRestStyle
    ? 'bg-neutral-100 dark:bg-neutral-800 text-red-700 dark:text-red-400 border-neutral-200 dark:border-neutral-700'
    : isEmptyWorkDay
      ? 'bg-red-50 dark:bg-red-950/30 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100';
  const restChecked = Boolean(isWeekendOrHoliday || row.rest_day);
  const restDisabled = Boolean(isWeekendOrHoliday);
  const timeDisplay = (t: string | null | undefined) => (t ? toHHmm(t) || '--:--' : '--:--');
  const canEditTime = !readOnly && (!row.rest_day || isWeekendOrHoliday);
  const timeInputValue = (t: string | null | undefined) => (t != null && t !== '' ? String(t) : '');

  return (
    <tr className={`border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/70 ${isRestStyle ? 'print-rest' : ''} ${isEmptyWorkDay ? 'print-empty' : ''}`}>
      <td className={`border-r p-1 text-center ${cellClass}`}>{row.day}</td>
      <td className={`border-r p-1 text-center ${cellClass}`}>{row.weekday}</td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {readOnly ? (
          row.rest_day ? (isWeekendOrHoliday ? '\u2713' : '\u2715') : ''
        ) : (
          <input
            type="checkbox"
            checked={restChecked}
            disabled={restDisabled}
            onChange={(e) => onUpdateRow(index, 'rest_day', e.target.checked)}
            className="rounded border-neutral-400 dark:border-neutral-500 focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500"
          />
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        <div className="flex items-center justify-center gap-0.5">
          {!readOnly && canFillFromPrev && (
            <button
              type="button"
              onClick={() => onFillFromPrevious(index)}
              className="text-xs border border-teal-300 dark:border-teal-700 rounded px-1 py-0.5 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500"
              title="Điền từ ngày trước"
            >
              ←
            </button>
          )}
          {readOnly ? (
            timeDisplay(row.time_start)
          ) : canEditTime ? (
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="--:--"
              value={timeInputValue(row.time_start)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) {
                  onUpdateRow(index, 'time_start', null);
                  return;
                }
                const formatted = raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : null;
                onUpdateRow(index, 'time_start', formatted || raw);
              }}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) {
                  const normalized = toHHmm(v);
                  onUpdateRow(index, 'time_start', normalized || v);
                }
              }}
              className="w-full border-0 bg-transparent p-0 text-inherit min-w-[4rem] text-center font-mono focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-inset rounded"
            />
          ) : (
            '--:--'
          )}
        </div>
      </td>
      <td className={`border-r p-1 text-center ${cellClass} ${isInvalidTime ? 'border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-950/30' : ''}`}>
        {readOnly ? (
          timeDisplay(row.time_end)
        ) : canEditTime ? (
            <input
              type="text"
              inputMode="numeric"
              placeholder="--:--"
              maxLength={5}
              value={timeInputValue(row.time_end)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) {
                  onUpdateRow(index, 'time_end', null);
                  return;
                }
                const formatted = raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : null;
                onUpdateRow(index, 'time_end', formatted || raw);
              }}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) {
                  const normalized = toHHmm(v);
                  onUpdateRow(index, 'time_end', normalized || v);
                }
              }}
            className="w-full border-0 bg-transparent p-0 text-inherit min-w-[4rem] text-center font-mono focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-inset rounded"
          />
        ) : (
          '--:--'
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {readOnly ? (
          row.break_minutes ?? ''
        ) : canEditTime ? (
          <input
            type="number"
            min={0}
            placeholder="--"
            value={row.break_minutes ?? ''}
            onChange={(e) => onUpdateRow(index, 'break_minutes', e.target.value === '' ? null : Number(e.target.value))}
            className="w-full border-0 bg-transparent p-0 text-inherit text-center min-w-0 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-inset rounded"
          />
        ) : (
          ''
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>{minutesToTimeString(mins)}</td>
      <td className={`p-1 ${cellClass}`}>
        {readOnly ? (
          row.note ?? ''
        ) : (
          <input
            type="text"
            value={row.note ?? ''}
            onChange={(e) => onUpdateRow(index, 'note', e.target.value)}
            className="w-full border-0 bg-transparent p-0 text-inherit min-w-[8rem] focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-inset rounded"
          />
        )}
      </td>
    </tr>
  );
}

interface MonthFormTableProps {
  rows: WorkRecordRow[];
  readOnly: boolean;
  invalidTimeRows: InvalidTimeRow[];
  totalMinutes: number;
  onUpdateRow: (index: number, field: keyof WorkRecordRow, value: unknown) => void;
  onFillFromPrevious: (index: number) => void;
}

export default function MonthFormTable({
  rows,
  readOnly,
  invalidTimeRows,
  totalMinutes,
  onUpdateRow,
  onFillFromPrevious,
}: MonthFormTableProps) {
  const kijunNissuu = rows.filter(
    (r) => r.weekdayIndex !== 0 && r.weekdayIndex !== 6 && !r.holidayName
  ).length;
  const jitsukadouNissuu = rows.filter(
    (r) => r.time_start && r.time_end
  ).length;

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden print:overflow-visible">
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] print:max-h-none print:overflow-visible">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-12 text-neutral-900 dark:text-neutral-100">日</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-12 text-neutral-900 dark:text-neutral-100">曜</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-10 text-neutral-900 dark:text-neutral-100">休</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-20 text-neutral-900 dark:text-neutral-100">開始</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-20 text-neutral-900 dark:text-neutral-100">終了</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-20 text-neutral-900 dark:text-neutral-100">休憩(分)</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-20 text-neutral-900 dark:text-neutral-100">総業務時間</th>
              <th className="p-2 text-left font-medium min-w-[8rem] text-neutral-900 dark:text-neutral-100">備考</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isWeekendOrHoliday = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
              const canEditTime = !readOnly && (!row.rest_day || isWeekendOrHoliday);
              const canFillFromPrev = Boolean(!readOnly && i > 0 && canEditTime && rows[i - 1].time_start && rows[i - 1].time_end);
              return (
                <MonthFormRow
                  key={row.day}
                  row={row}
                  index={i}
                  readOnly={readOnly}
                  isInvalidTime={invalidTimeRows.some((r) => r.index === i)}
                  canFillFromPrev={canFillFromPrev}
                  onUpdateRow={onUpdateRow}
                  onFillFromPrevious={onFillFromPrevious}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 flex flex-wrap items-center gap-6 text-sm font-medium text-neutral-900 dark:text-neutral-100 print:px-2 print:py-2 print:gap-4 print:text-xs">
        <div className="flex items-center gap-2">
          <span>基準日数</span>
          <span>{kijunNissuu}日</span>
        </div>
        <div className="flex items-center gap-2">
          <span>実稼動日数</span>
          <span>{jitsukadouNissuu}日</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span>合計</span>
          <span>{minutesToTimeString(totalMinutes)}</span>
        </div>
      </div>
    </div>
  );
}
