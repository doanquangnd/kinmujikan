import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { fetchMonthsByYear } from '../api/workRecords.js';
import { minutesToTimeString } from '../utils/formatTime.js';
import { isMoreThanOneMonthAhead, getCurrentYearInAppTimezone } from '../utils/dateHelpers.js';
import { useFocusTrap } from '../hooks/useFocusTrap.js';

const currentYear = getCurrentYearInAppTimezone();

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [year, setYear] = useState(currentYear);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const modalContentRef = useRef(null);
  const logoutModalRef = useRef(null);
  const userMenuRef = useRef(null);
  useFocusTrap(modalContentRef, modalOpen);
  useFocusTrap(logoutModalRef, logoutConfirmOpen);
  const [modalYear, setModalYear] = useState(currentYear);
  const [modalMonth, setModalMonth] = useState(1);
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

  const openModalForMonth = useCallback((y, m) => {
    setModalYear(y);
    setModalMonth(m);
    setModalOpen(true);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalOpen]);

  useEffect(() => {
    if (!logoutConfirmOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setLogoutConfirmOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [logoutConfirmOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setUserMenuOpen(false);
    };
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
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
    navigate(`/month/new?year=${modalYear}&month=${modalMonth}&timeStart=${modalTimeStart}&timeEnd=${modalTimeEnd}&breakMinutes=${modalBreak}`);
  }

  const dashboardYears = Array.from({ length: 11 }, (_, i) => currentYear - i);
  const modalYears = Array.from({ length: 12 }, (_, i) => currentYear + 1 - i);
  const existingMonthsInYear = months.map((m) => m.month);
  const missingMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter(
    (m) => !existingMonthsInYear.includes(m)
  );
  const isMonthExists = (m) => modalYear === year && existingMonthsInYear.includes(m);
  const isMonthTooFar = (m) => isMoreThanOneMonthAhead(modalYear, m);
  const isMonthDisabled = (m) => isMonthExists(m) || isMonthTooFar(m);

  const displayName = user?.display_name || user?.email || '';

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto bg-white dark:bg-neutral-900">
      <header className="flex items-center justify-between mb-8 border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">勤務時間</h1>
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
                Đổi mật khẩu
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
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Năm:</span>
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
          Thêm mới
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
          <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">Chưa có bản ghi nào</h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">Năm {year} chưa có tháng nào. Thêm tháng đầu tiên để bắt đầu ghi 勤務時間.</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          >
            Thêm tháng đầu tiên
          </button>
        </section>
      ) : (
        <>
        {missingMonths.length > 0 && (
          <section className="mb-6 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 bg-white dark:bg-neutral-800/50">
            <h2 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Tháng chưa có trong {year}年</h2>
            <div className="flex flex-wrap gap-2">
              {missingMonths.map((m) => {
                const tooFar = isMoreThanOneMonthAhead(year, m);
                return (
                <button
                  key={m}
                  type="button"
                  disabled={tooFar}
                  title={tooFar ? 'Chưa cho phép tạo' : undefined}
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
                総業務時間: {minutesToTimeString(m.total_minutes)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/month/${m.year}/${m.month}`)}
                  className="border border-teal-300 dark:border-teal-700 rounded-md px-3 py-1 text-sm hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200"
                >
                  Xem
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/month/${m.year}/${m.month}/edit`)}
                  className="border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md px-3 py-1 text-sm hover:bg-teal-700 dark:hover:bg-teal-600"
                >
                  Sửa
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
            <h2 id="modal-title" className="text-lg font-semibold mb-4 text-neutral-900 dark:text-neutral-100">Thêm tháng mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">Năm</label>
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
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">Tháng</label>
                <select
                  value={modalMonth}
                  onChange={(e) => setModalMonth(Number(e.target.value))}
                  className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-500 focus:ring-inset bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                  aria-describedby={isMonthDisabled(modalMonth) ? 'month-hint' : undefined}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m} disabled={isMonthDisabled(m)}>
                      {m}月
                      {isMonthExists(m) ? ' (đã có)' : ''}
                      {isMonthTooFar(m) ? ' (chưa cho phép tạo)' : ''}
                    </option>
                  ))}
                </select>
                {(isMonthExists(modalMonth) || isMonthTooFar(modalMonth)) && (
                  <p id="month-hint" className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    {isMonthExists(modalMonth)
                      ? 'Tháng này đã có bản ghi. Chọn tháng khác.'
                      : 'Chỉ được tạo tối đa đến tháng sau so với hiện tại.'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">開始 (giờ bắt đầu)</label>
                <input
                  type="time"
                  value={modalTimeStart}
                  onChange={(e) => setModalTimeStart(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">終了 (giờ kết thúc)</label>
                <input
                  type="time"
                  value={modalTimeEnd}
                  onChange={(e) => setModalTimeEnd(e.target.value)}
                  className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">休憩 (phút)</label>
                <input
                  type="number"
                  min={0}
                  value={modalBreak}
                  onChange={(e) => setModalBreak(Number(e.target.value) || 0)}
                  className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-teal-300 dark:border-teal-700 rounded-md py-2 text-sm text-teal-800 dark:text-teal-200 hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="flex-1 border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600"
              >
                Xác nhận
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
              Xác nhận đăng xuất
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">Bạn có chắc muốn đăng xuất?</p>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="border border-teal-300 dark:border-teal-700 rounded-md px-4 py-2 text-sm font-medium hover:border-teal-500 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 text-teal-800 dark:text-teal-200 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  logout();
                }}
                className="border border-red-600 dark:border-red-500 bg-red-600 dark:bg-red-500 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 dark:focus:ring-red-500 focus:ring-inset"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
