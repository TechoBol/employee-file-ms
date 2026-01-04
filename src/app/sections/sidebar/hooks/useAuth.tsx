import { useConfigStore } from '@/app/shared/stores/useConfigStore';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';

const LOGIN_URL = import.meta.env.VITE_TECHOBOL_ERP_URL ?? 'https://techobol.erp.techocorp.tech/from-efms';

export const useAuth = () => {
  const { userId, userName, setUserData, clearUserData } = useConfigStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userIdParam = params.get('userId');
    const userNameParam = params.get('userName');

    if (userIdParam && userNameParam) {
      setUserData(userIdParam, userNameParam);
      navigate(location.pathname, { replace: true });
    }
  }, [location, navigate, setUserData]);

  const login = () => {
    window.location.href = LOGIN_URL;
  };

  const logout = () => {
    clearUserData();
  };

  return {
    user: userId && userName ? { userId, userName } : null,
    isAuthenticated: Boolean(userId && userName),
    login,
    logout,
  };
};