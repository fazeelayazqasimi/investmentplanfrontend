import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { AdminRoute, ProtectedRoute } from './routes/ProtectedRoute';
import './styles/global.css';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Wait for auth to finish loading, then redirect based on role
  useEffect(() => {
    if (!isLoading && !user) {
      // No user logged in, stay on login page
      return;
    }
    if (!isLoading && user && user.role !== 'ADMIN') {
      // Regular user - redirect to dashboard if on auth pages
      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate('/dashboard', { replace: true });
      }
    }
    if (!isLoading && user && user.role === 'ADMIN') {
      // Admin - redirect to admin dashboard if on regular auth pages
      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate('/admin/dashboard', { replace: true });
      }
      // Admin should never land on the user dashboard
      if (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/')) {
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoading, user, location.pathname, navigate]);

  if (isLoading) {
    return null; // Show nothing while loading
  }

  return (
    <>
      {user ? (
        // User is authenticated - show protected routes
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
           
          {/* User dashboard - protected, non-admin */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard/*" element={<UserDashboard />} />
          </Route>

          {/* Admin dashboard - admin only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
        </Routes>
      ) : (
        // No user - show auth pages only
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </>
  );
}

export default App;