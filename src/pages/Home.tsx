import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { authApi } from '../api/auth';
import type { AuthorizedClient, CurrentUser, ErrorResponse } from '../types/api';
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

function initial(value: string): string {
  return Array.from(value.trim())[0]?.toUpperCase() || 'F';
}

export default function Home() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<AuthorizedClient[] | null>(null);
  const [account, setAccount] = useState<CurrentUser | null>(null);
  const [accountError, setAccountError] = useState('');
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const [clientsResult, accountResult] = await Promise.allSettled([
        authApi.getAuthorizedClients(),
        authApi.getCurrentUser()
      ]);
      const clientsFailure = clientsResult.status === 'rejected'
        ? clientsResult.reason as AxiosError<ErrorResponse> : null;
      const accountFailure = accountResult.status === 'rejected'
        ? accountResult.reason as AxiosError<ErrorResponse> : null;
      if (clientsFailure?.response?.status === 401 || accountFailure?.response?.status === 401) {
        setLoggedIn(false);
        return;
      }
      if (clientsResult.status === 'fulfilled') {
        setClients(clientsResult.value.data);
      } else {
        setError(clientsFailure?.response?.data?.error_description || '授权信息加载失败');
      }
      if (accountResult.status === 'fulfilled') {
        setAccount(accountResult.value.data);
      } else {
        setAccountError(accountFailure?.response?.data?.error_description || '账号信息加载失败');
      }
      setLoggedIn(true);
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

  // Logged in — account center
  return (
    <div className="account-page">
      <main className="account-page__container">
        <header className="account-page__header">
          <div className="account-page__heading">
            <img className="account-page__logo" src="/favicon.svg" alt="Fish SSO" />
            <div>
              <p className="account-page__eyebrow">FISH SSO / 账号中心</p>
              <h1>已授权的应用</h1>
              <p className="account-page__description">查看并管理可访问你账号的应用。</p>
            </div>
          </div>
          <button className="account-page__logout" type="button" onClick={handleLogout} disabled={loggingOut}>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 16l4-4-4-4M9 12h10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {loggingOut ? '登出中...' : '登出'}
          </button>
        </header>

        <div className="account-page__grid">
          <section className="account-apps" aria-labelledby="account-apps-title">
            <div className="account-section-heading">
              <div>
                <h2 id="account-apps-title">应用授权</h2>
                <p>你可以随时撤销不再使用的应用。</p>
              </div>
              {clients && <span className="account-apps__count">{clients.length} 个应用</span>}
            </div>
            {error && <div className="error" role="alert">{error}</div>}
            {clients?.length === 0 && (
              <div className="account-apps__empty">
                <span className="account-apps__empty-icon">✦</span>
                <strong>暂无已授权的应用</strong>
                <p>当你授权应用访问账号后，它们会显示在这里。</p>
              </div>
            )}
            {clients && clients.length > 0 && (
              <div className="account-apps__list">
                {clients.map((client) => (
                  <article className="grant-card" key={client.client_id}>
                    <div className="grant-card__heading">
                      <span className="grant-card__icon" aria-hidden="true">{initial(client.client_id)}</span>
                      <div className="grant-card__name-group">
                        <h3>{client.client_id}</h3>
                        <p>授权于 {formatTime(client.authorized_at)}</p>
                      </div>
                    </div>
                    <div className="grant-card__scopes" aria-label="已授权权限">
                      {client.scopes.map((scope) => <span key={scope}>{scopeLabels[scope] || scope}</span>)}
                    </div>
                    <div className="grant-card__footer">
                      <span>{client.scopes.length} 项访问权限</span>
                      <div className="grant-card__actions">
                        {client.home_url && <a href={client.home_url} target="_blank" rel="noopener noreferrer">前往应用 ↗</a>}
                        <button type="button" onClick={() => handleRevoke(client.client_id)} disabled={revoking !== null}>
                          {revoking === client.client_id ? '撤销中...' : '撤销授权'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="account-profile" aria-labelledby="account-profile-title">
            <div className="account-section-heading">
              <div>
                <h2 id="account-profile-title">账号信息</h2>
                <p>当前登录的 Fish SSO 账号</p>
              </div>
            </div>
            {account ? (
              <>
                <div className="account-profile__identity">
                  <span className="account-profile__avatar" aria-hidden="true">{initial(account.name || account.username)}</span>
                  <div><strong>{account.name || account.username}</strong><span>@{account.username}</span></div>
                </div>
                <dl className="account-profile__details">
                  <div><dt>用户名</dt><dd>{account.username}</dd></div>
                  <div><dt>绑定邮箱</dt><dd>{account.email || '未设置'}</dd></div>
                </dl>
              </>
            ) : (
              <p className="account-profile__error">{accountError || '账号信息暂不可用'}</p>
            )}
            <Link className="account-profile__password" to="/change-password">
              <span>修改密码</span><span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
