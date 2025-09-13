import React from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSocket } from '../contexts/SocketContext';
import LanguageSwitcher from './LanguageSwitcher';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const Header = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { isConnected } = useSocket();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200 px-4 py-5">
      <div className="flex items-center justify-between">
        {/* Left side - Logo and Menu */}
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-md transition-all duration-300 hover:scale-105"
          >
            {sidebarOpen ? (
              <X className="h-5 w-5 text-gray-600 transition-transform duration-300 rotate-90" />
            ) : (
              <Menu className="h-5 w-5 text-gray-600 transition-transform duration-300 rotate-0" />
            )}
          </Button>
          
          <div className="flex items-center space-x-2">
           <Link to="/home"> <img src="/brendoo_logo.svg" alt="Logo" className="h-10 w-auto" /></Link>
           
          </div>
        </div>

        {/* Right side - Language Switcher and User Menu */}
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          
          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="w-8 h-8 bg-[#0B4F88] rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className={`absolute -top-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  {user?.name || user?.username || t('user')}
                </span>
                <span className={`text-xs ${
                  isConnected ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-600 hover:text-red-600"
              title={t('logout')}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;