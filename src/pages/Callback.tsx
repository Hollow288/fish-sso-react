import { useSearchParams } from 'react-router-dom';
import PageShell from '../components/PageShell';

export default function Callback() {
  const [searchParams] = useSearchParams();
  const info = {
    code: searchParams.get('code'),
    error: searchParams.get('error'),
    error_description: searchParams.get('error_description'),
    state: searchParams.get('state')
  };
  const isSuccess = Boolean(info.code);

  return (
    <PageShell
      eyebrow="Callback"
      title={isSuccess ? 'Authorization completed.' : 'The callback returned an error.'}
      description="The callback result is shown in a compact, centered layout."
      tone={isSuccess ? 'success' : 'danger'}
      highlights={[
        'Clear success and error states',
        'Returned values grouped together',
        'Easy to retry the flow'
      ]}
      meta={[
        { label: 'Result', value: isSuccess ? 'Authorization succeeded' : 'Authorization failed' },
        { label: 'State', value: info.state || 'No state returned' }
      ]}
    >
      <div className="detail-grid">
        {isSuccess ? (
          <>
            <div className="detail-card">
              <span className="detail-card__label">Authorization code</span>
              <p className="detail-card__value detail-card__value--small">{info.code}</p>
            </div>
            <div className="detail-card">
              <span className="detail-card__label">State</span>
              <p className="detail-card__value detail-card__value--small">{info.state || 'No state returned'}</p>
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
                {info.error_description || 'No additional description was returned.'}
              </p>
            </div>
          </>
        )}
      </div>

      <div className="action-stack">
        <a className="btn" href="/test">
          Run the flow again
        </a>
        <a className="btn btn-secondary" href="/login">
          Open login page
        </a>
      </div>
    </PageShell>
  );
}
