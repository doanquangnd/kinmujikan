import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth.js';
import { useToast } from '../context/ToastContext.jsx';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast('Đã đổi mật khẩu.', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-white dark:bg-neutral-900">
      <div className="w-full max-w-sm border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 bg-white dark:bg-neutral-800">
        <h1 className="text-xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100">Đổi mật khẩu</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 rounded-md p-2 bg-red-50 dark:bg-red-950/50">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">
              Mật khẩu hiện tại
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">
              Mật khẩu mới
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">
              Xác nhận mật khẩu mới
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          >
            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          <Link to="/" className="underline text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">Quay lại trang chủ</Link>
        </p>
      </div>
    </div>
  );
}
