import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated and token is valid
        if (authService.isAuthenticated() && !authService.isTokenExpired()) {
          const savedUser = authService.getUser();
          
          if (savedUser) {
            // If we have a saved user, set it immediately
            setUser(savedUser);
            
            // Then verify token with server in background
            try {
              const response = await authService.getCurrentUser();
              
              if (response.success && response.user) {
                // Update user with fresh data from server
                setUser(response.user);
              } else {
                // Token is invalid, clear auth data
                await authService.logout();
                setUser(null);
              }
            } catch (error) {
              console.error('Token verification failed:', error);
              await authService.logout();
              setUser(null);
            }
          } else {
            await authService.logout();
          }
        } else {
          // Token expired or not found, clear auth data
          await authService.logout();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authService.login(email, password);
      
      if (response.success && response.user) {
        setUser(response.user);
        return { success: true, user: response.user };
      } else {
        return { success: false, message: response.message || 'Giriş başarısız!' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message || 'Giriş sırasında bir hata oluştu!' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    token: authService.getToken(),
    login,
    logout,
    isAuthenticated,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};