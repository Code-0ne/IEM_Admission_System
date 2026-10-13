import { useState } from 'react';
import { User, LockKey, ArrowRight, Warning, ShieldCheck } from '@phosphor-icons/react';
import { useAuth } from './AuthContext.jsx';

export function LoginForm({ onNavigate, onLogin }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLocked(false);

    if (!identifier.trim() || !password) {
      setError('Please enter both your email/mobile and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login({
        identifier: identifier.trim(),
        password,
      });

      if (onLogin && res?.user) {
        onLogin(res.user);
      }
    } catch (err) {
      if (err.code === 'TOO_MANY_REQUESTS' || err.message?.includes('locked')) {
        setIsLocked(true);
        setError(err.message || 'Account temporarily locked. Please try again after 15 minutes.');
      } else {
        setError(err.message || 'Incorrect email / phone or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="login-aside">
        <h1>
          Pick up where
          <br />
          you left off.
        </h1>
        <p>Sign in to continue your application, check documents, or see the latest status updates.</p>
        <img src="/assets/hero-campus-illustration.png" alt="IEM Kolkata campus illustration" />
      </section>

      <section className="auth-card auth-card--login">
        <div className="auth-card__heading">
          <h2>Welcome back</h2>
          <p>Sign in with your email or mobile number.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field__label">Email or Mobile *</span>
            <span className="field__control">
              <User size={17} weight="regular" />
              <input
                type="text"
                placeholder="you@example.com or 10-digit mobile"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </span>
          </label>

          <label className="field">
            <span className="field__label">Password *</span>
            <span className="field__control">
              <LockKey size={17} weight="regular" />
              <input
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </span>
          </label>

          <div className="form-meta">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <button onClick={() => onNavigate('forgot')} type="button">
              Forgot password?
            </button>
          </div>

          {isLocked && (
            <div className="app-alert app-alert--warning" role="alert" style={{ marginBottom: '12px' }}>
              <Warning size={18} weight="fill" />
              <div>
                <strong>Account Temporarily Locked</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {!isLocked && error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <button className="button button--dark button--full" disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-switch">
          New to IEM admissions?{' '}
          <button onClick={() => onNavigate('register')} type="button">
            Create account
          </button>
        </p>

        <div className="secure-label">
          <ShieldCheck size={14} /> Generic error handling protects accounts from enumeration attacks.
        </div>
      </section>
    </div>
  );
}

export default LoginForm;
