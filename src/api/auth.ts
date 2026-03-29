import api from './axios';
import type { LoginRequest, SessionInfo, ConsentContext, ConsentRequest, ConsentResponse, ResetCodeRequest, ResetPasswordRequest, AuthorizedClient } from '../types/api';

export const authApi = {
  login: (data: LoginRequest) => api.post<SessionInfo>('/sso/login', data),

  getConsentContext: (params: URLSearchParams) =>
    api.get<ConsentContext>(`/consent?${params.toString()}`),

  submitConsent: (data: ConsentRequest) => api.post<ConsentResponse>('/consent', data),

  sendResetCode: (data: ResetCodeRequest) => api.post('/sso/password/reset-code', data),

  resetPassword: (data: ResetPasswordRequest) => api.post('/sso/password/reset', data),

  getAuthorizedClients: () => api.get<AuthorizedClient[]>('/sso/authorized-clients'),

  revokeClient: (clientId: string) => api.delete(`/sso/authorized-clients/${clientId}`),

  logout: () => api.post('/sso/logout'),
};
