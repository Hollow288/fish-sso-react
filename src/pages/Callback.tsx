import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';
import { clearOidcTransaction, verifyCallbackState } from '../utils/oidc';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const info = {
    code: searchParams.get('code'),
    error: searchParams.get('error'),
    error_description: searchParams.get('error_description'),
    state: searchParams.get('state')
  };
  const stateCheck = useMemo(() => verifyCallbackState(info.state), [info.state]);
  const isStateValid = stateCheck.status === 'valid';
  const hasCode = Boolean(info.code);
  const isSuccess = hasCode && isStateValid;

  useEffect(() => {
    clearOidcTransaction();
  }, []);

  const stateCheckTextMap = {
    valid: '已通过',
    missing_returned: '回调未返回 state',
    missing_stored: '本地缺少待校验 state',
    mismatch: 'state 不匹配'
  } as const;

  return (
    <PageShell
      eyebrow="OIDC Callback"
      title={isSuccess ? '授权成功，已收到 code' : '回调校验未通过'}
      description={isSuccess ? '请将 code 交给你的 BFF/后端换取 token。' : '请检查授权参数或重新发起登录。'}
      tone={isSuccess ? 'success' : 'danger'}
      highlights={[
        'Code + State 回调参数',
        'State 一致性校验',
        '适配标准 OIDC 授权码流程'
      ]}
      meta={[
        { label: '结果', value: isSuccess ? '授权成功' : '授权失败' },
        { label: 'State 校验', value: stateCheckTextMap[stateCheck.status] }
      ]}
    >
      {!isSuccess && (
        <div className="error-panel">
          <div className="error-panel__row">
            <span className="error-panel__label">Error</span>
            <p>{info.error || (hasCode ? 'invalid_state' : 'unknown_error')}</p>
          </div>
          <div className="error-panel__row">
            <span className="error-panel__label">Description</span>
            <p>{info.error_description || '授权失败或回调参数不完整。'}</p>
          </div>
        </div>
      )}

      <div className="detail-grid">
        {hasCode ? (
          <>
            <div className="detail-card">
              <span className="detail-card__label">Authorization Code</span>
              <p className="detail-card__value detail-card__value--small">{info.code}</p>
            </div>
            <div className="detail-card">
              <span className="detail-card__label">State</span>
              <p className="detail-card__value detail-card__value--small">{info.state || '未返回 state'}</p>
            </div>
          </>
        ) : (
          <>
            <div className="detail-card">
              <span className="detail-card__label">Error</span>
              <p className="detail-card__value detail-card__value--small">{info.error || 'unknown_error'}</p>
            </div>
            <div className="detail-card">
              <span className="detail-card__label">Description</span>
              <p className="detail-card__value detail-card__value--small">
                {info.error_description || '未返回详细错误描述。'}
              </p>
            </div>
          </>
        )}
      </div>

      {stateCheck.status === 'mismatch' && (
        <div className="error">
          期望 state: <code>{stateCheck.expectedState}</code>
          <br />
          实际 state: <code>{stateCheck.actualState}</code>
        </div>
      )}
      {stateCheck.status === 'missing_stored' && (
        <div className="error">未找到本地 state 缓存，可能是直接打开了回调地址。</div>
      )}
      {stateCheck.status === 'missing_returned' && (
        <div className="error">回调参数缺少 state，已拒绝继续处理。</div>
      )}
      {isSuccess && (
        <div className="success">
          下一步：把 <code>code</code> 和 <code>state</code> 发给你的后端/BFF，由后端调用 <code>/sso/token</code>。
        </div>
      )}

      <div className="action-stack">
        <a className="btn" href="/">
          重新发起授权
        </a>
        <a className="btn btn-secondary" href="/login">
          打开登录页
        </a>
      </div>
    </PageShell>
  );
}
