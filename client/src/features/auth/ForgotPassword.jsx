import { useState, useEffect } from 'react';
import { ArrowLeft, LockKey, EnvelopeSimple, CheckCircle, Warning, Check } from '@phosphor-icons/react';
import { useAuth } from './AuthContext.jsx';

const RESET_EXPIRY_SECONDS = 900; // 15 minutes per spec

function PasswordRules({ password }) {
  const rules = [
    { key: 'length', label: 'At least 8 characters', ok: password.length >= 8 },
    { key: 'upper', label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { key: 'number', label: 'One number', ok: /[0-9]/.test(password) },
    { key: 'special', label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <ul className="pw-rules">
      {rules.map((rule) => (
        <li className={rule.ok ? 'is-ok' : ''} key={rule.key}>
          <Check size={13} weight="bold" /> {rule.label}
        </li>
      ))}
    </ul>
  );
}

function OtpInputs({ digits, onChange }) {
  const updateDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    onChange(updated);
    if (digit && index < digits.length - 1) {
      document.getElementById(`reset-otp-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="otp-inputs">
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`reset-otp-${index}`}
          aria-label={`Reset code digit ${index + 1}`}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => updateDigit(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
              document.getElementById(`reset-otp-${index - 1}`)?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}

export function ForgotPassword({ onNavigate }) {
  const { forgotPassword, resetPassword } = useAuth();
  const [stage, setStage] = useState('request'); // 'request' | 'verify' | 'done'
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(RESET_EXPIRY_SECONDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stage !== 'verify') return;
    const timer = window.setInterval(() => {
      setSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  const formattedTimer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const passwordReady =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPassword({ email: email.trim().toLowerCase() });
      setStage('verify');
      setSeconds(RESET_EXPIRY_SECONDS);
      if (res?.otpCode) {
        setDigits(res.otpCode.split(''));
      }
    } catch (err) {
      setError(err.message || 'Failed to request password reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');

    const code = digits.join('');
    if (code.length !== 6) {
      setError('Enter all six digits of the reset code.');
      return;
    }

    if (!passwordReady) {
      setError('New password does not satisfy all complexity requirements.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim().toLowerCase(),
        otp: code,
        newPassword: password,
      });
      setStage('done');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Code may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="otp-stage">
      <section className="otp-card">
        <button className="back-link" onClick={() => onNavigate('login')} type="button">
          <ArrowLeft size={16} /> Back to sign in
        </button>

        <span className="otp-icon">
          <LockKey size={22} />
        </span>

        {stage === 'request' && (
          <>
            <h1>Forgot your password?</h1>
            <p className="otp-copy">
              Enter your registered email and we will send a reset code valid for 15 minutes.
              All active sessions will be terminated on reset.
            </p>
            <form onSubmit={handleRequest}>
              <label className="field">
                <span className="field__label">Email Address *</span>
                <span className="field__control">
                  <EnvelopeSimple size={17} weight="regular" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </span>
              </label>

              {error && (
                <p className="form-error" role="alert">
                  <Warning size={14} /> {error}
                </p>
              )}

              <button
                className="button button--charcoal button--full"
                style={{ marginTop: '18px' }}
                disabled={loading}
                type="submit"
              >
                {loading ? 'Sending code...' : 'Send reset code'}
              </button>
            </form>
          </>
        )}

        {stage === 'verify' && (
          <>
            <h1>Set a new password</h1>
            <p className="otp-copy">
              Enter the 6-digit code sent to <strong>{email}</strong> and choose your new password.
            </p>
            <form onSubmit={handleReset}>
              <label className="otp-label">Reset code</label>
              <OtpInputs digits={digits} onChange={setDigits} />

              <p className="otp-countdown">
                {seconds > 0 ? (
                  `Code expires in ${formattedTimer}`
                ) : (
                  <span className="text-danger">Code expired. Please request a new one.</span>
                )}
              </p>

              <label className="field" style={{ marginTop: '16px' }}>
                <span className="field__label">New Password *</span>
                <span className="field__control">
                  <LockKey size={17} weight="regular" />
                  <input
                    type="password"
                    placeholder="Create a new password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </span>
              </label>

              <PasswordRules password={password} />

              {error && (
                <p className="form-error" role="alert">
                  <Warning size={14} /> {error}
                </p>
              )}

              <button
                className="button button--charcoal button--full"
                style={{ marginTop: '14px' }}
                disabled={digits.some((d) => !d) || !passwordReady || loading}
                type="submit"
              >
                {loading ? 'Updating password...' : 'Reset password'}
              </button>
            </form>
          </>
        )}

        {stage === 'done' && (
          <div className="otp-success">
            <CheckCircle size={44} weight="duotone" style={{ color: 'var(--brand-gold, #c89d53)' }} />
            <h1>Password updated</h1>
            <p className="otp-copy">
              Your password has been changed successfully. All previous sessions were revoked for security.
            </p>
            <button
              className="button button--charcoal button--full"
              style={{ marginTop: '14px' }}
              onClick={() => onNavigate('login')}
              type="button"
            >
              Back to sign in
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

export default ForgotPassword;
