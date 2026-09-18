import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, TrendingUp, BarChart3, Shield, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import logoHeader from '../../images/favicon.png';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setFieldErrors([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors([]);
    setIsSubmitting(true);

    try {
      const data = await authService.login(formData);
      login(data.user, data.token);
      const redirectTo =
        location.state?.from?.pathname ||
        (data.user.role === 'ADMIN' ? '/admin' : '/dashboard');
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(message);
      if (Array.isArray(err.response?.data?.errors)) {
        setFieldErrors(err.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-branding">
        <div className="auth-branding-content">
          <div className="auth-logo">
            <img src={logoHeader} alt="FinRise Global" style={{ width: 40, height: 40, borderRadius: 8 }} />
          </div>
          <h1>Grow Your Wealth, Systematically</h1>
          <p>
            Track your investments, monitor ROI in real time, and build your referral
            network — all in one modern platform.
          </p>
          <ul className="auth-features">
            <li>
              <span><BarChart3 size={14} /></span>
              Real-time portfolio &amp; ROI tracking
            </li>
            <li>
              <span><Shield size={14} /></span>
              Secure deposit &amp; withdrawal flow
            </li>
            <li>
              <span><Users size={14} /></span>
              Referral commissions that pay out
            </li>
          </ul>
          <div className="auth-stats">
            <div>
              <div className="auth-stat-value">$2.4M+</div>
              <div className="auth-stat-label">Invested</div>
            </div>
            <div>
              <div className="auth-stat-value">12k+</div>
              <div className="auth-stat-label">Members</div>
            </div>
            <div>
              <div className="auth-stat-value">98%</div>
              <div className="auth-stat-label">Payout rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container animate-slide-up">
          <div className="auth-form-header">
            <h2>Welcome back</h2>
            <p>Log in to access your dashboard</p>
          </div>

          {error && (
            <div className="error-box" style={{ marginBottom: 'var(--space-5)' }}>
              {error}
              {fieldErrors.length > 0 && (
                <ul style={{ margin: '8px 0 0 18px', listStyle: 'disc' }}>
                  {fieldErrors.map((fe) => (
                    <li key={fe.field}>{fe.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Don&apos;t have an account?{' '}
            <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
