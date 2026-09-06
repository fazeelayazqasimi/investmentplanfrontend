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

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (location.pathname === '/login' || location.pathname === '/register') {
        navigate(user.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
      }
      if (user.role === 'ADMIN' && (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/'))) {
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoading, user, location.pathname, navigate]);

  if (isLoading) return null;

  if (user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={<UserDashboard />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/admin/*" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
