import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { authApi } from '../api/auth';
import type { ErrorResponse } from '../types/api';
import PageShell from '../components/PageShell';

type Step = 'send-code' | 'reset';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('send-code');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const maskEmail = (addr: string) => {
    const [local, domain] = addr.split('@');
    const visible = local.slice(0, Math.min(3, local.length));
    return `${visible}***@${domain}`;
  };

  const handleSendCode = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !email.trim()) {
      setError('用户名和邮箱不能为空');
      return;
    }
    if (!isValidEmail(email)) {
      setError('请输入正确的邮箱地址');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.sendResetCode({ username, email });
      setCountdown(60);
      setStep('reset');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;
      if (status === 429) {
        setError('发送过于频繁，请稍后再试');
        setCountdown(60);
      } else {
        setError(data?.error_description || '发送失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newPassword) {
      setError('请输入新密码');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (!code) {
      setError('请输入验证码');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.resetPassword({ username, new_password: newPassword, code });
      navigate('/login', { state: { message: '密码重置成功，请重新登录' } });
    } catch (err: unknown) {
      const data = (err as AxiosError<ErrorResponse>).response?.data;
      if (data?.error === 'code_exhausted') {
        setError('验证码错误次数过多，请重新获取');
        setStep('send-code');
        setCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data?.error_description || '重置失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (countdown > 0) return;
    setError('');
    setIsSubmitting(true);

    try {
      await authApi.sendResetCode({ username, email });
      setCountdown(60);
      setError('');
    } catch (err: unknown) {
      const axiosError = err as AxiosError<ErrorResponse>;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data;
      if (status === 429) {
        setError('发送过于频繁，请稍后再试');
        setCountdown(60);
      } else {
        setError(data?.error_description || '发送失败，请重试');
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [countdown, username, email]);

  return (
    <PageShell
      title={step === 'send-code' ? '忘记密码' : '重置密码'}
      description={step === 'send-code' ? '输入用户名和绑定邮箱，获取验证码。' : undefined}
      headerIconSrc="/favicon.svg"
      headerIconAlt="Fish SSO"
      variant="auth"
    >
      {step === 'send-code' ? (
        <form className="auth-form auth-form--compact" onSubmit={handleSendCode} autoComplete="off">
          <div className="auth-form__fields">
            <div className="form-group">
              <label htmlFor="username">用户名</label>
              <input
                id="username"
                type="text"
                autoComplete="off"
                placeholder="请输入用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">邮箱</label>
              <input
                id="email"
                type="text"
                autoComplete="off"
                placeholder="请输入绑定邮箱"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="field-error">{error}</p>}
          </div>

          <div className="action-stack">
            <button type="submit" className="btn" disabled={isSubmitting || countdown > 0}>
              {isSubmitting ? '发送中...' : countdown > 0 ? `${countdown}s 后可重新发送` : '发送验证码'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/login')}>
              返回登录
            </button>
          </div>
        </form>
      ) : (
        <form className="auth-form auth-form--compact" onSubmit={handleReset} autoComplete="off">
          <div className="auth-form__fields">
            <div className="reset-hint">
              <p>正在重置 <strong>{username}</strong> 的密码</p>
              <p>验证码已发送至 <strong>{maskEmail(email)}</strong></p>
            </div>
            <div className="form-group">
              <label htmlFor="new-password">新密码</label>
              <div className="password-input-wrap">
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="请输入新密码"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? '隐藏密码' : '显示密码'}
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
            <div className="form-group">
              <label htmlFor="confirm-password">确认密码</label>
              <div className="password-input-wrap">
                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="请再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="code">验证码</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="请输入6位验证码"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            {error && <p className="field-error">{error}</p>}
          </div>

          <div className="actions">
            <button type="submit" className="btn" disabled={isSubmitting}>
              {isSubmitting ? '重置中...' : '确认重置'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={countdown > 0 || isSubmitting}
              onClick={handleResend}
            >
              {countdown > 0 ? `${countdown}s` : '重新获取'}
            </button>
          </div>
        </form>
      )}
    </PageShell>
  );
}
