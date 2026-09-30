import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { authApi } from '../api/auth';
import type { ErrorResponse } from '../types/api';
import PageShell from '../components/PageShell';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }
    if (newPassword === currentPassword) {
      setError('新密码不能与当前密码相同');
      return;
    }

    setSubmitting(true);
    try {
      await authApi.changePassword({ current_password: currentPassword, new_password: newPassword });
      navigate('/login', { replace: true, state: { message: '密码已修改，请重新登录' } });
    } catch (err: unknown) {
      const response = (err as AxiosError<ErrorResponse>).response;
      if (response?.status === 401) {
        navigate('/login', { replace: true, state: { message: '登录已过期，请重新登录' } });
        return;
      }
      setError(response?.data?.error_description || '修改失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell
      eyebrow="账号安全"
      title="修改密码"
      description="输入当前密码，为你的账号设置新密码。"
      headerIconSrc="/favicon.svg"
      headerIconAlt="Fish SSO"
      variant="auth"
    >
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="auth-form__fields">
          <div className="form-group">
            <label htmlFor="current-password">当前密码</label>
            <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">新密码</label>
            <input id="new-password" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-password">确认新密码</label>
            <input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          </div>
          <p className="password-change-note">修改成功后，所有设备都需要重新登录。</p>
          {error && <p className="field-error" role="alert">{error}</p>}
        </div>
        <div className="action-stack">
          <button className="btn" type="submit" disabled={submitting}>{submitting ? '修改中...' : '确认修改'}</button>
          <div className="password-change-links">
            <Link className="form-link" to="/">返回账号中心</Link>
            <Link className="form-link" to="/forgot-password">忘记当前密码？</Link>
          </div>
        </div>
      </form>
    </PageShell>
  );
}
