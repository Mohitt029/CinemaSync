export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roles: string[];
  role?: 'USER' | 'ADMIN';
  createdAt: string;
  emailVerified?: boolean;
  authProvider?: 'LOCAL' | 'GOOGLE';
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}