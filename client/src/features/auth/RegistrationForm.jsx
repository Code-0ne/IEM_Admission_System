import { useState } from 'react';
import {
  User,
  EnvelopeSimple,
  Phone,
  LockKey,
  Check,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  BookOpen,
} from '@phosphor-icons/react';
import { useAuth } from './AuthContext.jsx';

const COUNTRY_CODES = [
  { value: '+91', label: 'India (+91)' },
  { value: '+880', label: 'Bangladesh (+880)' },
  { value: '+977', label: 'Nepal (+977)' },
  { value: '+94', label: 'Sri Lanka (+94)' },
  { value: '+971', label: 'UAE (+971)' },
  { value: '+60', label: 'Malaysia (+60)' },
  { value: '+44', label: 'UK (+44)' },
  { value: '+1', label: 'USA / Canada (+1)' },
];

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

export function RegistrationForm({ onNavigate, onRegistered }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordReady =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const isValidMobile = /^\d{10}$/.test(mobile.trim());

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (fullName.trim().length > 100) {
      setError('Full name must be 100 characters or fewer.');
      return;
    }

    if (!isValidMobile) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }

    if (!passwordReady) {
      setError('Password does not satisfy all complexity requirements.');
      return;
    }

    if (!consent) {
      setError('You must accept the terms and provide consent to register.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        countryCode,
        mobile: mobile.trim(),
        password,
        consent,
      });

      if (onRegistered) {
        onRegistered({
          user: res.user,
          email: res.user?.email || email.trim().toLowerCase(),
          mobile: res.user?.mobile || mobile.trim(),
          otpCode: res.otpCode,
        });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="registration-intro">
        <h1>
          Your next chapter
          <br />
          starts here.
        </h1>
        <p className="registration-intro__lead">
          Create your applicant account to begin your admission journey at IEM.
        </p>
        <div className="registration-benefits">
          <div>
            <span>
              <LockKey size={19} />
            </span>
            <p>
              <strong>Secure registration</strong>
              <small>Your personal details are protected.</small>
            </p>
          </div>
          <div>
            <span>
              <ShieldCheck size={19} />
            </span>
            <p>
              <strong>Verified access</strong>
              <small>Confirm your account with a one-time code.</small>
            </p>
          </div>
          <div>
            <span>
              <CheckCircle size={19} />
            </span>
            <p>
              <strong>Track your application</strong>
              <small>Keep documents, fees and status together.</small>
            </p>
          </div>
        </div>
        <div className="legacy-note">
          <BookOpen size={22} />
          <p>
            <strong>A legacy of academic excellence</strong>
            <small>Join one of Eastern India’s leading institutions with strong industry connections.</small>
          </p>
        </div>
      </section>

      <section className="auth-card auth-card--register">
        <div className="auth-card__heading">
          <h2>Create your account</h2>
          <p>Enter your details to get started.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Full Name *</span>
            <span className="field__control">
              <User size={17} weight="regular" />
              <input
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </span>
            <small className="field__hint">In full — initials and titles such as Mr, Ms are not allowed.</small>
          </label>

          <label className="field">
            <span className="field__label">Email Address *</span>
            <span className="field__control">
              <EnvelopeSimple size={17} weight="regular" />
              <input
                type="email"
                placeholder="Enter your email address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </span>
          </label>

          <div className="field-row-phone">
            <label className="field">
              <span className="field__label">Country code *</span>
              <span className="select-control">
                <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} required>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="field">
              <span className="field__label">Mobile Number *</span>
              <span className="field__control">
                <Phone size={17} weight="regular" />
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  autoComplete="tel-national"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </span>
            </label>
          </div>

          <label className="field">
            <span className="field__label">Password *</span>
            <span className="field__control">
              <LockKey size={17} weight="regular" />
              <input
                type="password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </span>
          </label>

          <PasswordRules password={password} />

          <label className="consent-row">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              required
            />
            <span>
              I agree to the <a href="#terms">terms and conditions</a> and consent to the use of my information for admission processing.
            </span>
          </label>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button button--dark button--full"
            disabled={!passwordReady || !isValidMobile || !consent || loading}
            type="submit"
          >
            {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <button onClick={() => onNavigate('login')} type="button">
            Sign in
          </button>
        </p>
      </section>
    </div>
  );
}

export default RegistrationForm;
