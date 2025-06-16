import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Constants for localStorage keys
const TOKEN_KEY = 'auth_token';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to set auth token and expiry
  const setAuthToken = (newToken: string, expiresIn: number = 24 * 60 * 60 * 1000) => {
    const expiryTime = new Date().getTime() + expiresIn;
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
    setToken(newToken);
    axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  };

  // Helper function to clear auth token
  const clearAuthToken = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // Check if token is expired
  const isTokenExpired = () => {
    const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryTime) return true;
    return new Date().getTime() > parseInt(expiryTime);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        
        if (storedToken && !isTokenExpired()) {
          setToken(storedToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          await validateToken();
        } else {
          clearAuthToken();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthToken();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const validateToken = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        clearAuthToken();
        setUser(null);
        setIsAuthenticated(false);
      }
      throw error;
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password,
      });

      const { token: newToken, user, expiresIn } = response.data;
      setAuthToken(newToken, expiresIn);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Login failed');
      }
      throw new Error('Login failed');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password,
      });

      const { token: newToken, user, expiresIn } = response.data;
      setAuthToken(newToken, expiresIn);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Registration failed');
      }
      throw new Error('Registration failed');
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Add axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Try to refresh the token
            const response = await axios.post('/api/auth/refresh-token');
            const { token: newToken, expiresIn } = response.data;
            
            setAuthToken(newToken, expiresIn);
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            // Retry the original request
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh fails, logout
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const value = {
    user,
    isAuthenticated,
    token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 