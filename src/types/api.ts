export interface LoginRequest {
  username: string;
  password: string;
  return_to?: string;
}

export interface SessionInfo {
  session_id: string;
  expires_at: number;
}

export interface ConsentContext {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  username: string;
  displayName: string;
  state?: string;
  scope?: string;
}

export interface ConsentRequest {
  client_id: string;
  redirect_uri: string;
  scope?: string;
  state?: string;
  action: 'approve' | 'deny';
}

export interface ConsentResponse {
  redirect_url: string;
}

export interface ErrorResponse {
  error: string;
  error_description: string;
  login_url?: string;
}

export interface ResetCodeRequest {
  username: string;
  email: string;
}

export interface ResetPasswordRequest {
  username: string;
  new_password: string;
  code: string;
}
