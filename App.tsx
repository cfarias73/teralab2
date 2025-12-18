
import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
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
import { Landing } from './views/Landing';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // While loading, parent handles splash - just return null
  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// App content with Layout wrapper (for authenticated app views)
function AppContent() {
  const { loading } = useAuth();

  // Show splash while auth is loading - simple and clean
  if (loading) {
    return <SplashScreen message="Iniciando..." />;
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

      {/* Public routes - No auth required */}
      <Route path="/home" element={<Home />} />
      <Route path="/field-editor" element={<FieldEditor />} />

      {/* Protected routes - Auth required */}
      <Route path="/field/:parcelId" element={<ProtectedRoute><FieldOverview /></ProtectedRoute>} />
      <Route path="/campaign/:id" element={<ProtectedRoute><Campaign /></ProtectedRoute>} />
      <Route path="/field-results/:id" element={<ProtectedRoute><FieldResults /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/map" element={<ProtectedRoute><SoilMap /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/home" />} />
    </Routes>
  );
}

// Main router with landing page
function MainRoutes() {
  const location = useLocation();

  // Landing page at root - no Layout wrapper
  if (location.pathname === '/') {
    return <Landing />;
  }

  // Everything else goes through AppContent with Layout
  return <AppContent />;
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/*" element={<AppContent />} />
          </Routes>
          <Analytics />
        </HashRouter>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;