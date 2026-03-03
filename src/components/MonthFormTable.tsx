import { useTranslation } from 'react-i18next';
import { minutesToTimeString, toHHmm } from '@/utils/formatTime';
import { calcOvertimeForRow, formatOvertimeHours } from '@/utils/overtimeCalc';
import type { WorkRecordRow, WorkCategory } from '@/types';

const CATEGORIES: WorkCategory[] = ['shutkin', 'yukyu', 'daikyu', 'tokkyu', 'kekkin'];

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
  scheduledStart: string;
  scheduledEnd: string;
  onUpdateRow: (index: number, field: keyof WorkRecordRow, value: unknown) => void;
  onFillFromPrevious: (index: number) => void;
  fillFromPrevTitle: string;
  timePlaceholder: string;
  breakPlaceholder: string;
  categoryLabels: Record<WorkCategory, string>;
  categoryEmptyLabel: string;
}

function MonthFormRow({
  row,
  index,
  readOnly,
  isInvalidTime,
  canFillFromPrev,
  scheduledStart,
  scheduledEnd,
  onUpdateRow,
  onFillFromPrevious,
  fillFromPrevTitle,
  timePlaceholder,
  breakPlaceholder,
  categoryLabels,
  categoryEmptyLabel,
}: MonthFormRowProps) {
  const isWeekendOrHoliday = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
  const isWorkDay = row.category === 'shutkin';
  const isRestStyle = !isWorkDay || row.category === '';
  const isEmptyWorkDay = isWorkDay && (!row.time_start || !row.time_end);
  const overtime = calcOvertimeForRow(
    row.time_start,
    row.time_end,
    row.break_minutes,
    scheduledStart,
    scheduledEnd,
    row.category
  );
  const cellClass = isRestStyle
    ? 'bg-neutral-100 dark:bg-neutral-800 text-red-700 dark:text-red-400 border-neutral-200 dark:border-neutral-700'
    : isEmptyWorkDay
      ? 'bg-red-50 dark:bg-red-950/30 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
      : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100';
  const timeDisplay = (t: string | null | undefined) => (t ? toHHmm(t) || timePlaceholder : timePlaceholder);
  const canEditTime = !readOnly && isWorkDay;
  const timeInputValue = (t: string | null | undefined) => (t != null && t !== '' ? String(t) : '');

  return (
    <tr className={`border-b border-neutral-100 dark:border-neutral-700 hover:bg-neutral-50/70 dark:hover:bg-neutral-800/70 ${isRestStyle ? 'print-rest' : ''} ${isEmptyWorkDay ? 'print-empty' : ''}`}>
      <td className={`border-r p-1 text-center ${cellClass}`}>{row.day}</td>
      <td className={`border-r p-1 text-center ${cellClass}`}>{row.weekday}</td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {isWeekendOrHoliday ? '\u3007' : ''}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {readOnly ? (
          row.category ? categoryLabels[row.category] : ''
        ) : (
          <select
            value={row.category}
            onChange={(e) => onUpdateRow(index, 'category', e.target.value === '' ? '' : (e.target.value as WorkCategory))}
            className="w-full border-0 bg-transparent dark:bg-neutral-800 p-0 text-inherit text-center text-xs font-medium focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-inset rounded dark:[color-scheme:dark] dark:[&_option]:bg-neutral-800 dark:[&_option]:text-neutral-100"
          >
            {isWeekendOrHoliday && (
              <option value="kyuujitsu"></option>
            )}
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabels[c]}</option>
            ))}
          </select>
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        <div className="flex items-center justify-center gap-0.5">
          {!readOnly && canFillFromPrev && (
            <button
              type="button"
              onClick={() => onFillFromPrevious(index)}
              className="text-xs border border-teal-300 dark:border-teal-700 rounded px-1 py-0.5 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500"
              title={fillFromPrevTitle}
            >
              {'\u2190'}
            </button>
          )}
          {readOnly ? (
            timeDisplay(row.time_start)
          ) : canEditTime ? (
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder={timePlaceholder}
              value={timeInputValue(row.time_start)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) { onUpdateRow(index, 'time_start', null); return; }
                const formatted = raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : null;
                onUpdateRow(index, 'time_start', formatted || raw);
              }}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) onUpdateRow(index, 'time_start', toHHmm(v) || v);
              }}
              className="w-full border-0 bg-transparent p-0 text-inherit min-w-[4rem] text-center font-mono focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-inset rounded"
            />
          ) : (
            timePlaceholder
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
            placeholder={timePlaceholder}
            maxLength={5}
            value={timeInputValue(row.time_end)}
            onChange={(e) => {
              const raw = e.target.value.trim();
              if (!raw) { onUpdateRow(index, 'time_end', null); return; }
              const formatted = raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : null;
              onUpdateRow(index, 'time_end', formatted || raw);
            }}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v) onUpdateRow(index, 'time_end', toHHmm(v) || v);
            }}
            className="w-full border-0 bg-transparent p-0 text-inherit min-w-[4rem] text-center font-mono focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-inset rounded"
          />
        ) : (
          timePlaceholder
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {readOnly ? (
          row.break_minutes ?? ''
        ) : canEditTime ? (
          <input
            type="number"
            min={0}
            placeholder={breakPlaceholder}
            value={row.break_minutes ?? ''}
            onChange={(e) => onUpdateRow(index, 'break_minutes', e.target.value === '' ? null : Number(e.target.value))}
            className="w-full border-0 bg-transparent p-0 text-inherit text-center min-w-0 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-inset rounded"
          />
        ) : (
          ''
        )}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {minutesToTimeString(overtime.jitsukadou_minutes)}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {formatOvertimeHours(overtime.jikangai_hours)}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {formatOvertimeHours(overtime.shinya_hours)}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {formatOvertimeHours(overtime.chikoku_hours)}
      </td>
      <td className={`border-r p-1 text-center ${cellClass}`}>
        {formatOvertimeHours(overtime.soutai_hours)}
      </td>
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
  scheduledStart: string;
  scheduledEnd: string;
  onScheduledChange: (start: string | null, end: string | null) => void;
  onUpdateRow: (index: number, field: keyof WorkRecordRow, value: unknown) => void;
  onFillFromPrevious: (index: number) => void;
}

