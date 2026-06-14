import { useMemo } from 'react';

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null;
  onRefreshTokenExpired?: () => void;
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    const accessToken = this.config.getAccessToken();
    if (accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      if (response.status === 401) this.config.onRefreshTokenExpired?.();
      let message = `API error: ${response.statusText}`;
      try {
        const body = (await response.json()) as { message?: string | string[] };
        message = Array.isArray(body.message) ? body.message.join(', ') : body.message || message;
      } catch {
        // Keep the HTTP status text when the response is not JSON.
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data === undefined ? undefined : JSON.stringify(data)
    });
  }

  patch<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data === undefined ? undefined : JSON.stringify(data)
    });
  }

  auth() {
    return {
      registerDonor: <T>(data: unknown) => this.post<T>('/auth/register/donor', data),
      registerHospital: <T>(data: unknown) => this.post<T>('/auth/register/hospital', data),
      login: <T>(data: unknown) => this.post<T>('/auth/login', data),
      refresh: <T>(refreshToken: string) =>
        this.post<T>('/auth/refresh', undefined, {
          headers: { Authorization: `Bearer ${refreshToken}` }
        }),
      logout: <T>() => this.post<T>('/auth/logout'),
      me: <T>() => this.get<T>('/auth/me')
    };
  }
}

export function useApiClient(config: ApiClientConfig): ApiClient {
  return useMemo(
    () => new ApiClient(config),
    [config.baseUrl, config.getAccessToken, config.onRefreshTokenExpired]
  );
}
