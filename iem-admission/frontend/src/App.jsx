import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  Buildings,
  CalendarBlank,
  CaretDown,
  ChatCircleDots,
  Check,
  CheckCircle,
  CreditCard,
  FileText,
  Folder,
  GraduationCap,
  House,
  IdentificationCard,
  Info,
  Lightbulb,
  LockKey,
  MapPin,
  PencilSimple,
  ShieldCheck,
  SignOut,
  Sparkle,
  SquaresFour,
  User,
  UserCircle,
  Users,
  Wallet,
} from '@phosphor-icons/react';

const features = [
  {
    title: 'Quality Education',
    description: 'Industry-focused curriculum with experienced faculty.',
    icon: '/assets/award.svg',
  },
  {
    title: 'Placement Support',
    description: 'Strong placement record with top recruiters.',
    icon: '/assets/briefcase.svg',
  },
  {
    title: 'Diverse Courses',
    description: 'Wide range of UG & PG programs to choose from.',
    icon: '/assets/book-open.svg',
  },
  {
    title: 'Modern Campus',
    description: 'State-of-the-art infrastructure and facilities.',
    icon: '/assets/map.svg',
  },
  {
    title: 'Holistic Development',
    description: 'Focus on overall growth through events & activities.',
    icon: '/assets/users.svg',
  },
];

const steps = ['Personal & Contact Details', 'Academic & Family Details', 'Program & Preferences', 'Documents & Review'];
const navItems = [
  { label: 'Dashboard', icon: SquaresFour },
  { label: 'Apply Now', icon: PencilSimple },
  { label: 'My Applications', icon: Briefcase },
  { label: 'Documents', icon: Folder },
  { label: 'Payments', icon: CreditCard },
];

function Brand({ compact = false, onHome }) {
  return (
    <a className={`brand${compact ? ' brand--compact' : ''}`} href="#home" aria-label="IEM Admissions home" onClick={(event) => { if (onHome) { event.preventDefault(); onHome('home'); } }}>
      <span className="brand__seal">IEM</span>
      <span className="brand__copy">
        <strong>INSTITUTE OF ENGINEERING &amp; MANAGEMENT</strong>
        <small>SALT LAKE, KOLKATA</small>
      </span>
    </a>
  );
}

function Footer({ className = '' }) {
  return (
    <footer className={`site-footer ${className}`}>
      <p>© 2026 Institute of Engineering &amp; Management, Kolkata. All rights reserved.</p>
      <nav aria-label="Footer navigation">
        <a href="#privacy">Privacy Policy</a>
        <span className="footer-separator"><img src="/assets/divider-footer.svg" alt="" /></span>
        <a href="#terms">Terms &amp; Conditions</a>
        <span className="footer-separator"><img src="/assets/divider-footer.svg" alt="" /></span>
        <a href="mailto:admissions@iem.edu.in">Help</a>
      </nav>
    </footer>
  );
}

function PublicHeader({ onNavigate, active = 'Home' }) {
  const publicLinks = ['Home', 'Courses', 'Admission Process', 'FAQs', 'Contact Us'];
  return (
    <header className="public-header">
      <Brand onHome={onNavigate} />
      <nav className="public-nav" aria-label="Main navigation">
        {publicLinks.map((item) => (
          <a
            className={active === item ? 'is-active' : ''}
            href={item === 'Home' ? '#home' : `#${item.toLowerCase().replaceAll(' ', '-')}`}
            onClick={item === 'Home' ? (event) => { event.preventDefault(); onNavigate('home'); } : undefined}
            key={item}
          >
            {item}
          </a>
        ))}
      </nav>
      <button className="mobile-login" onClick={() => onNavigate('login')} type="button">Sign in</button>
    </header>
  );
}