export default function MonthFormTable({
  rows,
  readOnly,
  invalidTimeRows,
  totalMinutes,
  scheduledStart,
  scheduledEnd,
  onScheduledChange,
  onUpdateRow,
  onFillFromPrevious,
}: MonthFormTableProps) {
  const { t } = useTranslation();
  const kijunNissuu = rows.filter(
    (r) => r.weekdayIndex !== 0 && r.weekdayIndex !== 6 && !r.holidayName
  ).length;
  const jitsukadouNissuu = rows.filter(
    (r) => r.category === 'shutkin' && r.time_start && r.time_end
  ).length;

  const categoryLabels: Record<WorkCategory, string> = {
    shutkin: t('table.categoryShutkin'),
    yukyu: t('table.categoryYukyu'),
    daikyu: t('table.categoryDaikyu'),
    tokkyu: t('table.categoryTokkyu'),
    kekkin: t('table.categoryKekkin'),
    kyuujitsu: '', // Thứ 7, CN, ngày lễ - hiển thị trống
  };

  const canEditScheduled = !readOnly;
  const schedStartVal = scheduledStart || '09:00';
  const schedEndVal = scheduledEnd || '18:00';

  return (
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden print:overflow-visible">
      <div className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 flex flex-wrap items-center gap-4">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t('table.scheduledTime')}</span>
          {canEditScheduled ? (
          <>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 dark:text-neutral-400">{t('table.scheduledStart')}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="09:30"
              value={schedStartVal}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const formatted = raw ? (raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : raw) : '';
                onScheduledChange(formatted || null, schedEndVal || '18:30');
              }}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) onScheduledChange(toHHmm(v) || v, schedEndVal || '18:30');
              }}
              className="border border-neutral-300 dark:border-neutral-600 rounded-md px-2 py-1 text-sm font-mono w-20 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-neutral-500 dark:text-neutral-400">{t('table.scheduledEnd')}</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="18:00"
              value={schedEndVal}
              onChange={(e) => {
                const raw = e.target.value.trim();
                const formatted = raw ? (raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : raw) : '';
                onScheduledChange(schedStartVal || '09:00', formatted || null);
              }}
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v) onScheduledChange(schedStartVal || '09:00', toHHmm(v) || v);
              }}
              className="border border-neutral-300 dark:border-neutral-600 rounded-md px-2 py-1 text-sm font-mono w-20 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          </>
          ) : (
          <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">
            {(toHHmm(schedStartVal) || schedStartVal)} - {(toHHmm(schedEndVal) || schedEndVal)}
          </span>
          )}
        </div>
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] print:max-h-none print:overflow-visible">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
            <tr>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-12 text-neutral-900 dark:text-neutral-100">{t('table.day')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-12 text-neutral-900 dark:text-neutral-100">{t('table.weekday')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-10 text-neutral-900 dark:text-neutral-100">{t('table.rest')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-16 text-neutral-900 dark:text-neutral-100">{t('table.category')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-20 text-neutral-900 dark:text-neutral-100">{t('table.shutkin')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-20 text-neutral-900 dark:text-neutral-100">{t('table.taikin')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-16 text-neutral-900 dark:text-neutral-100">{t('table.break')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-16 text-neutral-900 dark:text-neutral-100">{t('table.totalTime')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-14 text-neutral-900 dark:text-neutral-100">{t('table.overtime')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-12 text-neutral-900 dark:text-neutral-100">{t('table.lateNight')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-12 text-neutral-900 dark:text-neutral-100">{t('table.late')}</th>
              <th className="border-r border-neutral-200 dark:border-neutral-700 p-2 text-center font-medium w-12 text-neutral-900 dark:text-neutral-100">{t('table.earlyLeave')}</th>
              <th className="p-2 text-left font-medium min-w-[8rem] text-neutral-900 dark:text-neutral-100">{t('table.note')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const isWorkDay = row.category === 'shutkin';
              const canFillFromPrev = Boolean(!readOnly && i > 0 && isWorkDay && rows[i - 1].category === 'shutkin' && rows[i - 1].time_start && rows[i - 1].time_end);
              return (
                <MonthFormRow
                  key={row.day}
                  row={row}
                  index={i}
                  readOnly={readOnly}
                  isInvalidTime={invalidTimeRows.some((r) => r.index === i)}
                  canFillFromPrev={canFillFromPrev}
                  scheduledStart={scheduledStart || '09:30'}
                  scheduledEnd={scheduledEnd || '18:30'}
                  onUpdateRow={onUpdateRow}
                  onFillFromPrevious={onFillFromPrevious}
                  fillFromPrevTitle={t('table.fillFromPrev')}
                  timePlaceholder={t('table.timePlaceholder')}
                  breakPlaceholder={t('table.breakPlaceholder')}
                  categoryLabels={categoryLabels}
                  categoryEmptyLabel={t('table.categoryEmpty')}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="border-t-2 border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 flex flex-wrap items-center gap-6 text-sm font-medium text-neutral-900 dark:text-neutral-100 print:px-2 print:py-2 print:gap-4 print:text-xs">
        <div className="flex items-center gap-2">
          <span>{t('table.baseDays')}</span>
          <span>{kijunNissuu}日</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{t('table.workDays')}</span>
          <span>{jitsukadouNissuu}日</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span>{t('table.total')}</span>
          <span>{minutesToTimeString(totalMinutes)}</span>
        </div>
      </div>
    </div>
  );
}
