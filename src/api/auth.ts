import api from './axios';
import type { LoginRequest, SessionInfo, ConsentContext, ConsentRequest, ConsentResponse } from '../types/api';

export const authApi = {
  login: (data: LoginRequest) => api.post<SessionInfo>('/sso/login', data),

  getConsentContext: (params: URLSearchParams) =>
    api.get<ConsentContext>(`/consent?${params.toString()}`),

  submitConsent: (data: ConsentRequest) => api.post<ConsentResponse>('/consent', data),
};
