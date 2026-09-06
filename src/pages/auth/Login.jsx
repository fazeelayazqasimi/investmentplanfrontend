import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, TrendingUp, BarChart3, Shield, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

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
      const message =
        err.response?.data?.message || 'Login failed. Please check your credentials.';
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
            <TrendingUp size={26} />
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
          <div className="auth-branding-stats">
            <div>
              <div className="num">$2.4M+</div>
              <div className="lbl">Invested</div>
            </div>
            <div>
              <div className="num">12k+</div>
              <div className="lbl">Members</div>
            </div>
            <div>
              <div className="num">98%</div>
              <div className="lbl">Payout rate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-wrapper fade-in">
          <h2>Welcome back</h2>
          <p className="subtitle">
            Log in to access your dashboard
          </p>

          {error && (
            <div className="auth-error">
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
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
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
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
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
                  className="input-icon-toggle"
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
              className="btn btn-primary btn-block btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
