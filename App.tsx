
import React from 'react';
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

// Simple wrapper that shows splash while auth is loading
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
      <Route path="/" element={<Home />} />
      <Route path="/field-editor" element={<FieldEditor />} />

      {/* Protected routes - Auth required */}
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