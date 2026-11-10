import { createContext, useContext, useEffect, useState } from 'react';
import { http } from '../../api/http.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = window.localStorage.getItem('iem_cached_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Rehydrate authenticated user session on mount
  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      try {
        const data = await http.get('/auth/me');
        if (mounted && data?.user) {
          setUser(data.user);
          window.localStorage.setItem('iem_cached_user', JSON.stringify(data.user));
        }
      } catch (error) {
        if (mounted && (error?.statusCode === 401 || error?.code === 'UNAUTHORIZED')) {
          setUser(null);
          window.localStorage.removeItem('iem_cached_user');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadCurrentUser();
    return () => {
      mounted = false;
    };
  }, []);

  const register = async (payload) => {
    const res = await http.post('/auth/register', payload);
    return res;
  };

  const login = async ({ identifier, password }) => {
    const res = await http.post('/auth/login', { identifier, password });
    if (res?.user) {
      setUser(res.user);
      window.localStorage.setItem('iem_cached_user', JSON.stringify(res.user));
    }
    return res;
  };

  const logout = async () => {
    try {
      await http.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      window.localStorage.removeItem('iem_cached_user');
    }
  };

  const forgotPassword = async ({ email }) => {
    return http.post('/auth/forgot-password', { email });
  };

  const resetPassword = async ({ email, otp, newPassword }) => {
    const res = await http.post('/auth/reset-password', { email, otp, newPassword });
    setUser(null);
    window.localStorage.removeItem('iem_cached_user');
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        loading,
        register,
        login,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
