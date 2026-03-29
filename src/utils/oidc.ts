const OIDC_TX_KEY = 'fish_sso_oidc_tx';

type OidcTransaction = {
  state: string;
  nonce: string;
  createdAt: number;
};

export type OidcStateCheckResult =
  | { status: 'valid'; expectedState: string; actualState: string }
  | { status: 'missing_returned'; expectedState?: string }
  | { status: 'missing_stored'; actualState?: string }
  | { status: 'mismatch'; expectedState: string; actualState: string };

export type OidcClientConfig = {
  clientId: string;
  redirectUri: string;
  scope: string;
  authorizeEndpoint: string;
};

function randomToken() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getEnvString(name: string) {
  const value = import.meta.env[name];
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

export function getOidcClientConfig(): OidcClientConfig {
  const clientId = getEnvString('VITE_SSO_CLIENT_ID') || 'test-client-1';
  const scope = getEnvString('VITE_SSO_SCOPE') || 'openid profile email';
  const authorizeEndpoint = getEnvString('VITE_SSO_AUTHORIZE_ENDPOINT') || '/sso/authorize';
  const redirectUri = getEnvString('VITE_SSO_REDIRECT_URI') || `${window.location.origin}/callback`;

  return {
    clientId,
    redirectUri,
    scope,
    authorizeEndpoint
  };
}

function toAuthorizeUrl(authorizeEndpoint: string) {
  try {
    return new URL(authorizeEndpoint);
  } catch {
    return new URL(authorizeEndpoint, window.location.origin);
  }
}

function saveTransaction(tx: OidcTransaction) {
  sessionStorage.setItem(OIDC_TX_KEY, JSON.stringify(tx));
}

export function readOidcTransaction(): OidcTransaction | null {
  const raw = sessionStorage.getItem(OIDC_TX_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as OidcTransaction;
    if (!parsed.state || !parsed.nonce) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearOidcTransaction() {
  sessionStorage.removeItem(OIDC_TX_KEY);
}

export function buildAuthorizeUrl(config?: OidcClientConfig) {
  const finalConfig = config ?? getOidcClientConfig();
  const state = randomToken();
  const nonce = randomToken();
  const url = toAuthorizeUrl(finalConfig.authorizeEndpoint);

  url.searchParams.set('client_id', finalConfig.clientId);
  url.searchParams.set('redirect_uri', finalConfig.redirectUri);
  url.searchParams.set('scope', finalConfig.scope);
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);

  saveTransaction({
    state,
    nonce,
    createdAt: Date.now()
  });

  return url.toString();
}

export function verifyCallbackState(returnedState: string | null): OidcStateCheckResult {
  const tx = readOidcTransaction();
  if (!returnedState) {
    return { status: 'missing_returned', expectedState: tx?.state };
  }

  if (!tx) {
    return { status: 'missing_stored', actualState: returnedState };
  }

  if (tx.state !== returnedState) {
    return {
      status: 'mismatch',
      expectedState: tx.state,
      actualState: returnedState
    };
  }

  return {
    status: 'valid',
    expectedState: tx.state,
    actualState: returnedState
  };
}

