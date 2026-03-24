import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import type { ErrorResponse } from '../types/api';
import PageShell from '../components/PageShell';

function normalizeReturnTo(returnTo: string | null) {
  if (!returnTo) {
    return '/';
  }

  try {
    const url = new URL(returnTo, window.location.origin);
    return `${url.pathname}${url.search}${url.hash}` || '/';
  } catch {
    return returnTo.startsWith('/') ? returnTo : '/';
  }
}

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const rawReturnTo = searchParams.get('return_to');
  const returnTo = normalizeReturnTo(rawReturnTo);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.login({
        username,
        password,
        return_to: rawReturnTo ? returnTo : undefined
      });

      window.location.href = returnTo;
    } catch (err: any) {
      const errorData = err.response?.data as ErrorResponse;
      setError(errorData?.error_description || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell
      title="登录"
      description="使用统一账号完成认证。"
      headerIconSrc="/favicon.svg"
      headerIconAlt="Fish SSO"
      variant="auth"
    >
      <form className="auth-form auth-form--compact" onSubmit={handleSubmit} autoComplete="off">
        <div className="auth-form__fields">
          <div className="form-group">
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              name="login_username"
              type="text"
              autoComplete="off"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">密码</label>
            <div className="password-input-wrap">
              <input
                id="password"
                name="login_password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? '隐藏密码' : '显示密码'}
                aria-controls="password"
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M3 3l18 18M10.6 10.6A2 2 0 0012 14a2 2 0 001.4-.6M9.4 5.8A10 10 0 0112 5c5.5 0 9 7 9 7a15.3 15.3 0 01-3.2 4.2M6.2 8.4A15.4 15.4 0 003 12s3.5 7 9 7a10.3 10.3 0 004.2-.9"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          {error && <div className="error">{error}</div>}
        </div>

        <button type="submit" className="btn" disabled={isSubmitting}>
          {isSubmitting ? '登录中...' : '登录'}
        </button>
      </form>
    </PageShell>
  );
}
