import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { StoreProvider } from './contexts/StoreContext';
import { PrivateRoute, PublicRoute } from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import Login from './pages/auth/Login';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/auth/ForgotPassword';
import StoreList from './pages/stores/StoreList';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <StoreProvider>
          <Router>
          <div className="App">
            <Routes>

              <Route path="/" element={<Navigate to="/home" replace />} />
                <Route 
                path="/forgot-password" 
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              
              <Route 
                path="/home" 
                element={
                  <PrivateRoute>
                    <MainLayout key="home">
                      <Home />
                    </MainLayout>
                  </PrivateRoute>
                } 
              />
              

              
              <Route 
                path="/stores/list" 
                element={
                  <PrivateRoute>
                    <MainLayout key="stores-list">
                      <StoreList />
                    </MainLayout>
                  </PrivateRoute>
                } 
              />
            
               <Route 
                  path="*" 
                  element={<NotFound />}
                />
            </Routes>
          </div>
          </Router>
        </StoreProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