function LandingPage({ onNavigate }) {
  return (
    <div className="public-page" id="home">
      <PublicHeader onNavigate={onNavigate} />
      <main>
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-content">
              <div className="hero-badge">
                <span className="badge-dot" />
                <span>IEMJEE 2026 Registrations Open</span>
              </div>
              <h1 className="hero-title">
                Engineering Education in<br />the Heart of Kolkata
              </h1>
              <p className="hero-description">
                Join IEM Salt Lake—NAAC 'A' Grade accredited institution ranked 3rd best engineering college in West Bengal. 30 years of placement excellence with students getting 1-2 job offers on average.
              </p>
              <div className="hero-actions">
                <button className="button button--dark" onClick={() => onNavigate('register')} type="button">
                  Start Application
                </button>
                <button className="button button--outline" onClick={() => onNavigate('login')} type="button">
                  Returning Student? Sign In
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat-item">
                  <strong>30 Years</strong>
                  <span>Placement Legacy</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <strong>100%</strong>
                  <span>Job Assistance</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <strong>TCS, Wipro, Infosys</strong>
                  <span>Top Recruiters</span>
                </div>
              </div>
            </div>
            <div className="hero-visual">
              <div className="hero-card hero-card--primary">
                <div className="hero-card-header">
                  <span className="hero-card-icon">
                    <CheckCircle size={24} weight="duotone" />
                  </span>
                  <span className="hero-card-badge">NAAC 'A' Grade</span>
                </div>
                <h3>Why IEM Kolkata?</h3>
                <p>Ranked 3rd in West Bengal, 79th in India by NIRF. NBA accredited programs in CSE, IT, ECE, EE, MBA.</p>
                <ul className="hero-card-list">
                  <li><Check size={16} weight="bold" /> Sector V, Salt Lake Campus</li>
                  <li><Check size={16} weight="bold" /> Harvard Business School MOU</li>
                  <li><Check size={16} weight="bold" /> 82+ Student Startups</li>
                  <li><Check size={16} weight="bold" /> 24×7 Digital Library</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="programs-section">
          <div className="programs-container">
            <div className="section-header">
              <div>
                <h2>Programs Offered</h2>
                <p>Choose from our wide range of undergraduate and postgraduate programs</p>
              </div>
              <button className="button button--outline button--small" type="button">
                View All Programs
              </button>
            </div>
            <div className="programs-grid">
              <div className="program-card">
                <div className="program-header">
                  <span className="program-badge">UG</span>
                  <span className="program-duration">4 Years</span>
                </div>
                <h3>B.Tech CSE</h3>
                <p className="program-subtitle">Build AI systems for top tech companies. NBA accredited with specializations in AI, ML, IoT, Data Science.</p>
                <div className="program-details">
                  <div className="program-detail">
                    <span className="detail-label">Entrance</span>
                    <span className="detail-value">IEMJEE</span>
                  </div>
                  <div className="program-detail">
                    <span className="detail-label">Eligibility</span>
                    <span className="detail-value">10th & 12th ≥ 80%</span>
                  </div>
                  <div className="program-detail">
                    <span className="detail-label">Placed at</span>
                    <span className="detail-value">TCS, Cognizant, Wipro</span>
                  </div>
                </div>
                <button className="program-apply" onClick={() => onNavigate('register')} type="button">
                  Explore Program <ArrowRight size={16} />
                </button>
              </div>

              <div className="program-card">
                <div className="program-header">
                  <span className="program-badge">UG</span>
                  <span className="program-duration">4 Years</span>
                </div>
                <h3>BBA</h3>
                <p className="program-subtitle">Ranked 7th in India, 2nd in East & Central Region. Harvard Business School study material access.</p>
                <div className="program-details">
                  <div className="program-detail">
                    <span className="detail-label">Entrance</span>
                    <span className="detail-value">IEMCET</span>
                  </div>
                  <div className="program-detail">
                    <span className="detail-label">Eligibility</span>
                    <span className="detail-value">10th & 12th ≥ 60%</span>
                  </div>
                  <div className="program-detail">
                    <span className="detail-label">Investment</span>
                    <span className="detail-value">₹70,000/semester</span>
                  </div>
                </div>
                <button className="program-apply" onClick={() => onNavigate('register')} type="button">
                  Explore Program <ArrowRight size={16} />
                </button>
              </div>

              <div className="program-card">
                <div className="program-header">
                  <span className="program-badge program-badge--pg">PG</span>
                  <span className="program-duration">2 Years</span>
                </div>
                <h3>MCA</h3>
                <p className="program-subtitle">Advanced computing with specializations in AI, Cloud, Cybersecurity. Industry-driven curriculum.</p>
                <div className="program-details">
                  <div className="program-detail">
                    <span className="detail-label">Entrance</span>
                    <span className="detail-value">IEMCET</span>
                  </div>
                  <div className="program-detail">
                    <span className="detail-label">Eligibility</span>
                    <span className="detail-value">Graduation ≥ 60%</span>
                  </div>
                  <div className="program-detail">
                    <span className="detail-label">Investment</span>
                    <span className="detail-value">₹75,000/semester</span>
                  </div>
                </div>
                <button className="program-apply" onClick={() => onNavigate('register')} type="button">
                  Explore Program <ArrowRight size={16} />
                </button>
              </div>

              <div className="program-card">
                <div className="program-header">
                  <span className="program-badge program-badge--pg">PG</span>
                  <span className="program-duration">2 Years</span>
                </div>
                <h3>MBA</h3>
                <p className="program-subtitle">NBA accredited. Harvard Business School content. General Management with industry-ready training.</p>
                <div className="program-details">
                  <div className="program-detail">
                    <span className="detail-label">Entrance</span>
                    <span className="detail-value">CAT / MAT</span>
                  </div>
                  <div className="program-detail">
                    <span className="detail-label">Eligibility</span>
                    <span className="detail-value">Graduation ≥ 55%</span>
                  </div>
                  <div className="program-detail">
                    <span className="detail-label">Investment</span>
                    <span className="detail-value">₹1,75,000/semester</span>
                  </div>
                </div>
                <button className="program-apply" onClick={() => onNavigate('register')} type="button">
                  Explore Program <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="features-section">
          <div className="features-container">
            <div className="section-header-center">
              <h2>Why Choose IEM Kolkata?</h2>
              <p>Join thousands of students who have built successful careers with us</p>
            </div>
            <div className="features-grid-new">
              {features.map((feature, index) => (
                <div className="feature-card" key={feature.title}>
                  <div className="feature-icon">
                    <img src={feature.icon} alt="" />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta-section">
          <div className="cta-container">
            <div className="cta-content">
              <h2>Ready to Join IEM Kolkata?</h2>
              <p>Applications open for 2026-27. Start your journey at one of Eastern India's top engineering colleges.</p>
              <div className="cta-actions">
                <button className="button button--dark" onClick={() => onNavigate('register')} type="button">
                  Start Application
                </button>
                <a className="button button--outline" href="tel:8010700500">
                  Call Admissions: 8010700500
                </a>
              </div>
            </div>
            <div className="cta-help">
              <div className="help-card">
                <ChatCircleDots size={28} />
                <h4>Need Help?</h4>
                <p>Our admissions team is available to assist you</p>
                <a href="mailto:admissions@iem.edu.in">admissions@iem.edu.in</a>
                <a href="tel:8010700500" style={{ marginTop: '8px', display: 'block' }}>8010700500 / 8069795500</a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function AuthShell({ children, onHome }) {
  return (
    <div className="auth-page">
      <PublicHeader onNavigate={onHome} />
      <main className="auth-layout">{children}</main>
      <Footer />
    </div>
  );
}

function Field({ label, icon: Icon, hint, ...inputProps }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      <span className="field__control">
        {Icon && <Icon size={17} weight="regular" aria-hidden="true" />}
        <input {...inputProps} />
      </span>
      {hint && <small className="field__hint">{hint}</small>}
    </label>
  );
}

function RegistrationPage({ onNavigate, onRegistered }) {
  return (
    <AuthShell onHome={onNavigate}>
        <section className="registration-intro">
          <h1>Your next chapter<br />starts here.</h1>
        <p className="registration-intro__lead">Create your applicant account to begin your admission journey at IEM.</p>
        <div className="registration-benefits">
          <div><span><LockKey size={19} /></span><p><strong>Secure registration</strong><small>Your personal details are protected.</small></p></div>
          <div><span><ShieldCheck size={19} /></span><p><strong>Verified access</strong><small>Confirm your account with a one-time code.</small></p></div>
          <div><span><CheckCircle size={19} /></span><p><strong>Track your application</strong><small>Keep documents, fees and status together.</small></p></div>
        </div>
        <div className="legacy-note">
          <BookOpen size={22} />
          <p><strong>A legacy of academic excellence</strong><small>Join one of India’s leading institutions with strong industry connections.</small></p>
        </div>
      </section>
      <section className="auth-card auth-card--register">
        <div className="auth-card__heading">
          <h2>Create your account</h2>
          <p>Enter your details to get started.</p>
        </div>
        <form className="auth-form" onSubmit={(event) => { event.preventDefault(); onRegistered(new FormData(event.currentTarget)); }}>
          <Field label="Full Name" name="fullName" placeholder="Enter your full name" autoComplete="name" icon={User} required />
          <Field label="Email Address" name="email" placeholder="Enter your email address" type="email" autoComplete="email" icon={ChatCircleDots} required />
          <Field label="Mobile Number" name="mobile" placeholder="Enter your mobile number" type="tel" inputMode="numeric" pattern="[0-9]{10}" autoComplete="tel-national" icon={MapPin} required />
          <Field label="Password" name="password" placeholder="Create a password" type="password" autoComplete="new-password" icon={LockKey} hint="8+ characters, with an uppercase letter, number and symbol." required minLength={8} />
          <label className="consent-row"><input type="checkbox" required /><span>I agree to the <a href="#terms">terms and conditions</a> and consent to the use of my information for admission processing.</span></label>
          <button className="button button--dark button--full" type="submit">Create account <ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">Already have an account? <button onClick={() => onNavigate('login')} type="button">Sign in</button></p>
      </section>
    </AuthShell>
  );
}

function LoginPage({ onNavigate, onLogin }) {
  return (
    <AuthShell onHome={onNavigate}>
              <section className="login-aside">
        <h1>Pick up where<br />you left off.</h1>
        <p>Sign in to continue your application, check documents or see the latest status.</p>
        <img src="/assets/hero-campus-illustration.png" alt="IEM Kolkata campus" />
      </section>
      <section className="auth-card auth-card--login">
        <div className="auth-card__heading">
          <h2>Welcome back</h2>
          <p>Sign in to your applicant account.</p>
        </div>
        <form className="auth-form" onSubmit={(event) => { event.preventDefault(); onLogin(); }}>
          <Field label="Email Address" name="email" placeholder="Enter your email address" type="email" autoComplete="email" icon={ChatCircleDots} required />
          <Field label="Password" name="password" placeholder="Enter your password" type="password" autoComplete="current-password" icon={LockKey} required />
          <div className="form-meta"><label><input type="checkbox" /> Remember me</label><button onClick={() => onNavigate('verify')} type="button">Forgot password?</button></div>
          <button className="button button--dark button--full" type="submit">Sign in <ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">New to IEM admissions? <button onClick={() => onNavigate('register')} type="button">Create account</button></p>
        <div className="secure-label"><LockKey size={14} /> Your account is protected with secure sign-in.</div>
      </section>
    </AuthShell>
  );
}

function OtpPage({ onNavigate, onVerified, mobile }) {
  const [digits, setDigits] = useState(['', '', '', '', '']);
  const [seconds, setSeconds] = useState(600);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((remaining) => Math.max(remaining - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const updateDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    if (digit) document.getElementById(`otp-${Math.min(index + 1, 4)}`)?.focus();
  };

  const verify = (event) => {
    event.preventDefault();
    if (digits.some((digit) => !digit)) {
      setMessage('Enter all five digits to continue.');
      return;
    }
    onVerified();
  };

  const formattedTime = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return (
    <main className="otp-stage">
      <section className="otp-card">
        <button className="back-link" onClick={() => onNavigate('register')} type="button"><ArrowLeft size={16} /> Back to registration</button>
        <span className="otp-icon"><ChatCircleDots size={22} /></span>
        <h1>Verify your account</h1>
        <p className="otp-copy">We’ve sent a one-time code to</p>
        <strong className="otp-phone">+91 {mobile ? `XXXXX ${mobile.slice(-5)}` : 'XXXXX XXXXX'}</strong>
        <form onSubmit={verify}>
          <label className="otp-label">Enter OTP</label>
          <div className="otp-inputs">
            {digits.map((digit, index) => (
              <input
                aria-label={`OTP digit ${index + 1}`}
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                id={`otp-${index}`}
                inputMode="numeric"
                key={index}
                maxLength={1}
                onChange={(event) => updateDigit(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !digits[index] && index > 0) document.getElementById(`otp-${index - 1}`)?.focus();
                }}
                value={digit}
              />
            ))}
          </div>
          <p className="otp-countdown">{seconds ? `OTP expires in ${formattedTime}` : 'Code expired. Request a new one.'}</p>
          {message && <p className="form-error" role="alert">{message}</p>}
          <button className="button button--charcoal button--full" type="submit">Verify &amp; Continue</button>
        </form>
        <button className="resend-button" onClick={() => { setSeconds(600); setDigits(['', '', '', '', '']); setMessage('A new code has been sent.'); }} type="button">Resend OTP</button>
      </section>
    </main>
  );
}

function Sidebar({ active, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <nav aria-label="Applicant navigation">
        {navItems.map(({ label, icon: Icon }) => (
          <button className={`sidebar-link${active === label ? ' sidebar-link--active' : ''}`} key={label} onClick={() => onNavigate(label === 'Payments' ? 'payment' : 'application')} type="button">
            <Icon size={18} weight="regular" /><span>{label}</span>
          </button>
        ))}
        <p className="sidebar-label">ACCOUNT</p>
        <button className="sidebar-link" onClick={() => onNavigate('application')} type="button"><User size={18} /><span>Profile</span></button>
        <button className="sidebar-link" onClick={() => onNavigate('home')} type="button"><SignOut size={18} /><span>Logout</span></button>
      </nav>
      <div className="sidebar-help"><strong>Need Help?</strong><p>Contact our support team for assistance.</p><a href="mailto:admissions@iem.edu.in">Contact Us</a></div>
    </aside>
  );
}

function ApplicantHeader({ name = 'Applicant', onHome }) {
  return (
    <header className="app-header">
      <Brand compact onHome={onHome} />
      <div className="app-header__tools"><button aria-label="Notifications" type="button"><Bell size={18} /></button><span className="user-chip"><span className="user-chip__avatar"><User size={16} /></span>{name}</span></div>
    </header>
  );
}

function Stepper({ current, variant = 'form' }) {
  const labels = variant === 'payment' ? ['Application Form', 'Documents', 'Payment', 'Review'] : steps;
  return (
    <div className={`stepper stepper--${variant}`}>
      {labels.map((label, index) => {
        const completed = index < current;
        const active = index === current;
        return (
          <div className={`stepper__step${completed ? ' is-complete' : ''}${active ? ' is-current' : ''}`} key={label}>
            <span className="stepper__marker">{completed ? <Check size={15} weight="bold" /> : index + 1}</span>
            <span className="stepper__label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function AiPanel() {
  return (
    <aside className="ai-panel">
      <div className="ai-panel__heading"><Sparkle size={19} /><strong>AI Assistance</strong></div>
      <button className="ai-tool" type="button"><GraduationCap size={19} /><span><strong>Course Recommender</strong><small>Find programs that fit your interests.</small></span><ArrowRight size={15} /></button>
      <button className="ai-tool" type="button"><FileText size={19} /><span><strong>Check My Documents</strong><small>Review quality and completeness.</small></span><ArrowRight size={15} /></button>
      <button className="ai-tool" type="button"><ChatCircleDots size={19} /><span><strong>Ask AI Assistant</strong><small>Get help with eligibility and the form.</small></span><ArrowRight size={15} /></button>
      <div className="ai-tips"><div><Lightbulb size={17} /><strong>Tips</strong></div><p>Fields marked with * are mandatory</p><p>Save as Draft to continue later</p><p>Review all details before submitting</p></div>
    </aside>
  );
}

function ApplicationPage({ onNavigate, applicantName }) {
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState('');
  const [application, setApplication] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem('iem-application') || '{}'); }
    catch { return {}; }
  });
  const [sameAsPresentAddress, setSameAsPresentAddress] = useState(false);
  const [isForeignStudent, setIsForeignStudent] = useState(false);

  useEffect(() => {
    window.localStorage.setItem('iem-application', JSON.stringify(application));
  }, [application]);

  useEffect(() => {
    if (sameAsPresentAddress) {
      setApplication((current) => ({
        ...current,
        permAddress: current.presentAddress || '',
        permPO: current.presentPO || '',
        permDistrict: current.presentDistrict || '',
        permState: current.presentState || '',
        permPIN: current.presentPIN || ''
      }));
    }
  }, [sameAsPresentAddress]);

  const update = (event) => setApplication((current) => ({ ...current, [event.target.name]: event.target.value }));
  const saveDraft = () => {
    setNotice('Draft saved on this device. You can return to it later.');
    window.setTimeout(() => setNotice(''), 3500);
  };

  const sectionTitle = steps[step];
  return (
    <div className="app-shell">
      <ApplicantHeader name={applicantName || 'Applicant'} onHome={onNavigate} />
      <div className="app-body">
        <Sidebar active="Apply Now" onNavigate={onNavigate} />
        <main className="application-main">
          <div className="application-title-row">
            <div><h1>Admission Application Form</h1><p>Fill in your details carefully to apply for your preferred program.</p></div>
            <button className="button button--outline button--draft" onClick={saveDraft} type="button"><FileText size={16} /> Save as Draft</button>
          </div>
          {notice && <p className="inline-notice" role="status">{notice}</p>}
          <Stepper current={step} />
          <form className="application-form" onSubmit={(event) => { event.preventDefault(); if (step < steps.length - 1) setStep(step + 1); else onNavigate('payment'); }}>
            <div className="application-form__heading"><h2>{sectionTitle}</h2><span>Step {step + 1} of {steps.length}</span></div>
            
            {step === 0 && <>
              <div className="form-section">
                <h3 className="form-section__title"><User size={20} /> Basic Information</h3>
                <div className="form-grid">
                  <Field label="Full Name *" name="fullName" placeholder="Enter your full name" value={application.fullName || ''} onChange={update} icon={User} required />
                  <Field label="Date of Birth *" name="dob" type="date" value={application.dob || ''} onChange={update} icon={CalendarBlank} required />
                  <label className="field"><span className="field__label">Gender *</span><span className="select-control"><select name="gender" value={application.gender || ''} onChange={update} required><option value="">Select Gender</option><option>Male</option><option>Female</option></select><CaretDown size={16} /></span></label>
                  <label className="field"><span className="field__label">Category *</span><span className="select-control"><select name="category" value={application.category || ''} onChange={update} required><option value="">Select Category</option><option>General</option><option>OBC</option><option>SC</option><option>ST</option><option>EWS</option></select><CaretDown size={16} /></span></label>
                  <label className="field"><span className="field__label">Blood Group</span><span className="select-control"><select name="bloodGroup" value={application.bloodGroup || ''} onChange={update}><option value="">Select Blood Group</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option></select><CaretDown size={16} /></span></label>
                  <label className="field"><span className="field__label">Religion</span><span className="select-control"><select name="religion" value={application.religion || ''} onChange={update}><option value="">Select Religion</option><option>Hinduism</option><option>Islam</option><option>Christianity</option><option>Sikhism</option><option>Buddhism</option><option>Jainism</option><option>Other</option></select><CaretDown size={16} /></span></label>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><ChatCircleDots size={20} /> Contact Information</h3>
                <div className="form-grid">
                  <Field label="Email Address *" name="email" placeholder="Enter your email" type="email" value={application.email || ''} onChange={update} required />
                  <Field label="Mobile Number *" name="mobile" placeholder="10-digit mobile number" type="tel" inputMode="numeric" pattern="[0-9]{10}" value={application.mobile || ''} onChange={update} required />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><House size={20} /> Present Address</h3>
                <div className="form-grid">
                  <label className="field field--wide"><span className="field__label">Address *</span><textarea name="presentAddress" placeholder="Enter your complete present address" value={application.presentAddress || ''} onChange={update} required /></label>
                  <Field label="P.O." name="presentPO" placeholder="Post Office" value={application.presentPO || ''} onChange={update} />
                  <Field label="District" name="presentDistrict" placeholder="District" value={application.presentDistrict || ''} onChange={update} />
                  <Field label="State" name="presentState" placeholder="State" value={application.presentState || ''} onChange={update} />
                  <Field label="PIN Code" name="presentPIN" placeholder="PIN Code" type="text" inputMode="numeric" pattern="[0-9]{6}" value={application.presentPIN || ''} onChange={update} />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><MapPin size={20} /> Permanent Address</h3>
                <label className="consent-row" style={{marginBottom: '16px'}}><input type="checkbox" checked={sameAsPresentAddress} onChange={(e) => setSameAsPresentAddress(e.target.checked)} /><span>Same as Present Address</span></label>
                <div className="form-grid">
                  <label className="field field--wide"><span className="field__label">Address *</span><textarea name="permAddress" placeholder="Enter your permanent address" value={application.permAddress || ''} onChange={update} required disabled={sameAsPresentAddress} /></label>
                  <Field label="P.O." name="permPO" placeholder="Post Office" value={application.permPO || ''} onChange={update} disabled={sameAsPresentAddress} />
                  <Field label="District" name="permDistrict" placeholder="District" value={application.permDistrict || ''} onChange={update} disabled={sameAsPresentAddress} />
                  <Field label="State" name="permState" placeholder="State" value={application.permState || ''} onChange={update} disabled={sameAsPresentAddress} />
                  <Field label="PIN Code" name="permPIN" placeholder="PIN Code" type="text" inputMode="numeric" pattern="[0-9]{6}" value={application.permPIN || ''} onChange={update} disabled={sameAsPresentAddress} />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><IdentificationCard size={20} /> Citizenship Information</h3>
                <div className="form-grid">
                  <label className="field"><span className="field__label">Are you a Foreign Student?</span><span className="select-control"><select name="foreignStudent" value={application.foreignStudent || 'No'} onChange={(e) => { update(e); setIsForeignStudent(e.target.value === 'Yes'); }}><option>No</option><option>Yes</option></select><CaretDown size={16} /></span></label>
                  {(isForeignStudent || application.foreignStudent === 'Yes') && <>
                    <Field label="Passport No." name="passportNo" placeholder="Passport Number" value={application.passportNo || ''} onChange={update} />
                    <Field label="Residence" name="residence" placeholder="Country of Residence" value={application.residence || ''} onChange={update} />
                    <Field label="Visa No." name="visaNo" placeholder="Visa Number" value={application.visaNo || ''} onChange={update} />
                    <Field label="Date of Issue" name="visaIssueDate" type="date" value={application.visaIssueDate || ''} onChange={update} />
                    <Field label="Place of Issue" name="visaIssuePlace" placeholder="Place of Issue" value={application.visaIssuePlace || ''} onChange={update} />
                  </>}
                </div>
              </div>
            </>}
            
            {step === 1 && <>
              <div className="form-section">
                <h3 className="form-section__title"><Users size={20} /> Family Information</h3>
                <p className="form-section__subtitle">Please provide details of your parents and guardian</p>
                
                <div className="form-subsection">
                  <span className="form-subsection__title">Father's Details</span>
                  <div className="form-grid">
                    <Field label="Father's Name *" name="fatherName" placeholder="Father's full name" value={application.fatherName || ''} onChange={update} required />
                    <Field label="Father's Email" name="fatherEmail" placeholder="Father's email address" type="email" value={application.fatherEmail || ''} onChange={update} />
                    <Field label="Father's Mobile" name="fatherMobile" placeholder="10-digit mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" value={application.fatherMobile || ''} onChange={update} />
                  </div>
                </div>

                <div className="form-subsection">
                  <span className="form-subsection__title">Mother's Details</span>
                  <div className="form-grid">
                    <Field label="Mother's Name *" name="motherName" placeholder="Mother's full name" value={application.motherName || ''} onChange={update} required />
                    <Field label="Mother's Email" name="motherEmail" placeholder="Mother's email address" type="email" value={application.motherEmail || ''} onChange={update} />
                    <Field label="Mother's Mobile" name="motherMobile" placeholder="10-digit mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" value={application.motherMobile || ''} onChange={update} />
                  </div>
                </div>

                <div className="form-subsection">
                  <span className="form-subsection__title">Guardian's Details</span>
                  <div className="form-grid">
                    <Field label="Guardian's Name *" name="guardianName" placeholder="Guardian's full name" value={application.guardianName || ''} onChange={update} required />
                    <Field label="Relation" name="guardianRelation" placeholder="Relation with guardian" value={application.guardianRelation || ''} onChange={update} />
                    <label className="field field--wide"><span className="field__label">Guardian's Office Address & Designation *</span><textarea name="guardianOffice" placeholder="Complete office address and designation" value={application.guardianOffice || ''} onChange={update} required /></label>
                    <Field label="Office Phone" name="guardianOfficePhone" placeholder="Office phone number" type="tel" value={application.guardianOfficePhone || ''} onChange={update} />
                    <Field label="Monthly Income (₹) *" name="monthlyIncome" placeholder="Monthly income in rupees" type="number" min="0" value={application.monthlyIncome || ''} onChange={update} required />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><FileText size={20} /> Entrance Examination</h3>
                <div className="form-grid">
                  <Field label="Admission Test *" name="admissionTest" placeholder="IEMJEE, IEMCET, CAT, MAT" value={application.admissionTest || ''} onChange={update} required />
                  <Field label="Year of Exam *" name="examYear" placeholder="Year" type="number" min="2020" max="2026" value={application.examYear || ''} onChange={update} required />
                  <Field label="Registration No. *" name="registrationNo" placeholder="Registration number" value={application.registrationNo || ''} onChange={update} required />
                  <Field label="Rank *" name="rank" placeholder="Rank obtained" type="number" min="1" value={application.rank || ''} onChange={update} required />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><GraduationCap size={20} /> 10th Standard</h3>
                <div className="form-grid">
                  <Field label="Exam Name *" name="exam10Name" placeholder="e.g., ICSE, CBSE, State Board" value={application.exam10Name || ''} onChange={update} required />
                  <Field label="Board / Council *" name="board10" placeholder="Board or council" value={application.board10 || ''} onChange={update} required />
                  <Field label="Year of Passing *" name="year10" type="number" min="2000" max="2026" placeholder="Year" value={application.year10 || ''} onChange={update} required />
                  <Field label="Aggregate (%) *" name="marks10" type="number" min="0" max="100" step="0.01" placeholder="e.g., 86.4" value={application.marks10 || ''} onChange={update} required />
                  <Field label="School Name *" name="school10Name" placeholder="School name" value={application.school10Name || ''} onChange={update} required />
                  <Field label="Subjects *" name="subjects10" placeholder="Main subjects studied" value={application.subjects10 || ''} onChange={update} required />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><GraduationCap size={20} /> 12th Standard</h3>
                <div className="form-grid">
                  <Field label="Exam Name *" name="exam12Name" placeholder="e.g., ISC, CBSE, State Board" value={application.exam12Name || ''} onChange={update} required />
                  <Field label="Board / Council *" name="board12" placeholder="Board or council" value={application.board12 || ''} onChange={update} required />
                  <Field label="Year of Passing *" name="year12" type="number" min="2000" max="2026" placeholder="Year" value={application.year12 || ''} onChange={update} required />
                  <Field label="Aggregate (%) *" name="marks12" type="number" min="0" max="100" step="0.01" placeholder="e.g., 81.2" value={application.marks12 || ''} onChange={update} required />
                  <Field label="School Name *" name="school12Name" placeholder="School name" value={application.school12Name || ''} onChange={update} required />
                  <label className="field field--wide"><span className="field__label">School Address *</span><textarea name="school12Address" placeholder="Complete school address" value={application.school12Address || ''} onChange={update} required /></label>
                  <Field label="Subjects" name="subjects12" placeholder="Main subjects studied" value={application.subjects12 || ''} onChange={update} />
                </div>
                
                <div className="form-subsection">
                  <span className="form-subsection__title">Subject-wise Marks (if applicable)</span>
                  <div className="form-grid">
                    <Field label="English" name="marks12English" placeholder="Marks" type="number" min="0" max="100" value={application.marks12English || ''} onChange={update} />
                    <Field label="Physics" name="marks12Physics" placeholder="Marks" type="number" min="0" max="100" value={application.marks12Physics || ''} onChange={update} />
                    <Field label="Chemistry / Computer Science" name="marks12ChemCS" placeholder="Marks" type="number" min="0" max="100" value={application.marks12ChemCS || ''} onChange={update} />
                    <Field label="Mathematics" name="marks12Maths" placeholder="Marks" type="number" min="0" max="100" value={application.marks12Maths || ''} onChange={update} />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><BookOpen size={20} /> Other Qualifications</h3>
                <p className="form-section__subtitle">Fill this section if you have completed graduation or post-graduation</p>
                <div className="form-grid">
                  <Field label="Degree Name" name="degreeName" placeholder="e.g., B.Sc., B.Com" value={application.degreeName || ''} onChange={update} />
                  <Field label="Board / University" name="degreeBoard" placeholder="Board or university" value={application.degreeBoard || ''} onChange={update} />
                  <Field label="Year of Passing" name="degreeYear" type="number" min="2000" max="2026" placeholder="Year" value={application.degreeYear || ''} onChange={update} />
                  <Field label="Aggregate (%)" name="degreeMarks" type="number" min="0" max="100" step="0.01" placeholder="Aggregate percentage" value={application.degreeMarks || ''} onChange={update} />
                  <Field label="Institution Name" name="degreeInstitution" placeholder="College or institution name" value={application.degreeInstitution || ''} onChange={update} />
                  <Field label="Subjects" name="degreeSubjects" placeholder="Main subjects" value={application.degreeSubjects || ''} onChange={update} />
                </div>
              </div>
            </>}
            
            {step === 2 && <>
              <div className="form-section">
                <h3 className="form-section__title"><Briefcase size={20} /> Program Selection</h3>
                <div className="form-grid">
                  <label className="field field--wide"><span className="field__label">Program Level *</span><span className="select-control"><select name="level" value={application.level || ''} onChange={update} required><option value="">Select level</option><option>Undergraduate</option><option>Postgraduate</option></select><CaretDown size={16} /></span></label>
                  <Field label="Academic Session" name="session" value="2026–27" readOnly />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><GraduationCap size={20} /> Course Selection</h3>
                <p className="form-section__subtitle">Select your desired program and stream</p>
                <div className="form-grid">
                  <label className="field"><span className="field__label">Program *</span><span className="select-control"><select name="course1" value={application.course1 || ''} onChange={update} required><option value="">Select program</option><option>B.Tech</option><option>BBA</option><option>BCA</option><option>BHM</option><option>MBA</option><option>MCA</option><option>M.Tech</option></select><CaretDown size={16} /></span></label>
                  <label className="field"><span className="field__label">Stream *</span><span className="select-control"><select name="stream1" value={application.stream1 || ''} onChange={update} required><option value="">Select stream</option><option>Computer Science & Engineering</option><option>Information Technology</option><option>Electronics & Communication Engineering</option><option>Electrical Engineering</option><option>Mechanical Engineering</option><option>Civil Engineering</option><option>BioTechnology</option><option>Business Administration</option><option>Computer Applications</option><option>General Management</option></select><CaretDown size={16} /></span></label>
                </div>
              </div>
            </>}
            
            {step === 3 && <>
              <div className="form-section">
                <h3 className="form-section__title"><IdentificationCard size={20} /> Identification Details</h3>
                <div className="form-grid">
                  <Field label="Aadhaar Number" name="aadhaar" placeholder="12-digit Aadhaar number" type="text" inputMode="numeric" pattern="[0-9]{12}" value={application.aadhaar || ''} onChange={update} />
                  <Field label="Guardian's PAN" name="guardianPAN" placeholder="PAN number" value={application.guardianPAN || ''} onChange={update} />
                  <Field label="ABC ID *" name="abcID" placeholder="Academic Bank of Credits ID" value={application.abcID || ''} onChange={update} required />
                </div>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><Sparkle size={20} /> Additional Information</h3>
                <label className="field field--wide">
                  <span className="field__label">Certificates / Activities / Hobbies</span>
                  <textarea name="activities" placeholder="Sports, cultural activities, volunteering, hobbies, certificates (max 250 characters)" maxLength={250} value={application.activities || ''} onChange={update} style={{minHeight: '100px'}} />
                  <small className="field__hint">{(application.activities || '').length} / 250 characters</small>
                </label>
              </div>

              <div className="form-section">
                <h3 className="form-section__title"><CheckCircle size={20} /> Review Your Application</h3>
                <p className="form-section__subtitle">Please review all the information before submitting</p>
                <div style={{display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', background: 'var(--bg-gray)', borderRadius: '8px'}}>
                  <div><span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>Applicant Name</span><strong style={{display: 'block', marginTop: '4px', fontSize: '15px'}}>{application.fullName || 'Not provided'}</strong></div>
                  <div><span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>Email</span><strong style={{display: 'block', marginTop: '4px', fontSize: '15px'}}>{application.email || 'Not provided'}</strong></div>
                  <div><span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>Mobile</span><strong style={{display: 'block', marginTop: '4px', fontSize: '15px'}}>{application.mobile || 'Not provided'}</strong></div>
                  <div><span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>Selected Course</span><strong style={{display: 'block', marginTop: '4px', fontSize: '15px'}}>{application.course1 && application.stream1 ? `${application.course1} · ${application.stream1}` : 'Not selected'}</strong></div>
                  <div><span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>Academic Record</span><strong style={{display: 'block', marginTop: '4px', fontSize: '15px'}}>{application.marks10 && application.marks12 ? `10th: ${application.marks10}% | 12th: ${application.marks12}%` : 'Not provided'}</strong></div>
                  <div><span style={{fontSize: '13px', color: 'var(--text-secondary)'}}>Guardian</span><strong style={{display: 'block', marginTop: '4px', fontSize: '15px'}}>{application.guardianName || 'Not provided'}</strong></div>
                </div>
                <label className="consent-row" style={{marginTop: '20px'}}><input type="checkbox" required /><span>I confirm that all the information provided in this application is accurate and complete to the best of my knowledge.</span></label>
              </div>
            </>}
            
            <div className="application-form__actions">
              <button className="button button--outline" disabled={step === 0} onClick={() => setStep((current) => current - 1)} type="button"><ArrowLeft size={16} /> Previous</button>
              <button className="button button--dark" type="submit">{step === steps.length - 1 ? 'Continue to payment' : 'Save & Continue'} <ArrowRight size={16} /></button>
            </div>
          </form>
        </main>
        <AiPanel />
      </div>
      <Footer className="app-footer" />
    </div>
  );
}

function PaymentPage({ onNavigate, applicantName }) {
  const [method, setMethod] = useState('Credit / Debit Card');
  const [paid, setPaid] = useState(false);
  const methods = [
    { name: 'Credit / Debit Card', note: 'Pay using Visa, Mastercard, RuPay', icon: CreditCard },
    { name: 'Net Banking', note: 'Pay using your preferred bank', icon: Buildings },
    { name: 'UPI', note: 'Pay using any UPI app', icon: CreditCard },
    { name: 'Wallets', note: 'Pay using Paytm, PhonePe, etc.', icon: Wallet },
  ];
  return (
    <div className="app-shell">
      <ApplicantHeader name={applicantName || 'Applicant'} onHome={onNavigate} />
      <div className="app-body app-body--payment">
        <Sidebar active="Payments" onNavigate={onNavigate} />
        <main className="payment-main">
          <button className="breadcrumb" onClick={() => onNavigate('application')} type="button"><ArrowLeft size={15} /> Back to application</button>
          <div className="payment-title"><h1>{paid ? 'Payment received' : 'Payment'}</h1><p>{paid ? 'Your application payment has been recorded.' : 'Complete your application payment to submit your application.'}</p></div>
          {paid ? (
            <section className="payment-success"><span className="stamp stamp--received">Received</span><span><CheckCircle size={27} /></span><h2>Payment successful</h2><p>Your application has been submitted for review. A confirmation will be sent to your registered email.</p><button className="button button--dark" onClick={() => onNavigate('application')} type="button">View application <ArrowRight size={16} /></button></section>
          ) : <>
            <Stepper current={2} variant="payment" />
            <div className="payment-columns">
              <section className="payment-card payment-entry">
                <div className="payment-methods">
                  <h2>Select a Payment Method</h2>
                  <div className="method-list">
                    {methods.map(({ name, note, icon: Icon }) => (
                      <button className={`payment-method${method === name ? ' is-selected' : ''}`} key={name} onClick={() => setMethod(name)} type="button">
                        <span className="radio-dot" />
                        <span className="payment-method__icon"><Icon size={19} /></span>
                        <span className="payment-method__text"><strong>{name}</strong><small>{note}</small></span>
                        <ArrowRight size={15} />
                      </button>
                    ))}
                  </div>
                  <div className="security-note"><ShieldCheck size={17} /><span>Your payment is secure and encrypted. We do not store your card or bank details.</span></div>
                </div>
                <form className="payment-details" onSubmit={(event) => { event.preventDefault(); setPaid(true); }}>
                  <h2>{method === 'Credit / Debit Card' ? 'Card Details' : `${method} Details`}</h2>
                  {method === 'Credit / Debit Card' ? <>
                    <Field label="Card Number" name="cardNumber" placeholder="1234 5678 9012 3456" inputMode="numeric" autoComplete="cc-number" required />
                    <Field label="Name on Card" name="cardName" placeholder="Enter name as on card" autoComplete="cc-name" required />
                    <div className="payment-detail-row"><Field label="Expiry Date" name="expiry" placeholder="MM / YY" autoComplete="cc-exp" required /><Field label="CVV" name="cvv" placeholder="123" inputMode="numeric" autoComplete="cc-csc" required /></div>
                    <label className="save-card"><input type="checkbox" /> Save card for future payments</label>
                  </> : <div className="method-placeholder"><span>{method === 'UPI' ? <CreditCard size={21} /> : <Buildings size={21} />}</span><p>Continue to your {method.toLowerCase()} provider to complete this secure payment.</p></div>}
                  <button className="button button--charcoal button--full pay-button" type="submit"><LockKey size={15} /> Pay Now <strong>₹ 1,500</strong></button>
                  <div className="secure-label"><LockKey size={13} /> Secure Payment</div>
                </form>
              </section>
              <aside className="payment-summary">
                <section className="summary-card">
                  <h2>Payment Summary</h2>
                  <div className="summary-row"><span>Application ID</span><strong>IEM26/APP/12450</strong></div>
                  <div className="summary-row"><span>Applicant Name</span><strong>{applicantName || 'Applicant'}</strong></div>
                  <div className="summary-program"><span>Program Applied For</span><strong>{'B.Tech'} · { 'Computer Science & Engineering'}</strong></div>
                  <div className="summary-row summary-row--border"><span>Application Fee</span><strong>₹ 1,500</strong></div>
                  <div className="summary-row"><span>Convenience Fee</span><strong>₹ 0</strong></div>
                  <div className="summary-row summary-row--total"><strong>Total Amount</strong><strong>₹ 1,500</strong></div>
                  <div className="refund-note"><Info size={16} /><span>Payments are non-refundable. Please check all details before proceeding.</span></div>
                </section>
                <section className="status-explainer"><Sparkle size={16} /><div><strong>AI Status Explainer</strong><p>After successful payment, your application will be submitted and you will receive a confirmation email.</p></div></section>
              </aside>
            </div>
          </>}
        </main>
      </div>
      <Footer className="app-footer" />
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('home');
  const [applicantName, setApplicantName] = useState('');
  const [mobile, setMobile] = useState('');

  const register = (formData) => {
    setApplicantName(formData.get('fullName')?.toString().trim() || 'Applicant');
    setMobile(formData.get('mobile')?.toString() || '');
    setPage('verify');
  };

  useEffect(() => {
    document.title = page === 'home' ? 'IEM Admissions | Apply for 2026' : `${page === 'application' ? 'Application' : page === 'payment' ? 'Payment' : 'Applicant access'} | IEM Admissions`;
  }, [page]);

  if (page === 'register') return <RegistrationPage onNavigate={setPage} onRegistered={register} />;
  if (page === 'login') return <LoginPage onNavigate={setPage} onLogin={() => setPage('application')} />;
  if (page === 'verify') return <OtpPage onNavigate={setPage} onVerified={() => setPage('application')} mobile={mobile} />;
  if (page === 'application') return <ApplicationPage onNavigate={setPage} applicantName={applicantName} />;
  if (page === 'payment') return <PaymentPage onNavigate={setPage} applicantName={applicantName} />;
  return <LandingPage onNavigate={setPage} />;
}