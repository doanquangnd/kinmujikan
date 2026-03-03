import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { fetchMonthsByYear } from '@/api/workRecords';
import type { MonthSummary } from '@/api/workRecords';
import { minutesToTimeString, toHHmm } from '@/utils/formatTime';
import { isMoreThanOneMonthAhead, getCurrentYearInAppTimezone } from '@/utils/dateHelpers';
import { useFocusTrap } from '@/hooks/useFocusTrap';

const currentYear = getCurrentYearInAppTimezone();

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [year, setYear] = useState(currentYear);
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const logoutModalRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalContentRef, modalOpen);
  useFocusTrap(logoutModalRef, logoutConfirmOpen);
  const [modalYear, setModalYear] = useState(currentYear);
  const [modalMonth, setModalMonth] = useState(1);
  const [modalScheduledStart, setModalScheduledStart] = useState('09:30');
  const [modalScheduledEnd, setModalScheduledEnd] = useState('18:30');
  const [modalTimeStart, setModalTimeStart] = useState('09:30');
  const [modalTimeEnd, setModalTimeEnd] = useState('18:30');
  const [modalBreak, setModalBreak] = useState(60);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchMonthsByYear(year)
      .then((data) => { if (!cancelled) setMonths(data); })
      .catch(() => { if (!cancelled) setMonths([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [year]);

  const openModalForMonth = useCallback((y: number, m: number) => {
    setModalYear(y);
    setModalMonth(m);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  useEffect(() => {
    if (!logoutConfirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLogoutConfirmOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [logoutConfirmOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('click', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('click', onClickOutside);
    };
  }, [userMenuOpen]);

  function handleConfirmAdd() {
    if (modalYear === year && existingMonthsInYear.includes(modalMonth)) return;
    if (isMoreThanOneMonthAhead(modalYear, modalMonth)) return;
    setModalOpen(false);
    const params = new URLSearchParams({
      year: String(modalYear),
      month: String(modalMonth),
      scheduledStart: modalScheduledStart,
      scheduledEnd: modalScheduledEnd,
      timeStart: modalTimeStart,
      timeEnd: modalTimeEnd,
      breakMinutes: String(modalBreak),
    });
    navigate(`/month/new?${params.toString()}`);
  }

  const dashboardYears = Array.from({ length: 11 }, (_, i) => currentYear - i);
  const modalYears = Array.from({ length: 12 }, (_, i) => currentYear + 1 - i);
  const existingMonthsInYear = months.map((m) => m.month);
  const missingMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (m) => !existingMonthsInYear.includes(m)
  );
  const isMonthExists = (m: number) => modalYear === year && existingMonthsInYear.includes(m);
  const isMonthTooFar = (m: number) => isMoreThanOneMonthAhead(modalYear, m);
  const isMonthDisabled = (m: number) => isMonthExists(m) || isMonthTooFar(m);

  const displayName = user?.display_name || user?.email || '';

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto bg-white dark:bg-neutral-900">
      <header className="flex items-center justify-between mb-8 border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{t('app.title')}</h1>
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="text-sm border border-teal-200 dark:border-teal-800 rounded-md px-3 py-1.5 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 hover:border-teal-400 dark:hover:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset text-teal-800 dark:text-teal-200 flex items-center gap-1"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            {displayName}
            <span className="text-neutral-500 dark:text-neutral-400" aria-hidden>
              {userMenuOpen ? '\u25b2' : '\u25bc'}
            </span>
          </button>
          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 min-w-[10rem] border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 py-1 z-20"
              role="menu"
            >
              <Link
                to="/change-password"
                role="menuitem"
                onClick={() => setUserMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm text-teal-800 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/50 focus:outline-none focus:bg-teal-50 dark:focus:bg-teal-900/50"
              >
                {t('auth.changePassword')}
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setUserMenuOpen(false);
                  setLogoutConfirmOpen(true);
                }}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/50 text-red-700 dark:text-red-400 focus:outline-none focus:bg-red-50 dark:focus:bg-red-950/50"
              >
                {t('auth.logout')}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{t('dashboard.yearLabel')}</span>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
          >
            {dashboardYears.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 hover:border-teal-700 dark:hover:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
        >
          {t('dashboard.addNew')}
        </button>
      </div>

      {loading ? (
        <ul className="space-y-2" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="flex items-center justify-between border border-neutral-200 dark:border-neutral-700 rounded-md px-4 py-3 animate-pulse"
            >
              <span className="h-5 w-24 rounded bg-neutral-200 dark:bg-neutral-700" />
              <span className="h-5 w-20 rounded bg-neutral-100 dark:bg-neutral-800" />
              <div className="flex gap-2">
                <span className="h-8 w-12 rounded bg-neutral-100 dark:bg-neutral-800" />
                <span className="h-8 w-12 rounded bg-neutral-100 dark:bg-neutral-800" />
              </div>
            </li>
          ))}
        </ul>
      ) : months.length === 0 ? (
        <section className="border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 text-center bg-white dark:bg-neutral-800/50">
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">{t('dashboard.noRecords')}</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{t('dashboard.noMonthsInYear', { year })}</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          >
            {t('dashboard.addFirstMonth')}
          </button>
        </section>
      ) : (
        <>
        {missingMonths.length > 0 && (
          <section className="mb-6 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800/50">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('dashboard.monthsMissing', { year })}</h2>
            <div className="flex flex-wrap gap-2">
              {missingMonths.map((m) => {
                const tooFar = isMoreThanOneMonthAhead(year, m);
                return (
                <button
                  key={m}
                  type="button"
                  disabled={tooFar}
                  title={tooFar ? t('dashboard.notAllowedCreate') : undefined}
                  onClick={tooFar ? undefined : () => openModalForMonth(year, m)}
                  className={`rounded-md px-3 py-1.5 text-sm border focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset ${
                      tooFar
                        ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                        : 'border-teal-300 dark:border-teal-700 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200'
                    }`}
                >
                  {m}月
                </button>
                );
              })}
            </div>
          </section>
        )}
        <ul className="space-y-2">
          {months.map((m) => (
            <li
              key={`${m.year}-${m.month}`}
              className="flex items-center justify-between border border-neutral-200 dark:border-neutral-700 rounded-md px-4 py-3 bg-white dark:bg-neutral-800/50"
            >
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{m.label}</span>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {t('dashboard.totalWorkTime')} {minutesToTimeString(m.total_minutes)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/month/${m.year}/${m.month}`)}
                  className="border border-teal-300 dark:border-teal-700 rounded-md px-3 py-1 text-sm hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200"
                >
                  {t('dashboard.view')}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/month/${m.year}/${m.month}/edit`)}
                  className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-3 py-1 text-sm hover:bg-teal-700 dark:hover:bg-teal-600"
                >
                  {t('dashboard.edit')}
                </button>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            ref={modalContentRef}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-title" className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">{t('dashboard.addMonth')}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">{t('dashboard.year')}</label>
                <select
                  value={modalYear}
                  onChange={(e) => setModalYear(Number(e.target.value))}
                  className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                >
                  {modalYears.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">{t('dashboard.month')}</label>
                <select
                  value={modalMonth}
                  onChange={(e) => setModalMonth(Number(e.target.value))}
                  className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-inset bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  aria-describedby={isMonthDisabled(modalMonth) ? 'month-hint' : undefined}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} disabled={isMonthDisabled(m)}>
                      {m}月
                      {isMonthExists(m) ? ` (${t('dashboard.monthExistsShort')})` : ''}
                      {isMonthTooFar(m) ? ` (${t('dashboard.monthTooFarShort')})` : ''}
                    </option>
                  ))}
                </select>
                {(isMonthExists(modalMonth) || isMonthTooFar(modalMonth)) && (
                  <p id="month-hint" className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {isMonthExists(modalMonth)
                      ? t('dashboard.monthExists')
                      : t('dashboard.monthTooFar')}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">{t('dashboard.scheduledTime')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('dashboard.scheduledStart')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="09:30"
                      value={modalScheduledStart}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) { setModalScheduledStart(''); return; }
                        const formatted = raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : null;
                        setModalScheduledStart(formatted || raw);
                      }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) setModalScheduledStart(toHHmm(v) || v);
                      }}
                      className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('dashboard.scheduledEnd')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="18:30"
                      value={modalScheduledEnd}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) { setModalScheduledEnd(''); return; }
                        const formatted = raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : null;
                        setModalScheduledEnd(formatted || raw);
                      }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) setModalScheduledEnd(toHHmm(v) || v);
                      }}
                      className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">{t('dashboard.breakMinutes')}</label>
                <input
                  type="number"
                  min={0}
                  value={modalBreak}
                  onChange={(e) => setModalBreak(Number(e.target.value) || 0)}
                  className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">{t('dashboard.quickInput')}</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('dashboard.quickStart')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="09:30"
                      value={modalTimeStart}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) { setModalTimeStart(''); return; }
                        const formatted = raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : null;
                        setModalTimeStart(formatted || raw);
                      }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) setModalTimeStart(toHHmm(v) || v);
                      }}
                      className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">{t('dashboard.quickEnd')}</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      placeholder="18:30"
                      value={modalTimeEnd}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (!raw) { setModalTimeEnd(''); return; }
                        const formatted = raw.replace(/\D/g, '').length === 4 ? toHHmm(raw) : null;
                        setModalTimeEnd(formatted || raw);
                      }}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        if (v) setModalTimeEnd(toHHmm(v) || v);
                      }}
                      className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-teal-300 dark:border-teal-700 rounded-md py-2 text-sm text-teal-800 dark:text-teal-200 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40"
              >
                {t('dashboard.cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="flex-1 border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600"
              >
                {t('dashboard.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center p-4 z-30"
          onClick={() => setLogoutConfirmOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
        >
          <div
            ref={logoutModalRef}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="logout-modal-title" className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
              {t('dashboard.confirmLogout')}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">{t('dashboard.confirmLogoutMessage')}</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="border border-teal-300 dark:border-teal-700 rounded-md px-4 py-2 text-sm font-medium hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
              >
                {t('dashboard.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  logout();
                }}
                className="border border-red-600 dark:border-red-500 bg-red-600 dark:bg-red-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:ring-inset"
              >
                {t('auth.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
