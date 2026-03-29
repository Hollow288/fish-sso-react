import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { authApi } from '../api/auth';
import type { AuthorizedClient, ErrorResponse } from '../types/api';
import PageShell from '../components/PageShell';

const scopeLabels: Record<string, string> = {
  openid: '身份信息',
  profile: '基础资料',
  email: '邮箱地址',
  offline_access: '长期访问',
  read: '读取资源',
  write: '修改资源'
};

function formatTime(ts: number): string {
  const date = new Date(ts * 1000);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function Home() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<AuthorizedClient[] | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authApi.getAuthorizedClients();
        setClients(res.data);
        setLoggedIn(true);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        if (axiosError.response?.status === 401) {
          setLoggedIn(false);
        } else {
          setError(axiosError.response?.data?.error_description || '加载失败');
          setLoggedIn(true);
        }
      }
    };
    load();
  }, []);

  const handleRevoke = async (clientId: string) => {
    if (revoking) return;
    setRevoking(clientId);
    setError('');
    try {
      await authApi.revokeClient(clientId);
      setClients((prev) => prev ? prev.filter((c) => c.client_id !== clientId) : prev);
    } catch (err: unknown) {
      const errorData = (err as AxiosError<ErrorResponse>).response?.data;
      setError(errorData?.error_description || '撤销失败');
    } finally {
      setRevoking(null);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setError('');
    try {
      await authApi.logout();
      navigate('/login', { state: { message: '已成功登出' } });
    } catch (err: unknown) {
      const errorData = (err as AxiosError<ErrorResponse>).response?.data;
      setError(errorData?.error_description || '登出失败');
      setLoggingOut(false);
    }
  };

  // Loading state
  if (loggedIn === null) {
    return (
      <PageShell
        title="Fish SSO"
        headerIconSrc="/favicon.svg"
        headerIconAlt="Fish SSO"
        headerAlign="center"
      >
        <div className="loading-card">
          <div className="loading-spinner" />
          <p className="card-description">加载中...</p>
        </div>
      </PageShell>
    );
  }

  // Not logged in — show welcome page
  if (!loggedIn) {
    return (
      <PageShell
        eyebrow="Service Ready"
        title="Welcome to Fish SSO"
        description="单点登录服务已就绪，请登录以管理您的授权。"
        headerIconSrc="/favicon.svg"
        headerIconAlt="Fish SSO"
        headerAlign="center"
        highlights={['OAuth2', 'OIDC', 'SSO']}
      >
        <div className="action-stack">
          <button className="btn" onClick={() => navigate('/login')}>
            前往登录
          </button>
        </div>
      </PageShell>
    );
  }

  // Logged in — show authorized clients
  return (
    <PageShell
      eyebrow="已登录"
      title="已授权的应用"
      description="以下应用已获得您的账号授权，您可以随时撤销。"
      headerIconSrc="/favicon.svg"
      headerIconAlt="Fish SSO"
      headerAlign="center"
      tone="success"
    >
      {error && <div className="error">{error}</div>}

      {clients && clients.length === 0 && (
        <div className="ac-empty">
          <p>暂无已授权的应用</p>
        </div>
      )}

      {clients && clients.length > 0 && (
        <div className="ac-list">
          {clients.map((client) => (
            <div className="ac-card" key={client.client_id}>
              <div className="ac-card__header">
                <div className="ac-card__info">
                  <strong className="ac-card__name">{client.client_id}</strong>
                  <span className="ac-card__time">授权于 {formatTime(client.authorized_at)}</span>
                </div>
                <div className="ac-card__actions">
                  {client.home_url && (
                    <a
                      className="btn btn-secondary btn-small ac-card__visit"
                      href={client.home_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      前往应用
                    </a>
                  )}
                  <button
                    className="btn btn-secondary btn-small ac-card__revoke"
                    onClick={() => handleRevoke(client.client_id)}
                    disabled={revoking !== null}
                  >
                    {revoking === client.client_id ? '撤销中...' : '撤销授权'}
                  </button>
                </div>
              </div>
              <div className="ac-card__scopes">
                {client.scopes.map((scope) => (
                  <span className="ac-card__scope" key={scope}>
                    {scopeLabels[scope] || scope}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="btn ac-logout"
        onClick={handleLogout}
        disabled={loggingOut}
      >
        {loggingOut ? '登出中...' : '登出'}
      </button>
    </PageShell>
  );
}
