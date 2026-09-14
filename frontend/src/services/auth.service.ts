import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  ApiError,
  User,
} from '../types/auth.types';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8081/api';

class AuthService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('userId');
        }
        return Promise.reject(error);
      }
    );
  }

  /** Normalize so UI can rely on `user.role` existing regardless of backend shape */
  private normalizeUser(user: any): User {
    if (!user) return user;
    const roles: string[] = user.roles || (user.role ? [user.role] : ['USER']);
    return {
      ...user,
      roles,
      role: (user.role as any) || (roles[0] as any) || 'USER',
    };
  }

  private storeSession(data: AuthResponse) {
    const user = this.normalizeUser(data.user);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    if (user?.id) localStorage.setItem('userId', user.id);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', credentials);
    this.storeSession(response.data);
    return { ...response.data, user: this.normalizeUser(response.data.user) };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { confirmPassword, ...registerData } = data;
    const response = await this.api.post<AuthResponse>('/auth/register', registerData);
    this.storeSession(response.data);
    return { ...response.data, user: this.normalizeUser(response.data.user) };
  }

  async loginWithGoogle(idToken: string): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/google', { idToken });
    this.storeSession(response.data);
    return { ...response.data, user: this.normalizeUser(response.data.user) };
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await this.api.post<{ token: string }>('/auth/refresh', { refreshToken });
    localStorage.setItem('authToken', response.data.token);
    return response.data.token;
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await this.api.post<{ message: string }>(
      '/auth/forgot-password',
      { email }
    );
    return data;
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const { data } = await this.api.post<{ message: string }>(
      '/auth/reset-password',
      { token, newPassword }
    );
    return data;
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return this.normalizeUser(JSON.parse(userStr));
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('authToken');
  }
}

export default new AuthService();