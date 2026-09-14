import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  login,
  register,
  logout,
  clearError,
  loginWithGoogle,
} from '../store/slices/auth.slice';
import { LoginCredentials, RegisterData } from '../types/auth.types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  return {
    user,
    token,
    isLoading,
    error,
    login: (c: LoginCredentials) => dispatch(login(c)).unwrap(),
    register: (d: RegisterData) => dispatch(register(d)).unwrap(),
    loginWithGoogle: (idToken: string) =>
      dispatch(loginWithGoogle(idToken)).unwrap(),
    logout: () => dispatch(logout()),
    clearError: () => dispatch(clearError()),
    isAuthenticated: !!token && !!user,
  };
};