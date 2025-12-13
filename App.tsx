

import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { Home } from './views/Home';
import { Results } from './views/Results';
import { History } from './views/History';
import { SoilMap } from './views/Map';
import { FieldEditor } from './views/FieldEditor';
import { Campaign } from './views/Campaign';
import { FieldResults } from './views/FieldResults';
import { Profile } from './views/Profile';
import { Auth } from './views/Auth';
import { FieldOverview } from './views/FieldOverview';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const SPLASH_MIN_DURATION = 4000; // 4 seconds minimum

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null; // Splash is handled at App level
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, SPLASH_MIN_DURATION);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Hide splash only when both auth is done AND minimum time has elapsed
    if (!authLoading && minTimeElapsed) {
      setShowSplash(false);
    }
  }, [authLoading, minTimeElapsed]);

  if (showSplash) {
    return <SplashScreen message={authLoading ? "Verificando sesión..." : "Preparando app..."} />;
  }

  return (
    <Layout>
      <AppRoutes />
    </Layout>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />

      <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      <Route path="/field-editor" element={<ProtectedRoute><FieldEditor /></ProtectedRoute>} />
      <Route path="/field/:parcelId" element={<ProtectedRoute><FieldOverview /></ProtectedRoute>} />
      <Route path="/campaign/:id" element={<ProtectedRoute><Campaign /></ProtectedRoute>} />
      <Route path="/field-results/:id" element={<ProtectedRoute><FieldResults /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><SoilMap /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;