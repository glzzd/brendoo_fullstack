import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Github, Twitter, Linkedin, Mail, X, ChevronDown, ChevronRight } from 'lucide-react';
import { useMenuItems } from '@/const/menuItems';

const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const items = useMenuItems();
  const location = useLocation();

  // Sadece KULLANICI’nın elle açtıklarını tutuyoruz
  const [manualExpanded, setManualExpanded] = useState({});

  // Bir item şu anki route’un ebeveyniyse true
  const isParentOfCurrentRoute = (item) =>
    Array.isArray(item.subItems) &&
    item.subItems.some((s) => location.pathname.startsWith(s.path));

  // Ana item aktif mi? (ya kendisi aktif ya da altından biri aktif)
  const isItemActive = (item) => {
    if (item.subItems) return isParentOfCurrentRoute(item);
    return location.pathname.startsWith(item.path);
  };

  // Alt item aktif mi?
  const isSubItemActive = (subPath) => location.pathname.startsWith(subPath);

  // Tek-açık: sadece tıklananı açık bırak
  const toggleExpanded = (itemPath) => {
    setManualExpanded((prev) => {
      const isOpen = !!prev[itemPath];
      if (isOpen) {
        // kapat
        const { [itemPath]: _, ...rest } = prev;
        return rest;
      }
      // tümünü kapatıp sadece bunu aç
      return { [itemPath]: true };
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed top-16 left-0 z-50 w-64 bg-white shadow-lg transform transition-all duration-300 ease-in-out flex flex-col',
          isOpen ? 'translate-x-0 opacity-100 scale-100' : '-translate-x-full opacity-0 scale-95',
          'lg:translate-x-0 lg:static lg:z-auto lg:top-0 lg:opacity-100 lg:scale-100',
          isOpen ? 'lg:block' : 'lg:hidden',
          'hover:shadow-xl',
        ].join(' ')}
      >
        {/* Sidebar Header (mobile) */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 lg:hidden">
          <div className="flex items-center space-x-2">
            <img src="/brendoo_logo.svg" alt="Logo" className="h-8 w-auto" />
            <span className="text-lg font-semibold text-gray-800">
              {t('appName') || 'Dashboard'}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <X className="h-5 w-5 text-gray-600" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('navigation') || 'Navigasyon'}
            </h3>

            {items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);

              // Kritik nokta: expanded = manuel açık || route şu an onun altında
              const expanded = manualExpanded[item.path] || isParentOfCurrentRoute(item);

              return (
                <div key={item.path} className="mb-2">
                  {item.subItems ? (
                    <button
                      onClick={() => toggleExpanded(item.path)}
                      className={[
                        'group flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out transform relative',
                        active || expanded
                          ? 'bg-[#0B4F88] text-white shadow-md scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm hover:scale-102',
                      ].join(' ')}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {active && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
                        {expanded ? (
                          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform duration-200" />
                        )}
                      </div>
                    </button>
                  ) : (
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={[
                        'group flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out transform',
                        active
                          ? 'bg-[#0B4F88] text-white shadow-md scale-105'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105 hover:shadow-sm hover:translate-x-1',
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                      <span>{item.label}</span>
                    </Link>
                  )}

                  {item.subItems && (
                    <div
                      className={[
                        'overflow-hidden transition-all duration-300 ease-in-out',
                        expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                      ].join(' ')}
                    >
                      <div className="ml-4 mt-2 space-y-1 relative">
                        <div className="absolute left-2 top-0 bottom-0 w-px bg-gradient-to-b from-gray-300 to-transparent"></div>

                        {item.subItems.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const subActive = isSubItemActive(subItem.path);

                          return (
                            <div key={subItem.path} className="relative">
                              <div className="absolute left-2 top-1/2 w-3 h-px bg-gray-300"></div>

                              <Link
                                to={subItem.path}
                                onClick={() => {
                                  if (window.innerWidth < 1024) onClose();
                                }}
                                className={[
                                  'group flex items-center space-x-3 px-3 py-2 ml-4 rounded-md text-sm transition-all duration-200 ease-in-out transform relative',
                                  subActive
                                    ? 'bg-[#0B4F88]/15 text-[#0B4F88] font-medium shadow-sm border-l-[3px] border-[#0B4F88] scale-105'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1 hover:shadow-sm',
                                ].join(' ')}
                              >
                                <SubIcon className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                                <span>{subItem.label}</span>

                                {subActive && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0B4F88] rounded-full animate-pulse"></div>
                                )}
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
