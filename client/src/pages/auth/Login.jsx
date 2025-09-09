import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { Link, useNavigate } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, User, Lock, LogIn } from "lucide-react";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  
  // Sayfa başlığını güncelle
  usePageTitle('login');

  // Dil değiştiğinde hata mesajını temizle
  useEffect(() => {
    if (error) {
      setError("");
    }
  }, [currentLanguage]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError(t('fillAllFields'));
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);

      if (result.success) {
        // Wait a bit for AuthContext state to update
        setTimeout(() => {
          navigate('/');
        }, 100);
      } else {
        setError(t('invalidCredentials'));
      }

    setIsLoading(false);
  };



  return (
    <div className="flex">
      <div className="">
        <img src="./abstract.png" alt="" className="w-[1026px] h-[100vh]" />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center justify-center max-w-md w-full mr-16 gap-10">
          <div className="absolute top-4 right-4">
            <LanguageSwitcher />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div>
              <img src="/brendoo_logo.svg" alt="" className="w-75" />
            </div>
            <div>{t('loginToAccount')}</div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block  pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors w-125"
                  placeholder="Email adresinizi girin"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                  placeholder={t('enterPassword')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
          
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0B4F88] hover:bg-white border-1 hover:border-1 hover:border-[#0B4F88] text-white hover:text-[#0B4F88]  font-medium py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer "
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {t('loggingIn')}
                </div>
              ) : (
                <>
                  <LogIn className="w-5 h-5 mr-2" />
                  {t('login')}
                </>
              )}
            </Button>
          </form>
          <Link to="/forgot-password" className="text-[#0B4F88] underline font-light">Şifrənizi unutmusunuz?</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
