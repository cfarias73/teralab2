

import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './views/Home';
import { Results } from './views/Results';
import { History } from './views/History';
import { SoilMap } from './views/Map';
import { FieldEditor } from './views/FieldEditor';
import { Campaign } from './views/Campaign';
import { FieldResults } from './views/FieldResults';
import { Profile } from './views/Profile';
import { Auth } from './views/Auth';
import { FieldOverview } from './views/FieldOverview'; // Import new FieldOverview
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
        <div className="flex h-screen items-center justify-center bg-gray-50">
            <Loader2 className="animate-spin text-primary-600" size={32} />
        </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/auth" element={<Auth />} />
            
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/field-editor" element={<ProtectedRoute><FieldEditor /></ProtectedRoute>} />
            <Route path="/field/:parcelId" element={<ProtectedRoute><FieldOverview /></ProtectedRoute>} /> {/* NEW ROUTE */}
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
            <Layout>
                <AppRoutes />
            </Layout>
        </HashRouter>
    </AuthProvider>
  );
}

export default App;