import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { getDashboardPath } from '../config/roles';

const AuthContext = createContext(null);

function readStoredSession() {
  const token = window.localStorage.getItem('caip.token');
  const storedUser = window.localStorage.getItem('caip.user');
  return {
    token: token ?? '',
    user: storedUser ? JSON.parse(storedUser) : null,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const [isLoading, setIsLoading] = useState(Boolean(readStoredSession().token));

  useEffect(() => {
    if (!session.token) {
      setIsLoading(false);
      return;
    }

    let ignore = false;

    api
      .get('/me')
      .then(({ data }) => {
        if (!ignore) {
          window.localStorage.setItem('caip.user', JSON.stringify(data.user));
          setSession((current) => ({ ...current, user: data.user }));
        }
      })
      .catch(() => {
        if (!ignore) {
          window.localStorage.removeItem('caip.token');
          window.localStorage.removeItem('caip.user');
          setSession({ token: '', user: null });
        }
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [session.token]);

  const persistSession = (payload) => {
    window.localStorage.setItem('caip.token', payload.access_token);
    window.localStorage.setItem('caip.user', JSON.stringify(payload.user));
    setSession({
      token: payload.access_token,
      user: payload.user,
    });
  };

  const login = async (credentials) => {
    const { data } = await api.post('/login', credentials);
    persistSession(data);
    return data.user;
  };

  const register = async (payload) => {
    const { data } = await api.post('/register', payload);
    persistSession(data);
    return data.user;
  };

  const logout = () => {
    window.localStorage.removeItem('caip.token');
    window.localStorage.removeItem('caip.user');
    setSession({ token: '', user: null });
  };

  return (
    <AuthContext.Provider
      value={{
        user: session.user,
        token: session.token,
        role: session.user?.role ?? '',
        isAuthenticated: Boolean(session.token && session.user),
        isLoading,
        dashboardPath: getDashboardPath(session.user?.role),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
