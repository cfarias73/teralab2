
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, FileText, User, Leaf, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { language, setLanguage, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const isAuthPage = location.pathname === '/auth';

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'en' : 'es');
    setShowLangMenu(false);
  };

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 items-center justify-center">

      {/* Mobile Container Simulation */}
      <div className="w-full h-full max-w-[420px] bg-white shadow-2xl relative overflow-hidden sm:rounded-xl sm:h-[95vh] sm:border sm:border-gray-200">

        {/* Header - Fixed at top */}
        {!isAuthPage && (
          <header className="absolute top-0 left-0 right-0 glass-panel-dark z-30 shadow-sm border-b border-gray-100 rounded-b-2xl">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-2">
                <div className="bg-primary-100 p-1.5 rounded-lg border border-primary-200">
                  <img src="/logo.png" alt="AI SoilCheck Logo" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-xl font-bold tracking-tight text-primary-800">
                  {location.pathname === '/field-editor' ? t('nav.createField') :
                    location.pathname === '/history' ? t('nav.history') :
                      location.pathname === '/map' ? t('nav.map') :
                        location.pathname === '/profile' ? t('nav.profile') : t('nav.myFields')}
                </span>
              </div>

              {/* Language Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center space-x-1 bg-white/50 hover:bg-white px-2 py-1 rounded-lg text-primary-700 transition-all border border-primary-100 shadow-sm"
                >
                  <Globe size={18} />
                  <span className="text-xs font-bold uppercase">{language}</span>
                </button>

                {showLangMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLangMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-24 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={() => { setLanguage('es'); setShowLangMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-primary-50 transition-colors ${language === 'es' ? 'text-primary-600 bg-primary-50/50' : 'text-gray-600'}`}
                      >
                        Español
                      </button>
                      <button
                        onClick={() => { setLanguage('en'); setShowLangMenu(false); }}
                        className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-primary-50 transition-colors ${language === 'en' ? 'text-primary-600 bg-primary-50/50' : 'text-gray-600'}`}
                      >
                        English
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Main Content - Scrollable area between header and nav */}
        <main className={`absolute left-0 right-0 overflow-y-auto scrollbar-hide ${isAuthPage ? 'top-0 bottom-0' : 'top-[68px] bottom-[68px]'}`}>
          <div className="w-full min-h-full flex flex-col relative">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Fixed at bottom */}
        {!isAuthPage && (
          <nav className="absolute bottom-0 left-0 right-0 glass-panel-dark z-30 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.06)] border-t border-gray-100 rounded-t-2xl">
            <div className="flex justify-around items-center h-16 w-full px-2">
              <NavLink
                to="/home"
                className={({ isActive }) => `flex flex-col items-center p-2 transition-all duration-300 ${isActive ? 'text-primary-600 scale-105' : 'text-gray-400 hover:text-primary-400'}`}
              >
                {({ isActive }) => (
                  <>
                    <Home size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] mt-1 font-medium">{t('nav.home')}</span>
                  </>
                )}
              </NavLink>
              <NavLink
                to="/history"
                className={({ isActive }) => `flex flex-col items-center p-2 transition-all duration-300 ${isActive ? 'text-primary-600 scale-105' : 'text-gray-400 hover:text-primary-400'}`}
              >
                {({ isActive }) => (
                  <>
                    <FileText size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] mt-1 font-medium">{t('nav.history')}</span>
                  </>
                )}
              </NavLink>
              <NavLink
                to="/map"
                className={({ isActive }) => `flex flex-col items-center p-2 transition-all duration-300 ${isActive ? 'text-primary-600 scale-105' : 'text-gray-400 hover:text-primary-400'}`}
              >
                {({ isActive }) => (
                  <>
                    <Map size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] mt-1 font-medium">{t('nav.map')}</span>
                  </>
                )}
              </NavLink>
              <NavLink
                to="/profile"
                className={({ isActive }) => `flex flex-col items-center p-2 transition-all duration-300 ${isActive ? 'text-primary-600 scale-105' : 'text-gray-400 hover:text-primary-400'}`}
              >
                {({ isActive }) => (
                  <>
                    <User size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] mt-1 font-medium">{t('nav.profile')}</span>
                  </>
                )}
              </NavLink>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};