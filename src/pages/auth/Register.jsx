import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import logoHeader from '../../images/favicon.png';

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1); // 1 = email, 2 = OTP, 3 = details
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    referralCode: searchParams.get('ref') || '',
  });
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [emailVerifyToken, setEmailVerifyToken] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
    setFieldErrors([]);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    clearMessages();
  };

  // ---- Step 1: send OTP to email ----
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);
    try {
      await authService.sendRegisterOtp(email);
      setStep(2);
      setCooldown(60);
      setSuccess('Verification code sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code');
      if (Array.isArray(err.response?.data?.errors)) {
        setFieldErrors(err.response.data.errors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- Step 2: verify 4-digit code ----
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    clearMessages();

    const otp = code.join('');
    if (otp.length !== 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await authService.verifyEmail(email, otp);
      setEmailVerifyToken(data.emailVerifyToken);
      setFormData((prev) => ({ ...prev, email }));
      setStep(3);
      setSuccess('Email verified! Complete your profile.');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid verification code');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    clearMessages();
    try {
      await authService.resendOtp(email, 'EMAIL_VERIFICATION');
      setSuccess('New verification code sent to your email');
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  const handleChangeEmail = () => {
    clearMessages();
    setCode(['', '', '', '']);
    setEmailVerifyToken('');
    setStep(1);
  };

  // ---- Step 3: create account ----
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsSubmitting(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const data = await authService.register({
        name: formData.name, email, phone: formData.phone,
        password: formData.password, confirmPassword: formData.confirmPassword,
        referralCode: formData.referralCode,
        emailVerifyToken,
      });
      login(data.user, data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(message);
      if (Array.isArray(err.response?.data?.errors)) {
        setFieldErrors(err.response.data.errors);
      }
      // Token expired/invalid → back to step 2
      if (err.response?.status === 400 && /verif/i.test(message)) {
        setStep(2);
        setCode(['', '', '', '']);
        setEmailVerifyToken('');
        setCooldown(60);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleIcon = (show, toggleFn) => (
    <button
      type="button"
      className="password-toggle"
      onClick={() => toggleFn((prev) => !prev)}
      tabIndex={-1}
      aria-label={show ? 'Hide' : 'Show'}
    >
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );

  const stepTitles = {
    1: { h: 'Create account', p: 'Enter your email to get started' },
    2: { h: 'Verify your email', p: 'Code sent to' },
    3: { h: 'Complete your profile', p: 'Almost done — tell us about yourself' },
  };

  return (
    <div className="auth-page">
      <div className="auth-branding">
        <div className="auth-branding-content">
          <div className="auth-logo">
            <img src={logoHeader} alt="FinRise Global" style={{ width: 40, height: 40, borderRadius: 8 }} />
          </div>
          <h1>Start Investing Today</h1>
          <p>
            Create your account and begin building wealth with our
            transparent, data-driven investment platform.
          </p>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
            {['Email', 'Verify', 'Details'].map((label, i) => {
              const n = i + 1;
              const active = step === n;
              const done = step > n;
              return (
                <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    height: 4, borderRadius: 2,
                    background: done ? 'var(--color-primary)' : active ? '#fff' : 'rgba(255,255,255,0.25)',
                    marginBottom: 6,
                  }} />
                  <span style={{
                    fontSize: 12, fontWeight: active || done ? 600 : 400,
                    color: active || done ? '#fff' : 'rgba(255,255,255,0.6)',
                  }}>{n}. {label}</span>
                </div>
              );
            })}
          </div>

          <ul className="auth-features" style={{ marginTop: 24 }}>
            <li><span>✓</span>Email verification keeps your account secure</li>
            <li><span>✓</span>Code expires in 1 minute</li>
            <li><span>✓</span>Resend available every 60 seconds</li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container animate-slide-up">
          <div className="auth-form-header">
            <h2>{stepTitles[step].h}</h2>
            <p>
              {step === 2 ? (
                <>Code sent to <strong>{email}</strong></>
              ) : (
                stepTitles[step].p
              )}
            </p>
          </div>

          {error && (
            <div className="error-box" style={{ marginBottom: 'var(--space-5)' }}>
              {error}
              {fieldErrors.length > 0 && (
                <ul style={{ margin: '8px 0 0 18px', listStyle: 'disc' }}>
                  {fieldErrors.map((fe) => <li key={fe.field}>{fe.message}</li>)}
                </ul>
              )}
            </div>
          )}
          {success && (
            <div className="success-box" style={{ marginBottom: 'var(--space-5)' }}>{success}</div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" placeholder="you@example.com"
                  value={email} onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
                  required autoComplete="email" />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyCode}>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 'var(--space-4)' }}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={inputRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={isSubmitting}
                    style={{
                      width: 56, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 'bold',
                      border: '2px solid var(--color-border)', borderRadius: 12,
                      background: 'var(--color-surface)', color: 'var(--color-text)',
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                  />
                ))}
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isSubmitting}>
                {isSubmitting ? 'Verifying...' : 'Verify Code'}
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-4)' }}>
                <button type="button" onClick={handleChangeEmail}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <ArrowLeft size={14} /> Change email
                </button>
                {cooldown > 0 ? (
                  <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Resend in {cooldown}s</span>
                ) : (
                  <button type="button" onClick={handleResend}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 13, fontWeight: 500 }}>
                    Resend Code
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input type="text" name="name" className="form-input" placeholder="John Doe"
                  value={formData.name} onChange={handleChange} required autoComplete="name" />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={email} disabled />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input type="tel" name="phone" className="form-input" placeholder="+1 234 567 8900"
                  value={formData.phone} onChange={handleChange} required autoComplete="tel" />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="password-field">
                  <input type={showPassword ? 'text' : 'password'} name="password" className="form-input"
                    placeholder="At least 8 characters" value={formData.password} onChange={handleChange}
                    required minLength={8} autoComplete="new-password" />
                  {toggleIcon(showPassword, setShowPassword)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div className="password-field">
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" className="form-input"
                    placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleChange}
                    required minLength={8} autoComplete="new-password" />
                  {toggleIcon(showConfirmPassword, setShowConfirmPassword)}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Referral Code <span className="text-muted">(Optional)</span></label>
                <input type="text" name="referralCode" className="form-input" placeholder="e.g. FZL82K9"
                  value={formData.referralCode} onChange={handleChange} autoComplete="off" />
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block"
                disabled={isSubmitting}>
                {isSubmitting ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 'var(--font-weight-medium)' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
