
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Camera, Map, FileText, User, Leaf } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-100 items-center justify-center">
      
      {/* Mobile Container Simulation */}
      <div className="w-full h-full max-w-[380px] bg-white shadow-2xl flex flex-col relative overflow-hidden sm:rounded-xl sm:h-[95vh] sm:border sm:border-gray-200">
        
        {/* Header - Glass Effect (Hide on Auth) */}
        {!isAuthPage && (
            <header className="flex-none glass-panel-dark z-30 relative">
            <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-2">
                <div className="bg-primary-100 p-1.5 rounded-lg border border-primary-200">
                    {/* Reemplazado Leaf por la imagen del logo */}
                    <img src="/logo.png" alt="AI SoilCheck Logo" className="w-5 h-5 object-contain" />
                </div>
                <span className="text-xl font-bold tracking-tight text-primary-800">AI SoilCheck</span>
                </div>
                <div className="px-2 py-1 rounded-md bg-primary-50 border border-primary-100 text-[10px] font-bold text-primary-600 tracking-wider">
                BETA
                </div>
            </div>
            </header>
        )}

        {/* Main Content */}
        <main className="flex-grow overflow-y-auto safe-pb flex flex-col relative z-0 scrollbar-hide">
          <div className="w-full h-full flex flex-col relative">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Navigation - Glass Effect (Hide on Auth) */}
        {!isAuthPage && (
            <nav className="flex-none glass-panel-dark z-30 pb-safe">
            <div className="flex justify-around items-center h-16 w-full px-2">
                <NavLink 
                to="/" 
                className={({ isActive }) => `flex flex-col items-center p-2 transition-all duration-300 ${isActive ? 'text-primary-600 scale-105' : 'text-gray-400 hover:text-primary-400'}`}
                >
                {({ isActive }) => (
                    <>
                    <Camera size={24} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] mt-1 font-medium">Capturar</span>
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
                    <span className="text-[10px] mt-1 font-medium">Historial</span>
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
                    <span className="text-[10px] mt-1 font-medium">Mapa</span>
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
                    <span className="text-[10px] mt-1 font-medium">Perfil</span>
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