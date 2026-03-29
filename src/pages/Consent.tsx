import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AxiosError } from 'axios';
import { authApi } from '../api/auth';
import type { ConsentContext, ErrorResponse } from '../types/api';
import PageShell from '../components/PageShell';

const scopeLabels: Record<string, string> = {
  openid: '确认你的身份信息',
  profile: '读取基础资料',
  email: '读取邮箱地址',
  offline_access: '允许长期访问',
  read: '读取受保护资源',
  write: '修改受保护资源'
};

export default function Consent() {
  const [context, setContext] = useState<ConsentContext | null>(null);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState<'approve' | 'deny' | null>(null);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const res = await authApi.getConsentContext(searchParams);
        setContext(res.data);
      } catch (err: unknown) {
        const axiosError = err as AxiosError<ErrorResponse>;
        const errorData = axiosError.response?.data;
        if (axiosError.response?.status === 401 && errorData?.login_url) {
          window.location.href = errorData.login_url;
        } else {
          setError(errorData?.error_description || 'Failed to load consent details');
        }
      }
    };

    fetchContext();
  }, [searchParams]);

  const handleAction = async (action: 'approve' | 'deny') => {
    if (pendingAction !== null) {
      return;
    }

    setPendingAction(action);
    setError('');

    const clientId = searchParams.get('client_id') || context?.clientId;
    const redirectUri = searchParams.get('redirect_uri') || context?.redirectUri;
    const scope = searchParams.get('scope') || context?.scope || undefined;
    const state = searchParams.get('state') || context?.state || undefined;
    const nonce = searchParams.get('nonce') || context?.nonce || undefined;

    if (!clientId || !redirectUri) {
      setError('Missing required authorization parameters');
      setPendingAction(null);
      return;
    }

    try {
      const res = await authApi.submitConsent({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
        state,
        nonce,
        action
      });
      if (!res.data.redirect_url) {
        setError('Missing redirect url');
        setPendingAction(null);
        return;
      }

      window.location.href = res.data.redirect_url;
    } catch (err: unknown) {
      const errorData = (err as AxiosError<ErrorResponse>).response?.data;
      setError(errorData?.error_description || 'Action failed');
      setPendingAction(null);
    }
  };

  if (error) {
    return (
      <PageShell
        title="授权错误"
        description="当前授权流程无法继续。"
        headerIconSrc="/favicon.svg"
        headerIconAlt="Fish SSO"
        tone="danger"
        variant="auth"
      >
        <div className="error">{error}</div>
      </PageShell>
    );
  }

  if (!context) {
    return (
      <PageShell
        title="加载中"
        description="正在获取授权上下文。"
        headerIconSrc="/favicon.svg"
        headerIconAlt="Fish SSO"
        variant="auth"
      >
        <div className="loading-card">
          <div className="loading-spinner" />
          <p className="card-description">请稍候...</p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="授权确认"
      description="确认是否将账号权限授予该应用。"
      headerIconSrc="/favicon.svg"
      headerIconAlt="Fish SSO"
      variant="auth"
    >
      <div className="consent-layout">
        <div className="consent-summary">
          <div className="consent-summary__row">
            <span className="consent-summary__label">当前账号</span>
            <strong className="consent-summary__value">{context.displayName}</strong>
            <span className="consent-summary__meta">@{context.username}</span>
          </div>
          <div className="consent-summary__row">
            <span className="consent-summary__label">客户端</span>
            <strong className="consent-summary__value">{context.clientId}</strong>
          </div>
        </div>

        <section className="consent-scopes">
          <h3>请求的权限</h3>
          <div className="consent-scope-list">
            {context.scopes.map((scope) => (
              <div className="consent-scope-item" key={scope}>
                <span className="consent-scope-item__tag">{scope}</span>
                <p className="consent-scope-item__text">
                  {scopeLabels[scope] || '自定义权限'}
                </p>
              </div>
            ))}
          </div>
        </section>

        <div className="actions consent-actions">
          <button
            onClick={() => handleAction('approve')}
            className="btn"
            disabled={pendingAction !== null}
          >
            {pendingAction === 'approve' ? '授权中...' : '同意授权'}
          </button>
          <button
            onClick={() => handleAction('deny')}
            className="btn btn-secondary"
            disabled={pendingAction !== null}
          >
            {pendingAction === 'deny' ? '处理中...' : '拒绝'}
          </button>
        </div>
      </div>
    </PageShell>
  );
}
