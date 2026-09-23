import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '../../services/authService';
import logoHeader from '../../images/favicon.png';

function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter OTP + new password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setSuccess('Verification code sent to your email');
      setStep(2);
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send code');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otp = code.join('');
    if (otp.length !== 4) {
      setError('Please enter the complete 4-digit code');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.resetPassword(email, otp, newPassword);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      await authService.resendOtp(email, 'PASSWORD_RESET');
      setSuccess('New verification code sent to your email');
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-branding">
        <div className="auth-branding-content">
          <div className="auth-logo">
            <img src={logoHeader} alt="FinRise Global" style={{ width: 40, height: 40, borderRadius: 8 }} />
          </div>
          <h1>Reset Your Password</h1>
          <p>Enter your email address and we&apos;ll send you a verification code to reset your password.</p>
          <ul className="auth-features">
            <li><span><CheckCircle size={14} /></span>Secure password reset</li>
            <li><span><Lock size={14} /></span>Code expires in 1 minute</li>
          </ul>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form-container animate-slide-up">
          {step === 1 ? (
            <>
              <div className="auth-form-header">
                <h2>Forgot password</h2>
                <p>Enter your email to receive a reset code</p>
              </div>

              {error && <div className="error-box" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}
              {success && <div className="success-box" style={{ marginBottom: 'var(--space-5)' }}>{success}</div>}

              <form onSubmit={handleSendOtp}>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" placeholder="you@example.com"
                    value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} required />
                </div>
                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="auth-form-header">
                <h2>Enter verification code</h2>
                <p>Code sent to <strong>{email}</strong></p>
              </div>

              {error && <div className="error-box" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}
              {success && <div className="success-box" style={{ marginBottom: 'var(--space-5)' }}>{success}</div>}

              <form onSubmit={handleResetPassword}>
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

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div className="password-field">
                    <input type={showPassword ? 'text' : 'password'} className="form-input"
                      placeholder="At least 8 characters" value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      required minLength={8} />
                    <button type="button" className="password-toggle"
                      onClick={() => setShowPassword((p) => !p)} tabIndex={-1}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input type={showPassword ? 'text' : 'password'} className="form-input"
                    placeholder="Re-enter your password" value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                    required minLength={8} />
                </div>

                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={isSubmitting}>
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
                {cooldown > 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Resend code in {cooldown}s</p>
                ) : (
                  <button onClick={handleResend}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontSize: 13, fontWeight: 500 }}>
                    Resend Code
                  </button>
                )}
              </div>
            </>
          )}

          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
            <Link to="/login" style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
