import { useState, useRef, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import TurnstileWidget, { getTurnstileResponse, resetTurnstile } from '@/components/TurnstileWidget';
import type { ApiError } from '@/api/client';

export default function Register() {
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const turnstileWidgetIdRef = useRef<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const token = getTurnstileResponse(turnstileWidgetIdRef.current);
    setLoading(true);
    try {
      const user = await apiRegister(email, password, displayName, token);
      setUser(user);
      navigate('/', { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      const errors = apiErr.data?.errors;
      const errMsg = Array.isArray(errors) ? errors.join(' ') : undefined;
      setError(apiErr.message || errMsg || 'Đăng ký thất bại');
      resetTurnstile(turnstileWidgetIdRef.current);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-white dark:bg-neutral-900">
      <div className="w-full max-w-sm border border-neutral-200 dark:border-neutral-700 rounded-lg p-8 bg-white dark:bg-neutral-800">
        <h1 className="text-xl font-semibold mb-6 text-neutral-900 dark:text-neutral-100">Đăng ký</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800 rounded-md p-2 bg-red-50 dark:bg-red-950/50">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">Mật khẩu</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1 text-neutral-800 dark:text-neutral-200">Tên hiển thị (tùy chọn)</label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-neutral-300 dark:border-neutral-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
            />
          </div>
          <TurnstileWidget onReady={(id) => { turnstileWidgetIdRef.current = id; }} />
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-teal-600 dark:border-teal-500 bg-teal-600 dark:bg-teal-500 text-white rounded-md py-2 text-sm font-medium hover:bg-teal-700 dark:hover:bg-teal-600 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 focus:ring-inset"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          Đã có tài khoản? <Link to="/login" className="underline text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
