import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../api/auth.js';
import { useAuth } from '../context/AuthContext.jsx';
import TurnstileWidget, { getTurnstileResponse, resetTurnstile } from '../components/TurnstileWidget.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const turnstileWidgetIdRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const token = getTurnstileResponse(turnstileWidgetIdRef.current);
    setLoading(true);
    try {
      const user = await apiRegister(email, password, displayName, token);
      setUser(user);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || (err.data?.errors?.join?.(' ') ?? 'Đăng ký thất bại'));
      resetTurnstile(turnstileWidgetIdRef.current);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm border border-neutral-200 rounded-lg p-8">
        <h1 className="text-xl font-semibold mb-6">Đăng ký</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-red-600 text-sm border border-red-200 rounded-md p-2 bg-red-50">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium mb-1">Tên hiển thị (tùy chọn)</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <TurnstileWidget onReady={(id) => { turnstileWidgetIdRef.current = id; }} />
          <button
            type="submit"
            disabled={loading}
            className="w-full border border-neutral-700 bg-neutral-800 text-white rounded-md py-2 text-sm font-medium hover:border-neutral-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-500">
          Đã có tài khoản? <Link to="/login" className="underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
