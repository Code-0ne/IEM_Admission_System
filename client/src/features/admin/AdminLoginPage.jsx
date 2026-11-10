import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeSlash,
  LockKey,
  ShieldCheck,
  User,
  Warning,
} from '@phosphor-icons/react';
import { useAuth } from '../auth/AuthContext.jsx';

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLocked(false);
    setLoading(true);

    try {
      const result = await login({ identifier: identifier.trim(), password });
      if (result?.user?.role !== 'admin') {
        await logout();
        setError('This account does not have administrator access.');
      }
    } catch (err) {
      const locked = err.code === 'TOO_MANY_REQUESTS' || err.message?.includes('locked');
      setIsLocked(locked);
      setError(err.message || 'We could not sign you in. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-entry">
      <a className="admin-entry__skip" href="#admin-login">Skip to sign in</a>
      <header className="admin-entry__header">
        <a className="admin-entry__brand" href="/" aria-label="IEM Admissions home">
          <span className="admin-entry__seal">IEM</span>
          <span className="admin-entry__brand-copy">
            <strong>INSTITUTE OF ENGINEERING &amp; MANAGEMENT</strong>
            <small>SALT LAKE, KOLKATA</small>
          </span>
        </a>
        <a className="admin-entry__home-link" href="/">
          <ArrowLeft size={16} aria-hidden="true" />
          Admissions home
        </a>
      </header>

      <main className="admin-entry__main" id="admin-login">
        <section className="admin-entry__story" aria-labelledby="admin-entry-title">
          <div className="admin-entry__eyebrow">
            <span aria-hidden="true" />
            Admissions office · Staff access
          </div>
          <h1 id="admin-entry-title">Every application, ready for review.</h1>
          <p>
            Verify documents, request corrections, and record admission decisions from one
            secure workspace.
          </p>
          <div className="admin-entry__visual">
            <img
              src="/assets/hero-campus-illustration.png"
              alt="Illustration of the IEM Kolkata campus"
              width="720"
              height="420"
              fetchpriority="high"
            />
            <div className="admin-entry__workflow" aria-label="Application review workflow">
              <span><i>01</i> Applications</span>
              <span className="admin-entry__workflow-line" aria-hidden="true" />
              <span><i>02</i> Review</span>
              <span className="admin-entry__workflow-line" aria-hidden="true" />
              <span><i>03</i> Decision</span>
            </div>
          </div>
        </section>

        <section className="admin-entry__panel" aria-labelledby="admin-login-title">
          <div className="admin-entry__panel-mark" aria-hidden="true">
            <ShieldCheck size={22} weight="duotone" />
          </div>
          <p className="admin-entry__panel-kicker">Administrator portal</p>
          <h2 id="admin-login-title">Sign in to continue</h2>
          <p className="admin-entry__panel-copy">
            Use your registered staff email or mobile number.
          </p>

          <form className="admin-entry__form" onSubmit={handleSubmit}>
            <div className="admin-entry__field">
              <label htmlFor="admin-identifier">Email or mobile number</label>
              <span className="admin-entry__input-wrap">
                <User size={18} aria-hidden="true" />
                <input
                  id="admin-identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck="false"
                  placeholder="name@iem.edu.in"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                />
              </span>
            </div>

            <div className="admin-entry__field">
              <label htmlFor="admin-password">Password</label>
              <span className="admin-entry__input-wrap">
                <LockKey size={18} aria-hidden="true" />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  className="admin-entry__password-toggle"
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword
                    ? <EyeSlash size={18} aria-hidden="true" />
                    : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
            </div>

            {error && (
              <div className={`admin-entry__error${isLocked ? ' is-locked' : ''}`} role="alert" aria-live="polite">
                <Warning size={18} weight="fill" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button className="admin-entry__submit" type="submit" disabled={loading}>
              <span>{loading ? 'Signing in…' : 'Sign in to admin portal'}</span>
              {loading ? <span className="admin-entry__spinner" aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </form>

          <div className="admin-entry__security">
            <ShieldCheck size={17} aria-hidden="true" />
            <span>Administrator access is limited to verified staff accounts.</span>
          </div>
        </section>
      </main>

      <footer className="admin-entry__footer">
        <span>© 2026 Institute of Engineering &amp; Management, Kolkata</span>
        <a href="mailto:admissions@iem.edu.in">Need help? Contact admissions</a>
      </footer>
    </div>
  );
}
