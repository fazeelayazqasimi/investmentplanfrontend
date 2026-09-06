import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, TrendingUp, User, Phone, BarChart3, Shield, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const data = await authService.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        referralCode: formData.referralCode,
      });
      login(data.user, data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || 'Registration failed. Please try again.';
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
          <h1>Start Investing Today</h1>
          <p>
            Create your account and begin building wealth with our
            transparent, data-driven investment platform.
          </p>
          <ul className="auth-features">
            <li>
              <span><BarChart3 size={14} /></span>
              Automated ROI distribution
            </li>
            <li>
              <span><Shield size={14} /></span>
              Bank-grade security for your funds
            </li>
            <li>
              <span><Users size={14} /></span>
              Earn commissions through referrals
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
          <h2>Create account</h2>
          <p className="subtitle">
            Join the investment platform
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
              <label className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

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
              <label className="form-label">Phone Number</label>
              <div className="input-with-icon">
                <Phone size={18} className="input-icon" />
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  placeholder="+1 234 567 8900"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
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
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
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

            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-input"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="input-icon-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Referral Code <span className="text-muted">(Optional)</span></label>
              <div className="input-with-icon">
                <Users size={18} className="input-icon" />
                <input
                  type="text"
                  name="referralCode"
                  className="form-input"
                  placeholder="e.g. FZL82K9"
                  value={formData.referralCode}
                  onChange={handleChange}
                  autoComplete="off"
                />
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
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
