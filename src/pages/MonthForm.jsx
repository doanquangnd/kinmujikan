import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchRecordsByMonth, createMonthRecords, updateRecords } from '../api/workRecords.js';
import { isMoreThanOneMonthAhead, getCurrentYearInAppTimezone, getCurrentMonthInAppTimezone } from '../utils/dateHelpers.js';
import { buildEmptyRows, mergeRecordsIntoRows } from '../utils/workRecordRows.js';
import { calcWorkMinutes, minutesToTimeString, toHHmm, timeToMinutes } from '../utils/formatTime.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import LoadingOverlay from '../components/LoadingOverlay.jsx';
import ConfirmEmptyDaysModal from '../components/ConfirmEmptyDaysModal.jsx';
import MonthFormTable from '../components/MonthFormTable.jsx';

export default function MonthForm() {
  const { year: yearParam, month: monthParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isNew = !yearParam || yearParam === 'new';
  const isEdit = window.location.pathname.includes('/edit');

  const year = isNew ? Number(searchParams.get('year')) || getCurrentYearInAppTimezone() : Number(yearParam);
  const month = isNew ? Number(searchParams.get('month')) || getCurrentMonthInAppTimezone() : Number(monthParam);
  const timeStart = searchParams.get('timeStart') || '';
  const timeEnd = searchParams.get('timeEnd') || '';
  const breakMinutes = Number(searchParams.get('breakMinutes')) || 0;

  const defaults = isNew && (timeStart || timeEnd) ? { timeStart, timeEnd, breakMinutes } : null;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasNoRecords, setHasNoRecords] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [confirmEmptyDaysModal, setConfirmEmptyDaysModal] = useState(null);
  const isDirtyRef = useRef(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const initialRows = useMemo(
    () => buildEmptyRows(year, month, defaults),
    [year, month, defaults?.timeStart, defaults?.timeEnd, defaults?.breakMinutes]
  );

  const fetchMonth = useCallback(() => {
    if (isNew) return;
    setLoading(true);
    setLoadError(false);
    setHasNoRecords(false);
    fetchRecordsByMonth(year, month)
      .then((records) => {
        setRows(mergeRecordsIntoRows(initialRows, records));
        setHasNoRecords(records.length === 0);
      })
      .catch(() => {
        setRows(initialRows);
        setHasNoRecords(true);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, [year, month, isNew, initialRows]);

  useEffect(() => {
    if (isNew) {
      setRows(initialRows);
      setHasNoRecords(false);
      setLoadError(false);
      setLoading(false);
      return;
    }
    fetchMonth();
  }, [isNew, initialRows, fetchMonth]);

  const totalMinutes = useMemo(() => {
    return rows.reduce((sum, row) => sum + calcWorkMinutes(row.time_start, row.time_end, row.break_minutes), 0);
  }, [rows]);

  const { invalidTimeRows, emptyWorkDays } = useMemo(() => {
    const invalid = [];
    const empty = [];
    rows.forEach((row, i) => {
      const isRest = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName || row.rest_day;
      if (isRest) return;
      const startM = timeToMinutes(row.time_start);
      const endM = timeToMinutes(row.time_end);
      if (startM != null && endM != null && startM >= endM) invalid.push({ index: i, day: row.day });
      if (!row.time_start || !row.time_end) empty.push({ index: i, day: row.day });
    });
    return { invalidTimeRows: invalid, emptyWorkDays: empty };
  }, [rows]);

  function updateRow(dayIndex, field, value) {
    isDirtyRef.current = true;
    setRows((prev) => {
      const next = [...prev];
      const row = next[dayIndex];
      next[dayIndex] = { ...row, [field]: value };
      if (field === 'rest_day' && value === true) {
        next[dayIndex].time_start = null;
        next[dayIndex].time_end = null;
        next[dayIndex].break_minutes = null;
      }
      return next;
    });
  }

  function fillFromPrevious(dayIndex) {
    if (dayIndex <= 0) return;
    const prev = rows[dayIndex - 1];
    const row = rows[dayIndex];
    const isWeekendOrHoliday = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName;
    if (isWeekendOrHoliday) return;
    const ts = prev.time_start != null && prev.time_start !== '' ? toHHmm(prev.time_start) || prev.time_start : null;
    const te = prev.time_end != null && prev.time_end !== '' ? toHHmm(prev.time_end) || prev.time_end : null;
    if (!ts || !te) return;
    isDirtyRef.current = true;
    setRows((prevRows) => {
      const next = [...prevRows];
      next[dayIndex] = {
        ...next[dayIndex],
        time_start: ts,
        time_end: te,
        break_minutes: prev.break_minutes ?? next[dayIndex].break_minutes,
      };
      return next;
    });
  }

  function handlePrint() {
    window.print();
  }

  function handleExportCSV() {
    const headers = ['日付', '曜', '休', '開始', '終了', '休憩(分)', '総業務時間', '備考'];
    const toM = (t) => (t ? toHHmm(t) || t : '');
    const lines = [
      headers.join(','),
      ...rows.map((row) => {
        const mins = calcWorkMinutes(row.time_start, row.time_end, row.break_minutes);
        const rest = row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName || row.rest_day ? '休' : '';
        return [
          row.work_date,
          row.weekday,
          rest,
          toM(row.time_start),
          toM(row.time_end),
          row.break_minutes ?? '',
          minutesToTimeString(mins),
          (row.note ?? '').replace(/,/g, ' '),
        ].join(',');
      }),
    ];
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${year}-${String(month).padStart(2, '0')}_kinmu.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleNavigateAway(to) {
    if (isDirtyRef.current && !window.confirm('Bạn có thay đổi chưa lưu. Rời đi?')) return;
    navigate(to);
  }

  useEffect(() => {
    const onBeforeUnload = (e) => { if (isDirtyRef.current) e.preventDefault(); };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  async function performSubmit() {
    setSaving(true);
    setError('');
    try {
      if (isNew) {
        const records = rows.map((r) => {
          const isWeekdayRest = !(r.weekdayIndex === 0 || r.weekdayIndex === 6 || r.holidayName) && r.rest_day;
          const ts = toHHmm(r.time_start) || null;
          const te = toHHmm(r.time_end) || null;
          return {
            day: r.day,
            time_start: isWeekdayRest ? null : ts,
            time_end: isWeekdayRest ? null : te,
            break_minutes: isWeekdayRest ? null : (r.break_minutes ?? null),
            note: r.note || null,
            rest_day: r.rest_day ?? false,
          };
        });
        await createMonthRecords(year, month, records);
        isDirtyRef.current = false;
        toast('Đã lưu.', 'success');
        navigate('/', { replace: true });
      } else if (isEdit) {
        const records = rows
          .filter((row) => row.id != null)
          .map((row) => {
            const isWeekdayRest = !(row.weekdayIndex === 0 || row.weekdayIndex === 6 || row.holidayName) && row.rest_day;
            const ts = toHHmm(row.time_start) || null;
            const te = toHHmm(row.time_end) || null;
            return {
              id: row.id,
              time_start: isWeekdayRest ? null : ts,
              time_end: isWeekdayRest ? null : te,
              break_minutes: isWeekdayRest ? null : row.break_minutes,
              note: row.note,
              rest_day: row.rest_day ?? false,
            };
          });
        await updateRecords(records);
        isDirtyRef.current = false;
        setSaving(false);
        toast('Đã lưu.', 'success');
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || (err.data?.message ?? 'Lỗi'));
      setSaving(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (invalidTimeRows.length > 0) {
      setError('開始 phải nhỏ hơn 終了. Kiểm tra các ngày: ' + invalidTimeRows.map((r) => r.day).join(', ') + '.');
      return;
    }
    if (emptyWorkDays.length > 0) {
      setConfirmEmptyDaysModal({ days: emptyWorkDays.map((r) => r.day) });
      return;
    }
    performSubmit();
  }

  function handleConfirmEmptyDaysSave() {
    setConfirmEmptyDaysModal(null);
    performSubmit();
  }

  const readOnly = !isNew && !isEdit;

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-900">
        <LoadingOverlay message="Đang tải..." />
      </div>
    );
  }

  if (isNew && isMoreThanOneMonthAhead(year, month)) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto bg-white dark:bg-neutral-900">
        <section className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center bg-white dark:bg-neutral-800/50">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-2">Không thể tạo</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Chỉ được tạo tối đa đến tháng sau so với hiện tại. Tháng {year}年{String(month).padStart(2, '0')}月 chưa cho phép tạo.
          </p>
          <button
            type="button"
            onClick={() => navigate('/', { replace: true })}
            className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          >
            Về Dashboard
          </button>
        </section>
      </div>
    );
  }

  if (!isNew && hasNoRecords) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-4xl mx-auto bg-white dark:bg-neutral-900">
        <section className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center bg-white dark:bg-neutral-800/50">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
            {loadError ? 'Lỗi tải dữ liệu' : 'Chưa có bản ghi'}
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            {loadError
              ? 'Không thể tải dữ liệu tháng. Kiểm tra kết nối và thử lại.'
              : `Tháng ${year}年${String(month).padStart(2, '0')}月 chưa có dữ liệu. Vui lòng tạo mới từ Dashboard.`}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {loadError && (
              <button
                type="button"
                onClick={() => fetchMonth()}
                className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
              >
                Thử lại
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="border border-teal-300 dark:border-teal-700 rounded-md px-4 py-2 text-sm font-medium hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
            >
              Về Dashboard
            </button>
          </div>
        </section>
      </div>
    );
  }

  const label = `${year}年${String(month).padStart(2, '0')}月`;
  const displayName = user?.display_name || user?.email || '';

  return (
    <div className="print-area min-h-screen px-4 py-8 max-w-4xl mx-auto bg-white dark:bg-neutral-900 print:py-2 print:px-2">
      <header className="grid grid-cols-3 items-center mb-6 border-b border-neutral-200 dark:border-neutral-700 pb-4 print:mb-4 print:pb-2">
        <div className="text-left text-lg font-semibold text-neutral-900 dark:text-neutral-100 print:text-base">
          {label}
        </div>
        <div className="text-center text-lg font-semibold text-neutral-900 dark:text-neutral-100 print:text-base">
          作業実績表
        </div>
        <div className="text-right flex items-center justify-end gap-2">
          <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 print:text-base">{displayName}</span>
          <button
            type="button"
            onClick={() => handleNavigateAway('/')}
            className="print:hidden text-sm border border-teal-300 dark:border-teal-700 rounded-md px-3 py-1 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          >
            Về Dashboard
          </button>
        </div>
      </header>

      {error && (
        <p className="print:hidden mb-4 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 rounded-md p-2 bg-red-50 dark:bg-red-950/50">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <MonthFormTable
          rows={rows}
          readOnly={readOnly}
          invalidTimeRows={invalidTimeRows}
          totalMinutes={totalMinutes}
          onUpdateRow={updateRow}
          onFillFromPrevious={fillFromPrevious}
        />

        {!readOnly && (
          <div className="print:hidden mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => handleNavigateAway('/')}
              className="border border-teal-300 dark:border-teal-700 rounded-md px-4 py-2 text-sm hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
            >
              Lưu
            </button>
          </div>
        )}

        {readOnly && (
          <div className="print:hidden mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="border border-teal-300 dark:border-teal-700 rounded-md px-4 py-2 text-sm font-medium hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
            >
              In
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="border border-teal-300 dark:border-teal-700 rounded-md px-4 py-2 text-sm font-medium hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
            >
              Xuất CSV
            </button>
            <button
              type="button"
              onClick={() => navigate(`/month/${year}/${month}/edit`)}
              className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
            >
              Sửa
            </button>
          </div>
        )}
      </form>

      {saving && <LoadingOverlay message="Đang lưu..." />}

      {confirmEmptyDaysModal && (
        <ConfirmEmptyDaysModal
          days={confirmEmptyDaysModal.days}
          onConfirm={handleConfirmEmptyDaysSave}
          onCancel={() => setConfirmEmptyDaysModal(null)}
        />
      )}
    </div>
  );
}
