import { HomeIcon, LogOut, User } from 'lucide-react'
import React, { useEffect } from 'react'
import LanguageSwitcher from '../LanguageSwitcher'
import { Button } from '../ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useNavigate } from 'react-router-dom'

const Header = () => {
     const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = t('homePageTitle');
  }, [t]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <div><header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <HomeIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                  <h1 className="text-xl font-semibold text-gray-900">{t('dashboard')}</h1>
                </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.name} {user?.surname}
                </span>
              </div>
              
              <LanguageSwitcher />
              
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('logout')}</span>
              </Button>
            </div>
          </div>
        </div>
      </header></div>
  )
}

export default Header