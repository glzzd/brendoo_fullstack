import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Private Route - Sadece giriş yapmış kullanıcılar erişebilir
export const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading durumunda spinner göster
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Giriş yapmamışsa login sayfasına yönlendir
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  // Giriş yapmışsa içeriği göster
  return children;
};

// Public Route - Sadece giriş yapmamış kullanıcılar erişebilir (login sayfası için)
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Loading durumunda spinner göster
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Giriş yapmışsa home sayfasına yönlendir
  if (isAuthenticated()) {
    return <Navigate to="/home" replace />;
  }

  // Giriş yapmamışsa içeriği göster
  return children;
};