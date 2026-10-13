import { useState, useEffect } from 'react';
import { ArrowLeft, EnvelopeSimple, Warning, CheckCircle } from '@phosphor-icons/react';
import { useAuth } from './AuthContext.jsx';

const OTP_EXPIRY_SECONDS = 600; // 10 minutes per spec

function OtpInputs({ digits, onChange }) {
  const updateDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    onChange(updated);
    if (digit && index < digits.length - 1) {
      document.getElementById(`otp-input-${index + 1}`)?.focus();
    }
  };

  return (
    <div className="otp-inputs">
      {digits.map((digit, index) => (
        <input
          key={index}
          id={`otp-input-${index}`}
          aria-label={`OTP digit ${index + 1}`}
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => updateDigit(index, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Backspace' && !digits[index] && index > 0) {
              document.getElementById(`otp-input-${index - 1}`)?.focus();
            }
          }}
        />
      ))}
    </div>
  );
}

export function OtpModal({ email, mobile, onNavigate, onVerified, initialCode = '' }) {
  const { verifyOtp, resendOtp } = useAuth();
  const [digits, setDigits] = useState(() => {
    if (initialCode && initialCode.length === 6) {
      return initialCode.split('');
    }
    return ['', '', '', '', '', ''];
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(OTP_EXPIRY_SECONDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formattedTimer = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const code = digits.join('');
    if (code.length !== 6) {
      setError('Enter all six digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp({ email, otp: code });
      setMessage('Account verified successfully!');
      if (onVerified) onVerified();
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setMessage('');
    try {
      const res = await resendOtp({ email });
      setSeconds(OTP_EXPIRY_SECONDS);
      setDigits(['', '', '', '', '', '']);
      setMessage('A new one-time code has been sent to your email.');
      if (res?.otpCode) {
        // Dev/test convenience
        setDigits(res.otpCode.split(''));
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP. Please try again later.');
    }
  };

  return (
    <main className="otp-stage">
      <section className="otp-card">
        <button className="back-link" onClick={() => onNavigate('register')} type="button">
          <ArrowLeft size={16} /> Back to registration
        </button>

        <span className="otp-icon">
          <EnvelopeSimple size={22} />
        </span>

        <h1>Verify your account</h1>
        <p className="otp-copy">We’ve sent a one-time verification code valid for 10 minutes to</p>
        <strong className="otp-phone">
          {email || (mobile ? `+91 XXXXX ${mobile.slice(-5)}` : 'your registered email')}
        </strong>

        <form onSubmit={handleVerify}>
          <label className="otp-label">Enter 6-digit OTP</label>
          <OtpInputs digits={digits} onChange={setDigits} />

          <p className="otp-countdown">
            {seconds > 0 ? (
              `OTP expires in ${formattedTimer}`
            ) : (
              <span className="text-danger">Code expired. Please request a new one.</span>
            )}
          </p>

          {error && (
            <p className="form-error" role="alert">
              <Warning size={14} /> {error}
            </p>
          )}

          {message && (
            <p className="inline-notice" role="status">
              <CheckCircle size={14} /> {message}
            </p>
          )}

          <button
            className="button button--charcoal button--full"
            disabled={digits.some((d) => !d) || loading}
            type="submit"
          >
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </form>

        <button className="resend-button" onClick={handleResend} type="button">
          Resend OTP
        </button>
      </section>
    </main>
  );
}

export default OtpModal;
