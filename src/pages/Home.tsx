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

const iconPaths = {
  logout: 'M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 16l4-4-4-4M9 12h10',
  external: 'M14 4h6v6M20 4 10 14M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4',
  shield: 'M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6l-8-3ZM8.5 12l2.5 2.5 4.5-5',
  apps: 'M4 4h6v6H4V4ZM14 4h6v6h-6V4ZM4 14h6v6H4v-6ZM14 14h6v6h-6v-6Z',
  key: 'M15 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM11 12 3 20h4v-3h3v-3M16 8h.01'
};

function AccountIcon({ name }: { name: keyof typeof iconPaths }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={iconPaths[name]} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
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
      <header className="account-page__header">
        <div className="account-page__nav">
          <div className="account-page__brand">
            <img className="account-page__logo" src="/favicon.svg" alt="" />
            <span>Fish SSO</span>
            <span className="account-page__brand-divider" aria-hidden="true" />
            <span className="account-page__nav-label">账号中心</span>
          </div>
          <div className="account-page__session">
            <span className="account-page__session-status"><span />已登录</span>
            <button className="account-page__logout" type="button" onClick={handleLogout} disabled={loggingOut}>
              <AccountIcon name="logout" />
              {loggingOut ? '登出中...' : '退出登录'}
            </button>
          </div>
        </div>
      </header>

      <main className="account-page__container">
        <div className="account-page__intro">
          <div className="account-page__title-row">
            <h1 id="account-apps-title">已授权的应用</h1>
            {clients && <span className="account-apps__count" aria-live="polite">{clients.length} 个应用</span>}
          </div>
          <p className="account-page__description">查看应用的访问权限，随时管理或撤销授权。</p>
        </div>

        <div className="account-page__grid">
          <section className="account-apps" aria-labelledby="account-apps-title">
            {error && <div className="error" role="alert">{error}</div>}
            {clients?.length === 0 && (
              <div className="account-apps__empty">
                <span className="account-apps__empty-icon"><AccountIcon name="apps" /></span>
                <h2>还没有连接任何应用</h2>
                <p>使用 Fish SSO 登录并授权应用后，<br />就能在这里查看和管理。</p>
              </div>
            )}
            {clients && clients.length > 0 && (
              <>
                <div className="account-apps__list">
                  {clients.map((client) => (
                    <article className="grant-card" key={client.client_id}>
                      <div className="grant-card__heading">
                        <span className="grant-card__icon" data-tone={(client.client_id.codePointAt(0) || 0) % 3} aria-hidden="true">{initial(client.client_id)}</span>
                        <div className="grant-card__name-group">
                          <h2>{client.client_id}</h2>
                          <p>授权于 {formatTime(client.authorized_at)}</p>
                        </div>
                      </div>
                      <div className="grant-card__permissions">
                        <p className="grant-card__label">已授权的访问权限<span>{client.scopes.length} 项权限</span></p>
                        <div className="grant-card__scopes" aria-label="已授权权限">
                          {client.scopes.map((scope) => <span key={scope}>{scopeLabels[scope] || scope}</span>)}
                        </div>
                      </div>
                      <div className="grant-card__footer">
                        {client.home_url ? (
                          <a className="grant-card__visit" href={client.home_url} target="_blank" rel="noopener noreferrer" aria-label={`前往应用 ${client.client_id}（新窗口打开）`}>
                            前往应用<AccountIcon name="external" />
                          </a>
                        ) : <span className="grant-card__no-link">未设置应用入口</span>}
                        <button type="button" onClick={() => handleRevoke(client.client_id)} disabled={revoking !== null} aria-label={`撤销 ${client.client_id} 的授权`}>
                          {revoking === client.client_id ? '撤销中...' : '撤销授权'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
                <p className="account-apps__note"><AccountIcon name="shield" /><span>撤销授权后，应用需经你同意才能再次访问账号。</span></p>
              </>
            )}
          </section>

          <aside className="account-sidebar" aria-labelledby="account-profile-title">
            <section className="account-profile">
              <div className="account-section-heading">
                <h2 id="account-profile-title">账号信息</h2>
                <span>当前账号</span>
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
                <p className="account-profile__error" role="alert">{accountError || '账号信息暂不可用'}</p>
              )}
              <Link className="account-profile__password" to="/change-password">
                <span><AccountIcon name="key" />修改密码</span><span aria-hidden="true">→</span>
              </Link>
            </section>
            <div className="account-sidebar__note">
              <AccountIcon name="shield" />
              <div><strong>授权小提示</strong><p>仅向信任的应用授权，定期检查并清理不再使用的访问权限。</p></div>
            </div>
          </aside>
        </div>
        <footer className="account-page__footer"><span>Fish SSO</span><span>统一身份 · 便捷连接</span></footer>
      </main>
    </div>
  );
}
