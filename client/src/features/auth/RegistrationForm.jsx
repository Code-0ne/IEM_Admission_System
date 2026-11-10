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
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

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
        onRegistered(res.user);
      }
    } catch (err) {
      if (err.code === 'VALIDATION_ERROR' && Array.isArray(err.details)) {
        const nextFieldErrors = {};
        const unassignedMessages = [];
        for (const detail of err.details) {
          const field = detail.path?.split('.')[0];
          if (['fullName', 'email', 'countryCode', 'mobile', 'password', 'consent'].includes(field)) {
            nextFieldErrors[field] = nextFieldErrors[field]
              ? `${nextFieldErrors[field]} ${detail.message}`
              : detail.message;
          } else {
            unassignedMessages.push(detail.message);
          }
        }
        setFieldErrors(nextFieldErrors);
        setError(unassignedMessages.join(' ') || (Object.keys(nextFieldErrors).length ? '' : 'Please review the highlighted fields.'));
      } else {
        setError(err.message || 'Registration failed. Please check your inputs.');
      }
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
              <strong>Easy sign-in</strong>
              <small>Start using your account right after registration.</small>
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

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className={`field${fieldErrors.fullName ? ' field--invalid' : ''}`}>
            <span className="field__label">Full Name *</span>
            <span className="field__control">
              <User size={17} weight="regular" />
              <input
                type="text"
                id="registration-full-name"
                placeholder="Enter your full name"
                autoComplete="name"
                maxLength={100}
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }}
                aria-invalid={Boolean(fieldErrors.fullName)}
                aria-describedby={fieldErrors.fullName ? 'registration-full-name-error' : undefined}
                required
              />
            </span>
            {fieldErrors.fullName && <small className="field__error" id="registration-full-name-error">{fieldErrors.fullName}</small>}
            <small className="field__hint">In full — initials and titles such as Mr, Ms are not allowed.</small>
          </label>

          <label className={`field${fieldErrors.email ? ' field--invalid' : ''}`}>
            <span className="field__label">Email Address *</span>
            <span className="field__control">
              <EnvelopeSimple size={17} weight="regular" />
              <input
                type="email"
                id="registration-email"
                placeholder="Enter your email address"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'registration-email-error' : undefined}
                required
              />
            </span>
            {fieldErrors.email && <small className="field__error" id="registration-email-error">{fieldErrors.email}</small>}
          </label>

          <div className="field-row-phone">
            <label className={`field${fieldErrors.countryCode ? ' field--invalid' : ''}`}>
              <span className="field__label">Country code *</span>
              <span className="select-control">
                <select value={countryCode} onChange={(e) => { setCountryCode(e.target.value); clearFieldError('countryCode'); }} aria-invalid={Boolean(fieldErrors.countryCode)} aria-describedby={fieldErrors.countryCode ? 'registration-country-code-error' : undefined} required>
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </span>
              {fieldErrors.countryCode && <small className="field__error" id="registration-country-code-error">{fieldErrors.countryCode}</small>}
            </label>

            <label className={`field${fieldErrors.mobile ? ' field--invalid' : ''}`}>
              <span className="field__label">Mobile Number *</span>
              <span className="field__control">
                <Phone size={17} weight="regular" />
                <input
                  type="tel"
                  id="registration-mobile"
                  placeholder="10-digit mobile number"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  autoComplete="tel-national"
                  value={mobile}
                  onChange={(e) => { setMobile(e.target.value.replace(/\D/g, '').slice(0, 10)); clearFieldError('mobile'); }}
                  aria-invalid={Boolean(fieldErrors.mobile)}
                  aria-describedby={fieldErrors.mobile ? 'registration-mobile-error' : undefined}
                  required
                />
              </span>
              {fieldErrors.mobile && <small className="field__error" id="registration-mobile-error">{fieldErrors.mobile}</small>}
            </label>
          </div>

          <label className={`field${fieldErrors.password ? ' field--invalid' : ''}`}>
            <span className="field__label">Password *</span>
            <span className="field__control">
              <LockKey size={17} weight="regular" />
              <input
                type="password"
                id="registration-password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'registration-password-error' : undefined}
                required
              />
            </span>
            {fieldErrors.password && <small className="field__error" id="registration-password-error">{fieldErrors.password}</small>}
          </label>

          <PasswordRules password={password} />

          <label className={`consent-row${fieldErrors.consent ? ' consent-row--invalid' : ''}`}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => { setConsent(e.target.checked); clearFieldError('consent'); }}
              aria-invalid={Boolean(fieldErrors.consent)}
              aria-describedby={fieldErrors.consent ? 'registration-consent-error' : undefined}
              required
            />
            <span>
              I agree to the <a href="#terms">terms and conditions</a> and consent to the use of my information for admission processing.
            </span>
          </label>
          {fieldErrors.consent && <small className="field__error" id="registration-consent-error">{fieldErrors.consent}</small>}

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="button button--dark button--full"
            disabled={loading}
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
