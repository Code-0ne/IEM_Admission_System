import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  Briefcase,
  Buildings,
  CalendarBlank,
  CaretDown,
  CaretRight,
  ChatCircleDots,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  DownloadSimple,
  EnvelopeSimple,
  FileText,
  Folder,
  GraduationCap,
  House,
  IdentificationCard,
  Info,
  Lightbulb,
  ListChecks,
  LockKey,
  MapPin,
  PaperPlaneRight,
  PencilSimple,
  Phone,
  Receipt,
  Robot,
  SealCheck,
  ShieldCheck,
  SignOut,
  Sparkle,
  SquaresFour,
  TrashSimple,
  UploadSimple,
  User,
  Users,
  Wallet,
  Warning,
  X,
} from '@phosphor-icons/react';

const ACADEMIC_YEAR = '2026-27';
const ACADEMIC_YEAR_START = Number.parseInt(ACADEMIC_YEAR.split('-')[0], 10);
const OLDEST_PASSING_YEAR = ACADEMIC_YEAR_START - 26;
const EXAM_YEAR_MIN = ACADEMIC_YEAR_START - 6;
const MAX_DOB_AGE = 28;
const DOB_MAX = new Date().toISOString().slice(0, 10);
const DOB_MIN = new Date(Date.now() - MAX_DOB_AGE * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10);
const AI_ENABLED = true;
const OTP_VERIFY_SECONDS = 600;
const OTP_RESET_SECONDS = 900;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

const FIXED_CHARGES = [
  { label: 'Uniform', amount: 6500 },
  { label: 'Medical fitness report', amount: 1000 },
];

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

const PROGRAMS = [
  {
    id: 'btech', name: 'B.Tech', level: 'UG', duration: '4 Years', entrance: 'IEMJEE',
    fees: [
      { label: 'Semester 1', amount: 140000 },
      { label: 'Semesters 2–8', amount: 115000 },
    ],
    streams: [
      { id: 'cse', name: 'Computer Science & Engineering', eligibility: { tenth: 80, twelfth: 80 }, booking: { appearing: 50000, passed: 140000 } },
      { id: 'cse-ai', name: 'Computer Science & Engineering (AI)', eligibility: { tenth: 70, twelfth: 70, pcm: 50 }, booking: { appearing: 50000, passed: 140000 } },
      { id: 'cse-aiml', name: 'Computer Science & Engineering (AI & ML)', eligibility: { tenth: 75, twelfth: 75, pcm: 50 }, booking: { appearing: 50000, passed: 140000 } },
      { id: 'cse-ds', name: 'Computer Science & Engineering (Data Science)', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: null },
      { id: 'ai-ds', name: 'Artificial Intelligence & Data Science', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: null },
      { id: 'iot', name: 'Internet of Things', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: null },
      { id: 'iot-bct', name: 'Internet of Things (CS & BCT)', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: null },
      { id: 'cyber', name: 'Cyber Security', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: null },
      { id: 'biotech', name: 'BioTechnology', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: null },
      { id: 'it', name: 'Information Technology', eligibility: { tenth: 70, twelfth: 70, pcm: 50 }, booking: { appearing: 50000, passed: 140000 } },
      { id: 'ece', name: 'Electronics & Communication Engineering', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: { appearing: 50000, passed: 140000 } },
      { id: 'ee', name: 'Electrical Engineering', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: { appearing: 50000, passed: 140000 } },
      { id: 'me', name: 'Mechanical Engineering', eligibility: { tenth: 60, twelfth: 60, pcm: 45 }, booking: { appearing: 50000, passed: 140000 } },
    ],
  },
  {
    id: 'bhm', name: 'BHM', level: 'UG', duration: '4 Years', entrance: 'IEMCET',
    fees: [{ label: 'Semester 1', amount: 60000 }, { label: 'Semesters 2–8', amount: 50000 }],
    streams: [{ id: 'bhm', name: 'Hospitality Management', eligibility: { tenth: 60, twelfth: 60 }, booking: { appearing: 50000, passed: 50000 } }],
  },
  {
    id: 'bba', name: 'BBA', level: 'UG', duration: '4 Years', entrance: 'IEMCET',
    fees: [{ label: 'Semester 1', amount: 70000 }, { label: 'Semesters 2–8', amount: 60000 }],
    streams: [{ id: 'bba', name: 'Business Administration', eligibility: { tenth: 60, twelfth: 60 }, booking: { appearing: 50000, passed: 50000 } }],
  },
  {
    id: 'bca', name: 'BCA', level: 'UG', duration: '4 Years', entrance: 'IEMCET',
    fees: [{ label: 'Semester 1', amount: 70000 }, { label: 'Semesters 2–8', amount: 60000 }],
    streams: [{ id: 'bca', name: 'Computer Applications', eligibility: { tenth: 60, twelfth: 60 }, note: 'Requires Maths / Business Maths / Computer in class 12', booking: { appearing: 50000, passed: 50000 } }],
  },
  {
    id: 'bba-llb', name: 'BBA LLB', level: 'UG', duration: '5 Years', entrance: 'IEMCET',
    fees: [{ label: 'Semester 1', amount: 60000 }, { label: 'Semesters 2–10', amount: 50000 }],
    streams: [{ id: 'bba-llb', name: 'Law (Integrated)', eligibility: { tenth: 60, twelfth: 60 }, booking: { appearing: 50000, passed: 50000 } }],
  },
  {
    id: 'mca', name: 'MCA', level: 'PG', duration: '2 Years', entrance: 'IEMCET',
    fees: [{ label: 'Semesters 1–4', amount: 75000 }],
    streams: [{ id: 'mca', name: 'Computer Applications', eligibility: { tenth: 60, twelfth: 60, graduation: 60 }, booking: { appearing: 77000, passed: 77000 } }],
  },
  {
    id: 'mba', name: 'MBA', level: 'PG', duration: '2 Years', entrance: 'CAT / MAT',
    fees: [{ label: 'Semesters 1–4', amount: 175000 }],
    streams: [{ id: 'mba', name: 'Business Administration', eligibility: { tenth: 55, twelfth: 55, graduation: 55 }, booking: { appearing: 162000, passed: 162000 } }],
  },
  {
    id: 'mba-gm', name: 'MBA (Global Management)', level: 'PG', duration: '2 Years', entrance: 'CAT / MAT',
    fees: [{ label: 'Semesters 1–4', amount: 175000 }],
    streams: [{ id: 'mba-gm', name: 'General Management', eligibility: { tenth: 55, twelfth: 55, graduation: 55 }, booking: { appearing: 162000, passed: 162000 } }],
  },
  {
    id: 'mtech', name: 'M.Tech', level: 'PG', duration: '2 Years', entrance: 'IEMCET',
    fees: [{ label: 'Semester 1', amount: 77000 }, { label: 'Semesters 2–4', amount: 75000 }],
    streams: [
      { id: 'mtech-cse', name: 'Computer Science & Engineering', eligibility: { tenth: 60, twelfth: 60, graduation: 60 }, booking: { appearing: 77000, passed: 77000 } },
      { id: 'mtech-aiml', name: 'Computer Science & Engineering (AI & ML)', eligibility: { tenth: 60, twelfth: 60, graduation: 60 }, booking: { appearing: 77000, passed: 77000 } },
      { id: 'mtech-ece', name: 'Electronics & Communication Engineering', eligibility: { tenth: 60, twelfth: 60, graduation: 60 }, booking: { appearing: 77000, passed: 77000 } },
    ],
  },
];

const PROGRAM_BY_ID = Object.fromEntries(PROGRAMS.map((program) => [program.id, program]));

const DOCUMENT_SLOTS = [
  { key: 'marksheet10', label: 'Class 10 Marksheet', required: true },
  { key: 'marksheet12', label: 'Class 12 Marksheet', required: true },
  { key: 'graduationMarksheet', label: 'Graduation Marksheet', requiredFor: 'PG' },
  { key: 'idProof', label: 'ID Proof (Aadhaar / Passport)', required: true },
  { key: 'photograph', label: 'Photograph', required: true },
  { key: 'categoryCertificate', label: 'Category Certificate', requiredForCategory: true },
];

const FORM_STEPS = [
  { key: 'personal', label: 'Course & Personal' },
  { key: 'address', label: 'Address' },
  { key: 'family', label: 'Family' },
  { key: 'citizenship', label: 'Citizenship' },
  { key: 'academics', label: 'Academics' },
  { key: 'other', label: 'Other Details' },
  { key: 'documents', label: 'Documents' },
  { key: 'review', label: 'Review & Submit' },
];

const APPLICATION_STATUSES = ['Draft', 'Submitted', 'Under Review', 'Correction Requested', 'Approved', 'Rejected', 'Admission Confirmed'];
const APPLICANT_VISIBLE_STATUSES = ['Submitted', 'Under Review', 'Correction Requested', 'Approved', 'Admission Confirmed'];

const features = [
  { title: 'Quality Education', description: 'Industry-focused curriculum with experienced faculty.', icon: '/assets/award.svg' },
  { title: 'Placement Support', description: 'Strong placement record with top recruiters.', icon: '/assets/briefcase.svg' },
  { title: 'Diverse Courses', description: 'Wide range of UG & PG programs to choose from.', icon: '/assets/book-open.svg' },
  { title: 'Modern Campus', description: 'State-of-the-art infrastructure and facilities.', icon: '/assets/map.svg' },
  { title: 'Holistic Development', description: 'Focus on overall growth through events & activities.', icon: '/assets/users.svg' },
];

const PUBLIC_LINKS = [
  { key: 'courses', label: 'Courses' },
  { key: 'process', label: 'Admission Process' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'contact', label: 'Contact Us' },
];

const APPLICANT_NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: SquaresFour },
  { key: 'application', label: 'Apply Now', icon: PencilSimple },
  { key: 'status', label: 'My Application', icon: Briefcase },
  { key: 'documents', label: 'Documents', icon: Folder },
  { key: 'payments', label: 'Payments', icon: CreditCard },
];

const ADMISSION_OFFICES = [
  { name: 'IEM Ashram Building', address: 'Ashram Building, GN-34/2, Sector V, Salt Lake, Kolkata 700091', phone: '8010700500 / 8069795500' },
  { name: 'UEM Building, New Town', address: 'University Area, Plot No. III, New Town, Kolkata 700160', phone: '8010700500' },
  { name: 'UEM Jaipur', address: 'Gurukul, Sikar Road, Jaipur, Rajasthan 303807', phone: '—' },
];

const FAQS = [
  { q: 'How do I apply for admission?', a: 'Create an account, verify it with the OTP sent to your email, then fill the multi-section application form. You can save drafts at any step and resume later. Once every mandatory field and document passes validation you can submit and receive a unique application number.' },
  { q: 'What is the eligibility for my course?', a: 'Eligibility differs by programme. Each programme page lists the minimum 10th, 12th, PCM and graduation percentages. For example, B.Tech CSE needs 10th and 12th at 80% or above; MBA needs 55% in 10th, 12th and graduation.' },
  { q: 'Which documents do I need to upload?', a: 'Class 10 and Class 12 marksheets, an ID proof, a photograph, a graduation marksheet for PG programmes, and a category certificate if your category is not General. Files must be PDF, JPG or PNG and no larger than 5 MB each.' },
  { q: 'What is the application fee?', a: 'There is no mandatory application fee. The booking / admission amount becomes payable after your application is approved. It depends on your course and whether you are a class-12 appearing or passed-out candidate.' },
  { q: 'How do I pay?', a: 'After approval, pay online through the hosted payment gateway (card, net banking or UPI) — we never see or store your card details — or by NEFT / Demand Draft, which an admission officer records against your application using the UTR / DD reference.' },
  { q: 'Can I edit my application after submitting?', a: 'Once submitted an application is locked. If an admission officer requests a correction, only the flagged sections unlock; fixing them and resubmitting returns the application to the Submitted state.' },
  { q: 'How will I know my status changed?', a: 'Your dashboard shows the live status and last-update date, and in-app notifications explain every event (submission, correction request, decision, payment) with a link to the relevant page.' },
  { q: 'Is the AI assistant making decisions about my admission?', a: 'No. The AI assistant is advisory only. It answers questions, recommends courses and pre-checks document quality, but it never decides an outcome or blocks your application.' },
];

const sanitize = (value) => (value == null ? '' : String(value).trim());
const has = (value) => sanitize(value) !== '';
const isTenDigit = (value) => /^\d{10}$/.test(sanitize(value));
const isSixDigit = (value) => /^\d{6}$/.test(sanitize(value));
const isPercent = (value) => value !== '' && value != null && Number(value) >= 0 && Number(value) <= 100;
const isYearInRange = (value, min, max) => {
  const n = Number(sanitize(value));
  return /^\d{4}$/.test(sanitize(value)) && n >= min && n <= max;
};
const isDobInRange = (value) => {
  const d = new Date(value);
  const min = new Date(DOB_MIN);
  const max = new Date(DOB_MAX);
  return value && !Number.isNaN(d.getTime()) && d >= min && d <= max;
};

const inr = (amount) => (amount == null ? '—' : `₹ ${amount.toLocaleString('en-IN')}`);

const formatDateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const maskSensitive = (value) => {
  const clean = sanitize(value);
  if (!clean || clean.length <= 4) return clean;
  return `${'•'.repeat(clean.length - 4)}${clean.slice(-4)}`;
};

const programById = (id) => PROGRAM_BY_ID[id];
const streamOf = (application) => {
  const program = programById(application?.programId);
  return program?.streams.find((stream) => stream.id === application?.streamId) || null;
};
const isPostgraduate = (application) => programById(application?.programId)?.level === 'PG';
const hideTwelfthSubjectMarks = (application) => ['bba', 'mba', 'mba-gm'].includes(application?.programId);

function requiredDocumentSlots(application) {
  const pg = isPostgraduate(application);
  return DOCUMENT_SLOTS.filter((slot) => slot.required
    || (slot.requiredFor === 'PG' && pg)
    || (slot.requiredForCategory && has(application?.category) && application.category !== 'General'));
}

function usePersistentState(baseKey, initial) {
  const storedKey = useRef(baseKey);
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(baseKey);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    if (storedKey.current !== baseKey) {
      storedKey.current = baseKey;
      setValue(() => {
        try {
          const raw = window.localStorage.getItem(baseKey);
          return raw ? JSON.parse(raw) : initial;
        } catch {
          return initial;
        }
      });
    }
  }, [baseKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    try {
      window.localStorage.setItem(storedKey.current, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [value]);
  return [value, setValue];
}

function nextApplicationNumber() {
  const year = new Date().getFullYear();
  let sequence = 0;
  try {
    sequence = Number(window.localStorage.getItem('iem-app-seq') || '0') + 1;
    window.localStorage.setItem('iem-app-seq', String(sequence));
  } catch {
    sequence = 1;
  }
  return `UEM-${year}-${String(sequence).padStart(5, '0')}`;
}

function nextReceiptNumber() {
  const year = new Date().getFullYear();
  let sequence = 0;
  try {
    sequence = Number(window.localStorage.getItem('iem-receipt-seq') || '0') + 1;
    window.localStorage.setItem('iem-receipt-seq', String(sequence));
  } catch {
    sequence = 1;
  }
  return `UEM-RCPT-${year}-${String(sequence).padStart(5, '0')}`;
}

function evaluateStep(stepKey, application) {
  switch (stepKey) {
    case 'personal':
      return has(application.fullName) && application.fullName.length <= 100
        && has(application.gender) && isDobInRange(application.dob) && has(application.email)
        && isTenDigit(application.mobile) && has(application.programId) && has(application.streamId);
    case 'address':
      return has(application.presentLine1) && isSixDigit(application.presentPIN)
        && (application.sameAsPresent === true || (has(application.permLine1) && isSixDigit(application.permPIN)));
    case 'family':
      return has(application.fatherName) && has(application.motherName)
        && has(application.guardianName) && has(application.guardianOffice) && has(application.monthlyIncome);
    case 'citizenship':
      if (application.isForeign === 'No') return true;
      return application.isForeign === 'Yes' && has(application.passportNo) && has(application.visaNo);
    case 'academics': {
      const base = has(application.admissionTest) && isYearInRange(application.examYear, EXAM_YEAR_MIN, ACADEMIC_YEAR_START) && has(application.registrationNo) && has(application.rank);
      const tenth = has(application.tenthExamName) && has(application.tenthBoard) && isYearInRange(application.tenthYear, OLDEST_PASSING_YEAR, ACADEMIC_YEAR_START) && isPercent(application.tenthPercent) && has(application.tenthSchool) && has(application.tenthSubjects);
      const twelfth = has(application.twelfthExamName) && has(application.twelfthBoard) && isYearInRange(application.twelfthYear, OLDEST_PASSING_YEAR, ACADEMIC_YEAR_START) && has(application.twelfthSchool) && has(application.twelfthSchoolAddress) && has(application.class12Status)
        && (application.class12Status === 'Appearing' || isPercent(application.twelfthPercent));
      const subjectMarks = hideTwelfthSubjectMarks(application) || application.class12Status !== 'Passed'
        || (isPercent(application.marks12English) && isPercent(application.marks12Physics) && isPercent(application.marks12ChemCS) && isPercent(application.marks12Maths));
      const degree = !isPostgraduate(application)
        || (has(application.degreeName) && has(application.degreeBoard) && isYearInRange(application.degreeYear, OLDEST_PASSING_YEAR, ACADEMIC_YEAR_START) && isPercent(application.degreePercent) && has(application.degreeInstitution) && has(application.degreeSubjects));
      return base && tenth && twelfth && subjectMarks && degree;
    }
    case 'other':
      return has(application.category) && has(application.abcId);
    case 'documents':
      return requiredDocumentSlots(application).every((slot) => application.documents?.[slot.key]?.status === 'uploaded');
    case 'review':
      return true;
    default:
      return true;
  }
}

function applicationProblems(application) {
  return FORM_STEPS.map((step) => ({ ...step, complete: evaluateStep(step.key, application), errors: getStepErrors(step.key, application) }));
}

function getStepErrors(stepKey, application) {
  const errors = [];
  switch (stepKey) {
    case 'personal':
      if (!has(application.programId)) errors.push('Programme is required');
      if (!has(application.streamId)) errors.push('Stream is required');
      if (!has(application.fullName)) errors.push('Full name is required');
      else if (application.fullName.length > 100) errors.push('Full name must be 100 characters or fewer');
      if (!has(application.gender)) errors.push('Gender is required');
      if (!has(application.dob)) errors.push('Date of birth is required');
      else if (!isDobInRange(application.dob)) errors.push(`Date of birth must be between ${DOB_MIN} and ${DOB_MAX}`);
      if (!has(application.email)) errors.push('Email is required');
      if (!isTenDigit(application.mobile)) errors.push('Mobile must be a 10-digit number');
      break;
    case 'address':
      if (!has(application.presentLine1)) errors.push('Present address line 1 is required');
      if (!isSixDigit(application.presentPIN)) errors.push('Present PIN must be a 6-digit code');
      if (application.sameAsPresent !== true) {
        if (!has(application.permLine1)) errors.push('Permanent address line 1 is required');
        if (!isSixDigit(application.permPIN)) errors.push('Permanent PIN must be a 6-digit code');
      }
      break;
    case 'family':
      if (!has(application.fatherName)) errors.push("Father's name is required");
      if (!has(application.motherName)) errors.push("Mother's name is required");
      if (!has(application.guardianName)) errors.push("Guardian's name is required");
      if (!has(application.guardianOffice)) errors.push('Guardian office address is required');
      if (!has(application.monthlyIncome)) errors.push('Monthly income is required');
      break;
    case 'citizenship':
      if (application.isForeign === 'Yes') {
        if (!has(application.passportNo)) errors.push('Passport number is required');
        if (!has(application.visaNo)) errors.push('Visa number is required');
      } else if (application.isForeign !== 'No') {
        errors.push('Select whether you are a foreign student');
      }
      break;
    case 'academics': {
      if (!has(application.admissionTest)) errors.push('Admission test is required');
      if (!isYearInRange(application.examYear, EXAM_YEAR_MIN, ACADEMIC_YEAR_START)) errors.push(`Exam year must be between ${EXAM_YEAR_MIN} and ${ACADEMIC_YEAR_START}`);
      if (!has(application.registrationNo)) errors.push('Registration number is required');
      if (!has(application.rank)) errors.push('Rank is required');
      if (!has(application.tenthExamName)) errors.push('Class 10 exam name is required');
      if (!has(application.tenthBoard)) errors.push('Class 10 board is required');
      if (!isYearInRange(application.tenthYear, OLDEST_PASSING_YEAR, ACADEMIC_YEAR_START)) errors.push(`Class 10 year must be between ${OLDEST_PASSING_YEAR} and ${ACADEMIC_YEAR_START}`);
      if (!isPercent(application.tenthPercent)) errors.push('Class 10 percentage must be 0–100');
      if (!has(application.tenthSchool)) errors.push('Class 10 school is required');
      if (!has(application.tenthSubjects)) errors.push('Class 10 subjects are required');
      if (!has(application.twelfthExamName)) errors.push('Class 12 exam name is required');
      if (!has(application.twelfthBoard)) errors.push('Class 12 board is required');
      if (!isYearInRange(application.twelfthYear, OLDEST_PASSING_YEAR, ACADEMIC_YEAR_START)) errors.push(`Class 12 year must be between ${OLDEST_PASSING_YEAR} and ${ACADEMIC_YEAR_START}`);
      if (!has(application.twelfthSchool)) errors.push('Class 12 school is required');
      if (!has(application.twelfthSchoolAddress)) errors.push('Class 12 school address is required');
      if (!has(application.class12Status)) errors.push('Class 12 status is required');
      if (application.class12Status === 'Passed' && !isPercent(application.twelfthPercent)) errors.push('Class 12 percentage must be 0–100');
      if (!hideTwelfthSubjectMarks(application) && application.class12Status === 'Passed') {
        if (!isPercent(application.marks12English)) errors.push('Class 12 English marks required');
        if (!isPercent(application.marks12Physics)) errors.push('Class 12 Physics marks required');
        if (!isPercent(application.marks12ChemCS)) errors.push('Class 12 Chemistry marks required');
        if (!isPercent(application.marks12Maths)) errors.push('Class 12 Maths marks required');
      }
      if (isPostgraduate(application)) {
        if (!has(application.degreeName)) errors.push('Degree name is required');
        if (!has(application.degreeBoard)) errors.push('Degree board/university is required');
        if (!isYearInRange(application.degreeYear, OLDEST_PASSING_YEAR, ACADEMIC_YEAR_START)) errors.push(`Degree year must be between ${OLDEST_PASSING_YEAR} and ${ACADEMIC_YEAR_START}`);
        if (!isPercent(application.degreePercent)) errors.push('Degree percentage must be 0–100');
        if (!has(application.degreeInstitution)) errors.push('Degree institution is required');
        if (!has(application.degreeSubjects)) errors.push('Degree subjects are required');
      }
      break;
    }
    case 'other':
      if (!has(application.category)) errors.push('Category is required');
      if (!has(application.abcId)) errors.push('ABC ID is required');
      break;
    case 'documents': {
      const missing = requiredDocumentSlots(application).filter((slot) => application.documents?.[slot.key]?.status !== 'uploaded');
      missing.forEach((slot) => errors.push(`${slot.label} not uploaded`));
      break;
    }
    default:
      break;
  }
  return errors;
}

function Brand({ compact = false, onHome }) {
  return (
    <a className={`brand${compact ? ' brand--compact' : ''}`} href="#home" aria-label="IEM Admissions home" onClick={(event) => { if (onHome) { event.preventDefault(); onHome(); } }}>
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

function PublicHeader({ onNavigate, active }) {
  return (
    <header className="public-header">
      <div className="brand-home" onClick={() => onNavigate('home')} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === 'Enter') onNavigate('home'); }}>
        <Brand />
      </div>
      <nav className="public-nav" aria-label="Main navigation">
        {PUBLIC_LINKS.map((item) => (
          <button
            className={active === item.key ? 'is-active' : ''}
            key={item.key}
            onClick={() => onNavigate(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>
      <button className="mobile-login" onClick={() => onNavigate('login')} type="button">Sign in</button>
    </header>
  );
}

function PublicShell({ onNavigate, active, children }) {
  return (
    <div className="public-page">
      <PublicHeader onNavigate={onNavigate} active={active} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}

function LandingPage({ onNavigate, onOpenAi }) {
  return (
    <div className="public-page" id="home">
      <PublicHeader onNavigate={onNavigate} active="home" />
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
              <button className="button button--outline button--small" onClick={() => onNavigate('courses')} type="button">
                View All Programs
              </button>
            </div>
            <div className="programs-grid">
              {PROGRAMS.slice(0, 4).map((program) => (
                <div className="program-card" key={program.id}>
                  <div className="program-header">
                    <span className={`program-badge${program.level === 'PG' ? ' program-badge--pg' : ''}`}>{program.level}</span>
                    <span className="program-duration">{program.duration}</span>
                  </div>
                  <h3>{program.name}</h3>
                  <p className="program-subtitle">
                    {program.streams.length} stream{program.streams.length > 1 ? 's' : ''} available · {program.entrance} entrance
                  </p>
                  <div className="program-details">
                    <div className="program-detail">
                      <span className="detail-label">Entrance</span>
                      <span className="detail-value">{program.entrance}</span>
                    </div>
                    <div className="program-detail">
                      <span className="detail-label">Semester 1 fee</span>
                      <span className="detail-value">{inr(program.fees[0].amount)}</span>
                    </div>
                    <div className="program-detail">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">{program.duration}</span>
                    </div>
                  </div>
                  <button className="program-apply" onClick={() => onNavigate('courses')} type="button">
                    Explore Program <ArrowRight size={16} />
                  </button>
                </div>
              ))}
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
              {features.map((feature) => (
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

        <section className="assistant-section">
          <div className="assistant-container">
            <div className="assistant-copy">
              <span className="assistant-tag"><Sparkle size={15} weight="fill" /> AI Admission Assistant</span>
              <h2>Not sure where to start?</h2>
              <p>Ask about eligibility, fees, deadlines and documents in plain language. The assistant is grounded in IEM's published admission information.</p>
            </div>
            <button className="assistant-prompt" onClick={onOpenAi} type="button">
              <span className="assistant-prompt__icon"><Robot size={26} weight="duotone" /></span>
              <span className="assistant-prompt__copy">
                <strong>Ask the admission assistant</strong>
                <small>AI-generated guidance · advisory only</small>
              </span>
              <ArrowRight className="assistant-prompt__arrow" size={18} />
            </button>
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

function CoursesPage({ onNavigate }) {
  return (
    <PublicShell onNavigate={onNavigate} active="courses">
      <section className="pub-hero">
        <div className="pub-container">
          <span className="pub-eyebrow">Programme catalogue · {ACADEMIC_YEAR}</span>
          <h1>Courses, eligibility &amp; fees</h1>
          <p>Every programme we offer, with its entrance route, minimum eligibility and published fees. Eligibility and fees are stored per academic year and never hard-coded into the form.</p>
        </div>
      </section>
      <section className="pub-section">
        <div className="pub-container">
          <div className="course-grid">
            {PROGRAMS.map((program) => (
              <article className="course-card" key={program.id}>
                <header className="course-card__head">
                  <div>
                    <span className={`program-badge${program.level === 'PG' ? ' program-badge--pg' : ''}`}>{program.level}</span>
                    <h2>{program.name}</h2>
                  </div>
                  <span className="program-duration">{program.duration} · {program.entrance}</span>
                </header>
                <div className="course-streams">
                  {program.streams.map((stream) => (
                    <div className="course-stream" key={stream.id}>
                      <div className="course-stream__title">
                        <strong>{stream.name}</strong>
                        {stream.note && <small>{stream.note}</small>}
                      </div>
                      <div className="course-elig">
                        <span>10th ≥ {stream.eligibility.tenth}%</span>
                        <span>12th ≥ {stream.eligibility.twelfth}%</span>
                        {stream.eligibility.pcm != null && <span>PCM ≥ {stream.eligibility.pcm}%</span>}
                        {stream.eligibility.graduation != null && <span>Graduation ≥ {stream.eligibility.graduation}%</span>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="course-card__foot">
                  <div className="course-fees">
                    {program.fees.map((fee) => (
                      <span key={fee.label}><small>{fee.label}</small><strong>{inr(fee.amount)}</strong></span>
                    ))}
                  </div>
                  <button className="button button--dark button--small" onClick={() => onNavigate('register')} type="button">
                    Apply <ArrowRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <p className="course-note">
            <Info size={15} /> Booking amounts are published for selected programmes only and depend on whether you are a class-12 appearing or passed-out candidate. Where no booking amount is published, it is shown during payment once your course is known.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}

function ProcessPage({ onNavigate }) {
  const officialSteps = [
    { title: 'Documents verification', copy: 'For newly allotted students, submit your academic and identity documents for verification.' },
    { title: 'Payment', copy: 'Candidates who take admission pay the applicable course / admission fee.' },
    { title: 'Documents submission', copy: 'Submit the offline admission form with your documents to obtain the PI report.' },
  ];
  const portalSteps = [
    'Register with your details and verify the email OTP.',
    'Sign in and fill the multi-section application form; save drafts any time.',
    'Upload the required documents into labelled slots.',
    'Preview everything, then submit to lock the form and receive an application number.',
    'The admission office reviews your application and verifies each document.',
    'If something needs fixing, only the flagged sections unlock.',
    'On approval, pay the booking / admission amount online or record a NEFT / DD payment.',
    'Your status becomes Admission Confirmed and a receipt is available to download.',
  ];
  return (
    <PublicShell onNavigate={onNavigate} active="process">
      <section className="pub-hero">
        <div className="pub-container">
          <span className="pub-eyebrow">How admission works</span>
          <h1>The admission process</h1>
          <p>We digitise the institute's existing admission process so you always know where you are. Here is the official sequence and how it maps to the portal.</p>
        </div>
      </section>
      <section className="pub-section">
        <div className="pub-container">
          <h2 className="pub-heading">Official admission steps</h2>
          <div className="step-cards">
            {officialSteps.map((step, index) => (
              <div className="step-card" key={step.title}>
                <span className="step-card__index">{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="pub-section pub-section--alt">
        <div className="pub-container">
          <h2 className="pub-heading">Your journey in the portal</h2>
          <ol className="process-list">
            {portalSteps.map((step, index) => (
              <li key={step}>
                <span className="process-list__marker">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <div className="process-cta">
            <div className="info-panel">
              <strong><Wallet size={16} /> Payment modes</strong>
              <p>NEFT, Demand Draft (in favour of <em>Institute of Engineering &amp; Management Trust</em>), net banking, credit / debit card, Google Pay and PhonePe. Online payments use a hosted gateway — we never store your card details.</p>
            </div>
            <div className="info-panel">
              <strong><MapPin size={16} /> Admission offices</strong>
              <p>Admission offices exist only at the IEM Ashram Building (Salt Lake), the UEM Building (New Town) and UEM Jaipur. Treat any other "office" asking for payment as fraud.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function FaqsPage({ onNavigate }) {
  const [open, setOpen] = useState(0);
  return (
    <PublicShell onNavigate={onNavigate} active="faqs">
      <section className="pub-hero">
        <div className="pub-container">
          <span className="pub-eyebrow">Questions &amp; answers</span>
          <h1>Frequently asked questions</h1>
          <p>Short answers to the questions applicants ask most. The AI assistant can also answer these in plain language.</p>
        </div>
      </section>
      <section className="pub-section">
        <div className="pub-container pub-container--narrow">
          <div className="faq-list">
            {FAQS.map((faq, index) => (
              <div className={`faq-item${open === index ? ' is-open' : ''}`} key={faq.q}>
                <button className="faq-item__q" onClick={() => setOpen(open === index ? -1 : index)} type="button">
                  <span>{faq.q}</span>
                  <CaretRight size={17} weight="bold" />
                </button>
                {open === index && <p className="faq-item__a">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function ContactPage({ onNavigate }) {
  return (
    <PublicShell onNavigate={onNavigate} active="contact">
      <section className="pub-hero">
        <div className="pub-container">
          <span className="pub-eyebrow">Get in touch</span>
          <h1>Contact the admissions office</h1>
          <p>Reach the official admission offices only. Never share payment details with anyone who contacts you claiming to represent IEM outside these channels.</p>
        </div>
      </section>
      <section className="pub-section">
        <div className="pub-container">
          <div className="contact-grid">
            {ADMISSION_OFFICES.map((office) => (
              <div className="contact-card" key={office.name}>
                <span className="contact-card__icon"><MapPin size={20} /></span>
                <h3>{office.name}</h3>
                <p>{office.address}</p>
                <span className="contact-card__meta"><Phone size={15} /> {office.phone}</span>
              </div>
            ))}
          </div>
          <div className="contact-direct">
            <div className="info-panel">
              <strong><ChatCircleDots size={16} /> Email</strong>
              <p><a href="mailto:admissions@iem.edu.in">admissions@iem.edu.in</a></p>
            </div>
            <div className="info-panel">
              <strong><Phone size={16} /> Phone</strong>
              <p><a href="tel:8010700500">8010700500</a> / <a href="tel:8069795500">8069795500</a></p>
            </div>
            <div className="info-panel info-panel--warn">
              <strong><Warning size={16} /> Fraud warning</strong>
              <p>Admission offices exist only at the three listed campuses. IEM never asks for payment to a personal account.</p>
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}

function AuthShell({ children, onNavigate }) {
  return (
    <div className="auth-page">
      <PublicHeader onNavigate={onNavigate} />
      <main className="auth-layout">{children}</main>
      <Footer />
    </div>
  );
}

function Field({ label, icon: Icon, hint, wide = false, ...inputProps }) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span className="field__label">{label}</span>
      <span className="field__control">
        {Icon && <Icon size={17} weight="regular" aria-hidden="true" />}
        <input {...inputProps} />
      </span>
      {hint && <small className="field__hint">{hint}</small>}
    </label>
  );
}

function SelectField({ label, name, value, onChange, options, placeholder, required, wide = false, hint }) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span className="field__label">{label}</span>
      <span className="select-control">
        <select name={name} value={value ?? ''} onChange={onChange} required={required}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => {
            const optionValue = typeof option === 'string' ? option : option.value;
            const optionLabel = typeof option === 'string' ? option : option.label;
            return <option key={optionValue} value={optionValue}>{optionLabel}</option>;
          })}
        </select>
        <CaretDown size={16} />
      </span>
      {hint && <small className="field__hint">{hint}</small>}
    </label>
  );
}

function TextArea({ label, name, value, onChange, wide = false, hint, ...props }) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span className="field__label">{label}</span>
      <textarea name={name} value={value ?? ''} onChange={onChange} {...props} />
      {hint && <small className="field__hint">{hint}</small>}
    </label>
  );
}

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

function RegistrationPage({ onNavigate, onRegistered }) {
  const [password, setPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const passwordReady = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onRegistered({
      fullName: sanitize(form.get('fullName')),
      email: sanitize(form.get('email')),
      countryCode: sanitize(form.get('countryCode')) || '+91',
      mobile: sanitize(form.get('mobile')),
    });
  };
  return (
    <AuthShell onNavigate={onNavigate}>
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
        <form className="auth-form" onSubmit={submit}>
          <Field label="Full Name" name="fullName" placeholder="Enter your full name" autoComplete="name" icon={User} maxLength={100} required />
          <Field label="Email Address" name="email" placeholder="Enter your email address" type="email" autoComplete="email" icon={ChatCircleDots} required />
          <div className="field-row-phone">
            <SelectField label="Country code" name="countryCode" options={COUNTRY_CODES} value={countryCode} onChange={(event) => setCountryCode(event.target.value)} required />
            <Field label="Mobile Number" name="mobile" placeholder="10-digit mobile number" type="tel" inputMode="numeric" pattern="[0-9]{10}" autoComplete="tel-national" icon={MapPin} required />
          </div>
          <Field label="Password" name="password" placeholder="Create a password" type="password" autoComplete="new-password" icon={LockKey} value={password} onChange={(event) => setPassword(event.target.value)} required />
          <PasswordRules password={password} />
          <label className="consent-row"><input type="checkbox" required /><span>I agree to the <a href="#terms">terms and conditions</a> and consent to the use of my information for admission processing.</span></label>
          <button className="button button--dark button--full" disabled={!passwordReady} type="submit">Create account <ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">Already have an account? <button onClick={() => onNavigate('login')} type="button">Sign in</button></p>
      </section>
    </AuthShell>
  );
}

function LoginPage({ onNavigate, onLogin }) {
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const identifier = sanitize(form.get('identifier'));
    const password = sanitize(form.get('password'));
    if (!identifier || !password) {
      setError('Incorrect email / phone or password.');
      return;
    }
    const name = identifier.includes('@')
      ? identifier.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Applicant';
    onLogin({ fullName: name, email: identifier.includes('@') ? identifier : '', mobile: identifier.includes('@') ? '' : identifier });
  };
  return (
    <AuthShell onNavigate={onNavigate}>
      <section className="login-aside">
        <h1>Pick up where<br />you left off.</h1>
        <p>Sign in to continue your application, check documents or see the latest status.</p>
        <img src="/assets/hero-campus-illustration.png" alt="IEM Kolkata campus" />
      </section>
      <section className="auth-card auth-card--login">
        <div className="auth-card__heading">
          <h2>Welcome back</h2>
          <p>Sign in with your email or mobile number.</p>
        </div>
        <form className="auth-form" onSubmit={submit}>
          <Field label="Email or Mobile" name="identifier" placeholder="you@example.com or 10-digit mobile" autoComplete="username" icon={User} required />
          <Field label="Password" name="password" placeholder="Enter your password" type="password" autoComplete="current-password" icon={LockKey} required />
          <div className="form-meta"><label><input type="checkbox" /> Remember me</label><button onClick={() => onNavigate('forgot')} type="button">Forgot password?</button></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button--dark button--full" type="submit">Sign in <ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">New to IEM admissions? <button onClick={() => onNavigate('register')} type="button">Create account</button></p>
        <div className="secure-label"><LockKey size={14} /> Wrong email and wrong password show the same message.</div>
      </section>
    </AuthShell>
  );
}

function OtpInputs({ digits, onChange }) {
  const updateDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    onChange(updated);
    if (digit) document.getElementById(`otp-${index + 1}`)?.focus();
  };
  return (
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
  );
}

function useCountdown(initial) {
  const [seconds, setSeconds] = useState(initial);
  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((remaining) => Math.max(remaining - 1, 0)), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const label = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return [seconds, label, setSeconds];
}

function OtpPage({ onNavigate, onVerified, mobile }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [seconds, formatted, setSeconds] = useCountdown(OTP_VERIFY_SECONDS);

  const verify = (event) => {
    event.preventDefault();
    if (digits.some((digit) => !digit)) {
      setMessage('Enter all six digits to continue.');
      return;
    }
    onVerified();
  };
  return (
    <main className="otp-stage">
      <section className="otp-card">
        <button className="back-link" onClick={() => onNavigate('register')} type="button"><ArrowLeft size={16} /> Back to registration</button>
        <span className="otp-icon"><EnvelopeSimple size={22} /></span>
        <h1>Verify your account</h1>
        <p className="otp-copy">We’ve sent a one-time code valid for 10 minutes to</p>
        <strong className="otp-phone">{mobile ? `+91 XXXXX ${mobile.slice(-5)}` : 'your email address'}</strong>
        <form onSubmit={verify}>
          <label className="otp-label">Enter OTP</label>
          <OtpInputs digits={digits} onChange={setDigits} />
          <p className="otp-countdown">{seconds ? `OTP expires in ${formatted}` : 'Code expired. Request a new one.'}</p>
          {message && <p className="form-error" role="alert">{message}</p>}
          <button className="button button--charcoal button--full" type="submit">Verify &amp; Continue</button>
        </form>
        <button className="resend-button" onClick={() => { setSeconds(OTP_VERIFY_SECONDS); setDigits(['', '', '', '', '', '']); setMessage('A new code has been sent.'); }} type="button">Resend OTP</button>
      </section>
    </main>
  );
}

function ForgotPasswordPage({ onNavigate }) {
  const [stage, setStage] = useState('request');
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [seconds, formatted, setSeconds] = useCountdown(OTP_RESET_SECONDS);
  const passwordReady = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);

  const requestReset = (event) => {
    event.preventDefault();
    const email = sanitize(new FormData(event.currentTarget).get('email'));
    if (!email) { setMessage('Enter the email address registered with your account.'); return; }
    setMessage('');
    setStage('verify');
    setSeconds(OTP_RESET_SECONDS);
  };
  const resetPassword = (event) => {
    event.preventDefault();
    if (digits.some((digit) => !digit)) { setMessage('Enter all six digits to continue.'); return; }
    if (!passwordReady) { setMessage('Your new password does not meet the requirements.'); return; }
    setMessage('');
    setStage('done');
  };
  return (
    <main className="otp-stage">
      <section className="otp-card">
        <button className="back-link" onClick={() => onNavigate('login')} type="button"><ArrowLeft size={16} /> Back to sign in</button>
        <span className="otp-icon"><LockKey size={22} /></span>
        {stage === 'request' && (
          <>
            <h1>Forgot your password?</h1>
            <p className="otp-copy">Enter your registered email and we will send a reset code valid for 15 minutes. Signing out all sessions happens on success.</p>
            <form onSubmit={requestReset}>
              <Field label="Email Address" name="email" placeholder="you@example.com" type="email" autoComplete="email" icon={ChatCircleDots} required />
              {message && <p className="form-error" role="alert">{message}</p>}
              <button className="button button--charcoal button--full" style={{ marginTop: '18px' }} type="submit">Send reset code</button>
            </form>
          </>
        )}
        {stage === 'verify' && (
          <>
            <h1>Set a new password</h1>
            <p className="otp-copy">Enter the code we emailed you and choose a new password.</p>
            <form onSubmit={resetPassword}>
              <label className="otp-label">Reset code</label>
              <OtpInputs digits={digits} onChange={setDigits} />
              <p className="otp-countdown">Code expires in {formatted}</p>
              <Field label="New Password" name="password" placeholder="Create a new password" type="password" autoComplete="new-password" icon={LockKey} value={password} onChange={(event) => setPassword(event.target.value)} required />
              <PasswordRules password={password} />
              {message && <p className="form-error" role="alert">{message}</p>}
              <button className="button button--charcoal button--full" style={{ marginTop: '14px' }} type="submit">Reset password</button>
            </form>
          </>
        )}
        {stage === 'done' && (
          <div className="otp-success">
            <CheckCircle size={40} weight="duotone" />
            <h1>Password updated</h1>
            <p className="otp-copy">All existing sessions were signed out. Sign in with your new password.</p>
            <button className="button button--charcoal button--full" style={{ marginTop: '14px' }} onClick={() => onNavigate('login')} type="button">Back to sign in</button>
          </div>
        )}
      </section>
    </main>
  );
}

function NotificationsPanel({ items, onOpen, onClose, onMarkAllRead }) {
  return (
    <div className="notif-panel" role="dialog" aria-label="Notifications">
      <div className="notif-panel__head">
        <strong>Notifications</strong>
        <div className="notif-panel__actions">
          <button onClick={onMarkAllRead} type="button">Mark all read</button>
          <button aria-label="Close notifications" onClick={onClose} type="button"><X size={15} /></button>
        </div>
      </div>
      <div className="notif-panel__list">
        {items.length === 0 && <p className="notif-empty">No notifications yet. Updates about your application will appear here.</p>}
        {items.map((item) => (
          <button className={`notif-item${item.read ? '' : ' is-unread'}`} key={item.id} onClick={() => onOpen(item)} type="button">
            <span className={`notif-item__dot notif-item__dot--${item.type}`} />
            <span className="notif-item__body">
              <span>{item.message}</span>
              <small>{formatDateTime(item.at)}</small>
            </span>
            <CaretRight size={14} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Sidebar({ active, onNavigate }) {
  return (
    <aside className="app-sidebar">
      <nav aria-label="Applicant navigation">
        {APPLICANT_NAV.map(({ key, label, icon: Icon }) => (
          <button className={`sidebar-link${active === key ? ' sidebar-link--active' : ''}`} key={key} onClick={() => onNavigate(key)} type="button">
            <Icon size={18} weight="regular" /><span>{label}</span>
          </button>
        ))}
        <p className="sidebar-label">ACCOUNT</p>
        <button className={`sidebar-link${active === 'profile' ? ' sidebar-link--active' : ''}`} onClick={() => onNavigate('profile')} type="button"><User size={18} /><span>Profile</span></button>
        <button className="sidebar-link" onClick={() => onNavigate('logout')} type="button"><SignOut size={18} /><span>Logout</span></button>
      </nav>
      <div className="sidebar-help"><strong>Need Help?</strong><p>Contact our support team for assistance.</p><a href="mailto:admissions@iem.edu.in">Contact Us</a></div>
    </aside>
  );
}

function ApplicantLayout({ active, onNavigate, applicantName, notifications, onReadNotification, onMarkAllRead, children }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const unread = notifications.filter((item) => !item.read).length;
  const openNotification = (item) => {
    onReadNotification(item.id);
    setShowNotifications(false);
    onNavigate(item.link || 'dashboard');
  };
  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand compact onHome={() => onNavigate('dashboard')} />
        <div className="app-header__tools">
          <div className="notif-wrap">
            <button aria-label={`Notifications (${unread} unread)`} onClick={() => setShowNotifications((value) => !value)} type="button">
              <Bell size={18} />
              {unread > 0 && <span className="notif-dot">{unread}</span>}
            </button>
            {showNotifications && (
              <NotificationsPanel items={notifications} onOpen={openNotification} onClose={() => setShowNotifications(false)} onMarkAllRead={onMarkAllRead} />
            )}
          </div>
          <span className="user-chip"><span className="user-chip__avatar"><User size={16} /></span>{applicantName}</span>
        </div>
      </header>
      <div className="app-body app-body--wide">
        <Sidebar active={active} onNavigate={onNavigate} />
        <main className="application-main">{children}</main>
      </div>
      <Footer className="app-footer" />
    </div>
  );
}

function StatusBadge({ status }) {
  const tone = {
    Draft: 'neutral', Submitted: 'info', 'Under Review': 'warning', 'Correction Requested': 'warning',
    Approved: 'success', Rejected: 'danger', 'Admission Confirmed': 'success',
  }[status] || 'neutral';
  return <span className={`status-badge status-badge--${tone}`}>{status}</span>;
}

function StatusTimeline({ status }) {
  const reached = APPLICATION_STATUSES.indexOf(status);
  const visible = ['Draft', 'Submitted', 'Under Review', 'Approved', 'Admission Confirmed'];
  return (
    <ol className="status-timeline">
      {visible.map((label) => {
        const index = APPLICATION_STATUSES.indexOf(label);
        const state = index < reached ? 'done' : index === reached ? 'current' : 'todo';
        return (
          <li className={`status-node status-node--${state}`} key={label}>
            <span className="status-node__marker">{state === 'done' ? <Check size={13} weight="bold" /> : <Clock size={13} weight="bold" />}</span>
            <span className="status-node__label">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function DashboardPage({ application, onNavigate, notifications }) {
  const status = application.status || 'Draft';
  const program = programById(application.programId);
  const stream = streamOf(application);
  const hasApplication = Boolean(application.programId || application.status);
  const lastUpdate = application.statusChangedAt || application.submittedAt || application.updatedAt;
  return (
    <>
      <div className="dashboard-title">
        <div>
          <h1>Dashboard</h1>
          <p>{hasApplication ? `Application ${application.applicationNo || '(draft)'} · last updated ${formatDateTime(lastUpdate)}` : 'Start your admission application for 2026-27.'}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="dashboard-grid">
        <section className="dash-card dash-card--status">
          <div className="dash-card__head"><h2>Application status</h2><button className="text-link" onClick={() => onNavigate('status')} type="button">View details <ArrowRight size={14} /></button></div>
          {hasApplication ? (
            <>
              <StatusTimeline status={status} />
              <div className="dash-meta">
                <div><span>Programme</span><strong>{program ? program.name : 'Not selected'}</strong></div>
                <div><span>Stream</span><strong>{stream ? stream.name : 'Not selected'}</strong></div>
                <div><span>Application no.</span><strong>{application.applicationNo || '— issued on submit'}</strong></div>
                <div><span>Submitted on</span><strong>{formatDateTime(application.submittedAt)}</strong></div>
              </div>
            </>
          ) : (
            <div className="dash-empty">
              <p>You have not started an application yet. Filling the form takes about 20 minutes and saves as you go.</p>
              <button className="button button--dark button--small" onClick={() => onNavigate('application')} type="button">Start application <ArrowRight size={15} /></button>
            </div>
          )}
        </section>

        <section className="dash-card">
          <div className="dash-card__head"><h2>Quick actions</h2></div>
          <div className="quick-actions">
            <button onClick={() => onNavigate('application')} type="button"><PencilSimple size={18} /><span><strong>Apply Now</strong><small>Fill or resume the form</small></span><CaretRight size={15} /></button>
            <button onClick={() => onNavigate('documents')} type="button"><Folder size={18} /><span><strong>Documents</strong><small>Upload or review files</small></span><CaretRight size={15} /></button>
            <button onClick={() => onNavigate('payments')} type="button"><CreditCard size={18} /><span><strong>Payments</strong><small>Fees and receipts</small></span><CaretRight size={15} /></button>
            <button onClick={() => onNavigate('profile')} type="button"><User size={18} /><span><strong>Profile</strong><small>Account and consent</small></span><CaretRight size={15} /></button>
          </div>
        </section>

        <section className="dash-card dash-card--wide">
          <div className="dash-card__head"><h2>Recent notifications</h2><button className="text-link" onClick={() => onNavigate('status')} type="button">See all <ArrowRight size={14} /></button></div>
          {notifications.length === 0 ? <p className="dash-empty-text">No updates yet.</p> : (
            <ul className="dash-notifications">
              {notifications.slice(0, 4).map((item) => (
                <li className={item.read ? '' : 'is-unread'} key={item.id}>
                  <span>{item.message}</span><small>{formatDateTime(item.at)}</small>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function DocumentsPanel({ application, setApplication, readOnly = false, showHeading = true }) {
  const [errors, setErrors] = useState({});
  const required = requiredDocumentSlots(application);

  const upload = (slotKey, file) => {
    if (!file) return;
    if (!ALLOWED_MIME.includes(file.type)) {
      setErrors((current) => ({ ...current, [slotKey]: 'Only PDF, JPG or PNG files are allowed.' }));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrors((current) => ({ ...current, [slotKey]: 'This file is larger than 5 MB.' }));
      return;
    }
    setErrors((current) => ({ ...current, [slotKey]: '' }));
    setApplication((current) => ({
      ...current,
      documents: { ...(current.documents || {}), [slotKey]: { name: file.name, size: file.size, type: file.type, status: 'uploading', progress: 0 } },
      updatedAt: new Date().toISOString(),
    }));
    let progress = 0;
    const timer = window.setInterval(() => {
      progress += 20;
      setApplication((current) => {
        const doc = current.documents?.[slotKey];
        if (!doc) { window.clearInterval(timer); return current; }
        return {
          ...current,
          documents: { ...current.documents, [slotKey]: { ...doc, progress, status: progress >= 100 ? 'uploaded' : 'uploading' } },
        };
      });
      if (progress >= 100) window.clearInterval(timer);
    }, 140);
  };

  const remove = (slotKey) => setApplication((current) => {
    const documents = { ...(current.documents || {}) };
    delete documents[slotKey];
    return { ...current, documents };
  });

  return (
    <div className="doc-panel">
      {showHeading && (
        <div className="doc-panel__head">
          <h2>Upload documents</h2>
          <p>PDF, JPG or PNG · max 5 MB each · one file per slot. The server re-checks every file before it is stored.</p>
        </div>
      )}
      <div className="doc-slots">
        {DOCUMENT_SLOTS.map((slot) => {
          const doc = application.documents?.[slot.key];
          const isRequired = required.some((item) => item.key === slot.key);
          const conditional = !slot.required && isRequired;
          return (
            <div className="doc-slot" key={slot.key}>
              <div className="doc-slot__row">
                <span className={`doc-slot__icon${doc?.status === 'uploaded' ? ' is-done' : ''}`}>
                  {doc?.status === 'uploaded' ? <Check size={16} weight="bold" /> : <FileText size={16} />}
                </span>
                <div className="doc-slot__meta">
                  <strong>{slot.label}{isRequired && <span className="req-star"> *</span>}{conditional && <small className="doc-slot__cond"> (conditional)</small>}</strong>
                  {doc ? <small>{doc.name} · {(doc.size / 1024).toFixed(0)} KB{readOnly ? '' : ' · replace anytime'}</small> : <small>{isRequired ? 'Required' : 'Optional'}</small>}
                </div>
                {!readOnly && (
                  <div className="doc-slot__actions">
                    <label className="doc-upload-btn">
                      <input type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={(event) => { upload(slot.key, event.target.files?.[0]); event.target.value = ''; }} hidden />
                      {doc ? 'Replace' : 'Upload'} <UploadSimple size={14} />
                    </label>
                    {doc && <button className="doc-remove" aria-label={`Remove ${slot.label}`} onClick={() => remove(slot.key)} type="button"><TrashSimple size={15} /></button>}
                  </div>
                )}
              </div>
              {doc?.status === 'uploading' && (
                <div className="doc-progress"><span style={{ width: `${doc.progress}%` }} /></div>
              )}
              {errors[slot.key] && <p className="form-error">{errors[slot.key]}</p>}
            </div>
          );
        })}
      </div>
      <div className="ai-advisory">
        <Sparkle size={15} weight="fill" />
        <span><strong>AI document pre-check (advisory):</strong> the assistant can flag blurry, badly lit or cropped scans. This never blocks submission.</span>
      </div>
    </div>
  );
}

function ReviewGroup({ title, stepIndex, rows, onEdit }) {
  const hasMissing = rows.some((row) => !row.value);
  return (
    <div className={`review-group${hasMissing ? ' review-group--has-errors' : ''}`}>
      <div className="review-group__head">
        <h3>{hasMissing && <Warning size={14} className="review-group__warn" />} {title}</h3>
        <button className="text-link" onClick={() => onEdit(stepIndex)} type="button"><PencilSimple size={14} /> Edit</button>
      </div>
      <div className="review-group__rows">
        {rows.map((row) => (
          <div key={row.label} className={!row.value ? 'review-row--missing' : ''}>
            <span>{row.label}{row.required ? <em className="review-required" aria-label="required"> *</em> : null}</span>
            <strong>{row.value || <em className="review-missing-tag">Missing</em>}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function ApplicationPage({ onNavigate, applicantName, application, setApplication, notify }) {
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const update = (event) => setApplication((current) => {
    const { name, value } = event.target;
    const next = { ...current, [name]: value, updatedAt: new Date().toISOString() };
    if (current.sameAsPresent && name.startsWith('present')) {
      next[`perm${name.slice('present'.length)}`] = value;
    }
    return next;
  });
  const updateCheckbox = (event) => setApplication((current) => ({ ...current, [event.target.name]: event.target.checked, updatedAt: new Date().toISOString() }));

  const program = programById(application.programId);
  const stream = streamOf(application);
  const pg = isPostgraduate(application);
  const hideSubjectMarks = hideTwelfthSubjectMarks(application);
  const categoryNeedsCertificate = has(application.category) && application.category !== 'General';
  const steps = useMemo(() => applicationProblems(application), [application]);
  const allComplete = steps.every((item) => item.complete);
  const locked = ['Submitted', 'Under Review', 'Approved', 'Rejected', 'Admission Confirmed'].includes(application.status);

  useEffect(() => {
    if (application.sameAsPresent) {
      setApplication((current) => ({
        ...current,
        permLine1: current.presentLine1 || '',
        permLine2: current.presentLine2 || '',
        permPO: current.presentPO || '',
        permDistrict: current.presentDistrict || '',
        permState: current.presentState || '',
        permPIN: current.presentPIN || '',
      }));
    }
  }, [application.sameAsPresent, setApplication]);

  useEffect(() => {
    if (program && !program.streams.some((item) => item.id === application.streamId)) {
      setApplication((current) => ({ ...current, streamId: '' }));
    }
  }, [program, application.streamId, setApplication]);

  const saveDraft = () => {
    setApplication((current) => ({ ...current, status: current.status || 'Draft', updatedAt: new Date().toISOString() }));
    setNotice('Draft saved with a timestamp. You can return to it after signing in.');
    window.setTimeout(() => setNotice(''), 3500);
  };

  const submit = () => {
    if (!allComplete) {
      setReviewError('Complete every section before submitting.');
      return;
    }
    const applicationNo = nextApplicationNumber();
    const now = new Date().toISOString();
    setApplication((current) => ({
      ...current,
      status: 'Submitted',
      applicationNo,
      submittedAt: now,
      statusChangedAt: now,
      flaggedSections: [],
    }));
    notify(`Application ${applicationNo} submitted and locked. We will review it shortly.`, { type: 'success', link: 'status' });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="submit-success">
        <span className="submit-success__icon"><SealCheck size={34} weight="duotone" /></span>
        <h1>Application submitted</h1>
        <p>Your application is now locked and under review. Keep this application number safe — it is also sent to your registered email.</p>
        <div className="submit-success__number">{application.applicationNo}</div>
        <div className="submit-success__actions">
          <button className="button button--dark" onClick={() => onNavigate('status')} type="button">Track status <ArrowRight size={16} /></button>
          <button className="button button--outline" onClick={() => onNavigate('payments')} type="button">View fees</button>
        </div>
      </div>
    );
  }

  if (locked && application.status !== 'Correction Requested') {
    return (
      <>
        <div className="application-title-row">
          <div><h1>Admission Application Form</h1><p>This application has been submitted and is locked for editing.</p></div>
          <StatusBadge status={application.status} />
        </div>
        <div className="locked-card">
          <span className="locked-card__icon"><LockKey size={26} weight="duotone" /></span>
          <h2>Application {application.applicationNo}</h2>
          <p>Submitted on {formatDateTime(application.submittedAt)}. Editing is disabled after submission. If the admission office requests a correction, only the flagged sections reopen.</p>
          <div className="locked-card__actions">
            <button className="button button--dark" onClick={() => onNavigate('status')} type="button">Track status <ArrowRight size={16} /></button>
            <button className="button button--outline" onClick={() => onNavigate('documents')} type="button">View documents</button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="application-title-row">
        <div><h1>Admission Application Form</h1><p>Fill in your details carefully. Sections that don't apply to your course are hidden automatically.</p></div>
        <button className="button button--outline button--draft" onClick={saveDraft} type="button"><FileText size={16} /> Save as Draft</button>
      </div>
      {application.status === 'Correction Requested' && (
        <p className="app-alert app-alert--warning" role="status"><Warning size={15} /> A correction was requested on: {application.flaggedSections?.join(', ') || 'flagged sections'}. Fix these and resubmit.</p>
      )}
      {notice && <p className="inline-notice" role="status">{notice}</p>}

      <Stepper current={step} labels={FORM_STEPS.map((item) => item.label)} />

      <form className="application-form" onSubmit={(event) => { event.preventDefault(); if (step < FORM_STEPS.length - 1) setStep(step + 1); else submit(); }}>
        <div className="application-form__heading"><h2>{FORM_STEPS[step].label}</h2><span>Step {step + 1} of {FORM_STEPS.length}</span></div>

        {step === 0 && <>
          <div className="form-section">
            <h3 className="form-section__title"><Briefcase size={20} /> Program selection</h3>
            <p className="form-section__subtitle">Choose exactly one course and one stream. Level, eligibility and fees come from the course catalogue.</p>
            <div className="form-grid">
              <SelectField label="Program *" name="programId" value={application.programId} onChange={update} placeholder="Select program" options={PROGRAMS.map((item) => ({ value: item.id, label: `${item.name} (${item.level} · ${item.duration})` }))} required />
              <Field label="Level" name="levelDisplay" value={program?.level || ''} placeholder="Auto from program" readOnly />
              <SelectField label="Stream *" name="streamId" value={application.streamId} onChange={update} placeholder={program ? 'Select stream' : 'Select a program first'} options={program ? program.streams.map((item) => ({ value: item.id, label: item.name })) : []} required />
              <Field label="Academic Session" name="session" value={ACADEMIC_YEAR} readOnly icon={CalendarBlank} />
            </div>
            {stream && (
              <div className="eligibility-note">
                <Info size={15} />
                <span>
                  <strong>Eligibility:</strong> 10th ≥ {stream.eligibility.tenth}% · 12th ≥ {stream.eligibility.twelfth}%
                  {stream.eligibility.pcm != null && <> · PCM ≥ {stream.eligibility.pcm}%</>}
                  {stream.eligibility.graduation != null && <> · Graduation ≥ {stream.eligibility.graduation}%</>}
                  {stream.note && <> · {stream.note}</>}
                </span>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3 className="form-section__title"><User size={20} /> Candidate details</h3>
            <div className="form-grid">
              <Field label="Full Name *" name="fullName" hint="In full — initials and titles such as Mr, Ms are not allowed." placeholder="Enter your full name" value={application.fullName || ''} onChange={update} icon={User} maxLength={100} required />
              <SelectField label="Gender *" name="gender" value={application.gender} onChange={update} placeholder="Select gender" options={['Male', 'Female']} required />
              <Field label="Date of Birth *" name="dob" type="date" min={DOB_MIN} max={DOB_MAX} value={application.dob || ''} onChange={update} icon={CalendarBlank} required />
              <Field label="Email Address *" name="email" placeholder="Enter your email" type="email" value={application.email || ''} onChange={update} required />
              <Field label="Student Mobile *" name="mobile" placeholder="10-digit mobile number" type="tel" inputMode="numeric" pattern="[0-9]{10}" value={application.mobile || ''} onChange={update} icon={MapPin} required />
              <SelectField label="Reservation Category *" name="category" value={application.category} onChange={update} placeholder="Select category" options={['General', 'OBC', 'SC', 'ST', 'EWS']} required />
            </div>
          </div>
        </>}

        {step === 1 && <>
          <div className="form-section">
            <h3 className="form-section__title"><House size={20} /> Present address</h3>
            <div className="form-grid">
              <TextArea label="Address line 1 *" name="presentLine1" placeholder="House / street" value={application.presentLine1 || ''} onChange={update} required />
              <TextArea label="Address line 2" name="presentLine2" placeholder="Area / locality" value={application.presentLine2 || ''} onChange={update} />
              <Field label="P.O." name="presentPO" placeholder="Post office" value={application.presentPO || ''} onChange={update} />
              <Field label="District" name="presentDistrict" placeholder="District" value={application.presentDistrict || ''} onChange={update} />
              <Field label="State" name="presentState" placeholder="State" value={application.presentState || ''} onChange={update} />
              <Field label="PIN Code *" name="presentPIN" placeholder="6-digit PIN" type="text" inputMode="numeric" pattern="[0-9]{6}" value={application.presentPIN || ''} onChange={update} />
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section__title"><MapPin size={20} /> Permanent address</h3>
            <label className="consent-row" style={{ marginBottom: '16px' }}>
              <input type="checkbox" name="sameAsPresent" checked={application.sameAsPresent === true} onChange={updateCheckbox} />
              <span>Same as present address</span>
            </label>
            <div className="form-grid">
              <TextArea label={`Address line 1${application.sameAsPresent ? '' : ' *'}`} name="permLine1" placeholder="House / street" value={application.permLine1 || ''} onChange={update} disabled={application.sameAsPresent} />
              <TextArea label="Address line 2" name="permLine2" placeholder="Area / locality" value={application.permLine2 || ''} onChange={update} disabled={application.sameAsPresent} />
              <Field label="P.O." name="permPO" placeholder="Post office" value={application.permPO || ''} onChange={update} disabled={application.sameAsPresent} />
              <Field label="District" name="permDistrict" placeholder="District" value={application.permDistrict || ''} onChange={update} disabled={application.sameAsPresent} />
              <Field label="State" name="permState" placeholder="State" value={application.permState || ''} onChange={update} disabled={application.sameAsPresent} />
              <Field label={`PIN Code${application.sameAsPresent ? '' : ' *'}`} name="permPIN" placeholder="6-digit PIN" type="text" inputMode="numeric" pattern="[0-9]{6}" value={application.permPIN || ''} onChange={update} disabled={application.sameAsPresent} />
            </div>
          </div>
        </>}

        {step === 2 && <>
          <div className="form-section">
            <h3 className="form-section__title"><Users size={20} /> Family &amp; guardian</h3>
            <p className="form-section__subtitle">Names are entered in full, with no initials or titles.</p>
            <div className="form-subsection">
              <span className="form-subsection__title">Father</span>
              <div className="form-grid">
                <Field label="Father's Name *" name="fatherName" placeholder="Father's full name" value={application.fatherName || ''} onChange={update} maxLength={100} required />
                <Field label="Father's Email" name="fatherEmail" placeholder="Father's email address" type="email" value={application.fatherEmail || ''} onChange={update} />
                <Field label="Father's Mobile" name="fatherMobile" placeholder="10-digit mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" value={application.fatherMobile || ''} onChange={update} />
              </div>
            </div>
            <div className="form-subsection">
              <span className="form-subsection__title">Mother</span>
              <div className="form-grid">
                <Field label="Mother's Name *" name="motherName" placeholder="Mother's full name" value={application.motherName || ''} onChange={update} maxLength={100} required />
                <Field label="Mother's Email" name="motherEmail" placeholder="Mother's email address" type="email" value={application.motherEmail || ''} onChange={update} />
                <Field label="Mother's Mobile" name="motherMobile" placeholder="10-digit mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" value={application.motherMobile || ''} onChange={update} />
              </div>
            </div>
            <div className="form-subsection">
              <span className="form-subsection__title">Guardian</span>
              <div className="form-grid">
                <Field label="Guardian's Name *" name="guardianName" placeholder="Guardian's full name" value={application.guardianName || ''} onChange={update} maxLength={100} required />
                <Field label="Relation" name="guardianRelation" placeholder="Relation with guardian" value={application.guardianRelation || ''} onChange={update} />
                <TextArea label="Office address & designation *" name="guardianOffice" placeholder="Complete office address and designation" value={application.guardianOffice || ''} onChange={update} wide required />
                <Field label="Office Phone" name="guardianOfficePhone" placeholder="Office phone number" type="tel" value={application.guardianOfficePhone || ''} onChange={update} />
                <Field label="Monthly Income (₹) *" name="monthlyIncome" placeholder="Monthly income in rupees" type="number" min="0" value={application.monthlyIncome || ''} onChange={update} required />
                <Field label="Guardian Mobile" name="guardianMobile" placeholder="10-digit mobile" type="tel" inputMode="numeric" pattern="[0-9]{10}" value={application.guardianMobile || ''} onChange={update} />
              </div>
            </div>
          </div>
        </>}

        {step === 3 && <>
          <div className="form-section">
            <h3 className="form-section__title"><IdentificationCard size={20} /> Citizenship</h3>
            <div className="form-grid">
              <SelectField label="Are you a foreign student? *" name="isForeign" value={application.isForeign} onChange={update} placeholder="Select" options={['No', 'Yes']} required />
            </div>
            {application.isForeign === 'Yes' && (
              <div className="form-subsection">
                <span className="form-subsection__title">Foreign student details</span>
                <div className="form-grid">
                  <Field label="Country of residence *" name="foreignResidence" placeholder="Country of residence" value={application.foreignResidence || ''} onChange={update} required />
                  <Field label="Passport No. *" name="passportNo" placeholder="Passport number" value={application.passportNo || ''} onChange={update} required />
                  <Field label="Passport issue date" name="passportIssueDate" type="date" value={application.passportIssueDate || ''} onChange={update} />
                  <Field label="Visa No. *" name="visaNo" placeholder="Visa number" value={application.visaNo || ''} onChange={update} required />
                  <Field label="Visa issue date" name="visaIssueDate" type="date" value={application.visaIssueDate || ''} onChange={update} />
                  <Field label="Visa place of issue" name="visaIssuePlace" placeholder="Place of issue" value={application.visaIssuePlace || ''} onChange={update} />
                </div>
              </div>
            )}
          </div>
        </>}

        {step === 4 && <>
          <div className="form-section">
            <h3 className="form-section__title"><FileText size={20} /> Admission test</h3>
            <div className="form-grid">
              <SelectField label="Test name *" name="admissionTest" value={application.admissionTest} onChange={update} placeholder="Select test" options={['IEMJEE', 'IEMCET', 'CAT', 'MAT', 'Other']} required />
              <Field label="Year of exam *" name="examYear" placeholder="Year" type="number" min={EXAM_YEAR_MIN} max={ACADEMIC_YEAR_START} value={application.examYear || ''} onChange={update} required />
              <Field label="Registration No. *" name="registrationNo" placeholder="Registration number" value={application.registrationNo || ''} onChange={update} required />
              <Field label="Rank *" name="rank" placeholder="Enter 0 if result not declared" type="number" min="0" value={application.rank || ''} onChange={update} required />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title"><GraduationCap size={20} /> Class 10</h3>
            <div className="form-grid">
              <Field label="Exam name *" name="tenthExamName" placeholder="e.g. ICSE, CBSE, State Board" value={application.tenthExamName || ''} onChange={update} required />
              <Field label="Board / Council *" name="tenthBoard" placeholder="Board or council" value={application.tenthBoard || ''} onChange={update} required />
              <Field label="Year of passing *" name="tenthYear" type="number" min={OLDEST_PASSING_YEAR} max={ACADEMIC_YEAR_START} value={application.tenthYear || ''} onChange={update} required />
              <Field label="Aggregate (%) *" name="tenthPercent" type="number" min="0" max="100" step="0.01" placeholder="e.g. 86.4" value={application.tenthPercent || ''} onChange={update} required />
              <Field label="School name *" name="tenthSchool" placeholder="School name" value={application.tenthSchool || ''} onChange={update} required />
              <Field label="Subjects *" name="tenthSubjects" placeholder="Main subjects studied" value={application.tenthSubjects || ''} onChange={update} required />
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section__title"><GraduationCap size={20} /> Class 12</h3>
            <div className="form-grid">
              <Field label="Exam name *" name="twelfthExamName" placeholder="e.g. ISC, CBSE, State Board" value={application.twelfthExamName || ''} onChange={update} required />
              <Field label="Board / Council *" name="twelfthBoard" placeholder="Board or council" value={application.twelfthBoard || ''} onChange={update} required />
              <SelectField label="Class 12 status *" name="class12Status" value={application.class12Status} onChange={update} placeholder="Select status" options={['Appearing', 'Passed']} required />
              <Field label="Year of passing" name="twelfthYear" type="number" min={OLDEST_PASSING_YEAR} max={ACADEMIC_YEAR_START} value={application.twelfthYear || ''} onChange={update} required />
              <Field label={`Aggregate (%)${application.class12Status === 'Passed' ? ' *' : ''}`} name="twelfthPercent" type="number" min="0" max="100" step="0.01" placeholder="e.g. 81.2" value={application.twelfthPercent || ''} onChange={update} required={application.class12Status === 'Passed'} />
              <Field label="School name *" name="twelfthSchool" placeholder="School name" value={application.twelfthSchool || ''} onChange={update} required />
              <TextArea label="School address *" name="twelfthSchoolAddress" placeholder="Complete school address" value={application.twelfthSchoolAddress || ''} onChange={update} wide required />
              <Field label="Subjects" name="twelfthSubjects" placeholder="Main subjects studied" value={application.twelfthSubjects || ''} onChange={update} />
            </div>
            {!hideSubjectMarks && application.class12Status === 'Passed' && (
              <div className="form-subsection">
                <span className="form-subsection__title">Subject-wise marks</span>
                <div className="form-grid">
                  <Field label="English *" name="marks12English" placeholder="Marks" type="number" min="0" max="100" value={application.marks12English || ''} onChange={update} required />
                  <Field label="Physics *" name="marks12Physics" placeholder="Marks" type="number" min="0" max="100" value={application.marks12Physics || ''} onChange={update} required />
                  <Field label="Chemistry *" name="marks12ChemCS" placeholder="Marks" type="number" min="0" max="100" value={application.marks12ChemCS || ''} onChange={update} required />
                  <Field label="Mathematics *" name="marks12Maths" placeholder="Marks" type="number" min="0" max="100" value={application.marks12Maths || ''} onChange={update} required />
                </div>
              </div>
            )}
            {hideSubjectMarks && <p className="form-inline-note"><Info size={14} /> Subject-wise class 12 marks are not required for BBA / MBA programmes.</p>}
          </div>

          {pg && (
            <div className="form-section">
              <h3 className="form-section__title"><BookOpen size={20} /> Degree (required for PG)</h3>
              <div className="form-grid">
                <Field label="Degree name *" name="degreeName" placeholder="e.g. B.Sc., B.Com" value={application.degreeName || ''} onChange={update} required />
                <Field label="Board / University *" name="degreeBoard" placeholder="Board or university" value={application.degreeBoard || ''} onChange={update} required />
                <Field label="Year of passing *" name="degreeYear" type="number" min={OLDEST_PASSING_YEAR} max={ACADEMIC_YEAR_START} value={application.degreeYear || ''} onChange={update} required />
                <Field label="Aggregate (%) *" name="degreePercent" type="number" min="0" max="100" step="0.01" value={application.degreePercent || ''} onChange={update} required />
                <Field label="Institution *" name="degreeInstitution" placeholder="College or institution" value={application.degreeInstitution || ''} onChange={update} required />
                <Field label="Subjects *" name="degreeSubjects" placeholder="Main subjects" value={application.degreeSubjects || ''} onChange={update} required />
              </div>
            </div>
          )}

          <div className="form-section">
            <h3 className="form-section__title"><BookOpen size={20} /> Post-graduate (optional)</h3>
            <div className="form-grid">
              <Field label="Degree name" name="pgName" placeholder="e.g. M.Sc., M.Com" value={application.pgName || ''} onChange={update} />
              <Field label="Board / University" name="pgBoard" placeholder="Board or university" value={application.pgBoard || ''} onChange={update} />
              <Field label="Year" name="pgYear" type="number" min="2000" max="2026" value={application.pgYear || ''} onChange={update} />
              <Field label="Aggregate (%)" name="pgPercent" type="number" min="0" max="100" step="0.01" value={application.pgPercent || ''} onChange={update} />
              <Field label="Institution" name="pgInstitution" placeholder="College or institution" value={application.pgInstitution || ''} onChange={update} />
              <Field label="Subjects" name="pgSubjects" placeholder="Main subjects" value={application.pgSubjects || ''} onChange={update} />
            </div>
          </div>
        </>}

        {step === 5 && <>
          <div className="form-section">
            <h3 className="form-section__title"><IdentificationCard size={20} /> Identification</h3>
            <p className="form-section__subtitle">Sensitive identifiers are encrypted at rest and shown masked (last 4 digits) in lists.</p>
            <div className="form-grid">
              <Field label="Aadhaar number" name="aadhaar" placeholder="12-digit Aadhaar number" inputMode="numeric" pattern="[0-9]{12}" value={application.aadhaar || ''} onChange={update} hint={application.aadhaar ? `Stored masked as ${maskSensitive(application.aadhaar)}` : 'Collected subject to institutional approval.'} />
              <Field label="Guardian's PAN" name="guardianPAN" placeholder="PAN number" value={application.guardianPAN || ''} onChange={update} hint={application.guardianPAN ? `Stored masked as ${maskSensitive(application.guardianPAN)}` : 'Collected subject to institutional approval.'} />
              <Field label="ABC ID *" name="abcId" placeholder="Academic Bank of Credits ID" value={application.abcId || ''} onChange={update} required />
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section__title"><Sparkle size={20} /> Additional information</h3>
            <div className="form-grid">
              <SelectField label="Category *" name="category" value={application.category} onChange={update} placeholder="Select category" options={['General', 'OBC', 'SC', 'ST', 'EWS']} required />
              <SelectField label="Blood group" name="bloodGroup" value={application.bloodGroup} onChange={update} placeholder="Select blood group" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} />
              <SelectField label="Religion" name="religion" value={application.religion} onChange={update} placeholder="Select religion" options={['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Jainism', 'Other']} />
              <TextArea label="Activities / hobbies / certificates" name="activities" wide maxLength={250} placeholder="Sports, cultural activities, volunteering, hobbies, certificates (max 250 characters)" value={application.activities || ''} onChange={update} hint={`${(application.activities || '').length} / 250 characters`} />
            </div>
            {categoryNeedsCertificate && <p className="form-inline-note"><Info size={14} /> A category certificate is required for {application.category} — upload it in the Documents step.</p>}
          </div>
        </>}

        {step === 6 && <>
          <DocumentsPanel application={application} setApplication={setApplication} />
        </>}

        {step === 7 && <>
          <div className="form-section">
            <h3 className="form-section__title"><ListChecks size={20} /> Completeness check</h3>
            <div className="check-list">
              {steps.map((item) => (
                <div className={`check-item${item.complete ? ' is-done' : ''}`} key={item.key}>
                  <span>{item.complete ? <Check size={14} weight="bold" /> : <X size={14} weight="bold" />}</span>
                  <div className="check-item__content">
                    <span>{item.label}</span>
                    {!item.complete && item.errors.length > 0 && (
                      <ul className="check-item__errors">
                        {item.errors.map((err) => <li key={err}>{err}</li>)}
                      </ul>
                    )}
                  </div>
                  {!item.complete && <button className="text-link" onClick={() => setStep(FORM_STEPS.findIndex((stepItem) => stepItem.key === item.key))} type="button">Fix</button>}
                </div>
              ))}
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section__title"><FileText size={20} /> Review your application</h3>
            <p className="form-section__subtitle">Read-only summary in form order. Use Edit to jump back to a section.</p>
            <p className="review-required-note"><span>*</span> required for submission</p>
            <ReviewGroup title="Course & personal" stepIndex={0} onEdit={setStep} rows={[
              { label: 'Programme', value: program ? `${program.name} (${program.level})` : '', required: true },
              { label: 'Stream', value: stream?.name, required: true },
              { label: 'Full name', value: application.fullName, required: true },
              { label: 'Gender', value: application.gender, required: true },
              { label: 'Date of birth', value: application.dob, required: true },
              { label: 'Email', value: application.email, required: true },
              { label: 'Mobile', value: application.mobile ? `+91 ${application.mobile}` : '', required: true },
              { label: 'Category', value: application.category, required: true },
            ]} />
            <ReviewGroup title="Address" stepIndex={1} onEdit={setStep} rows={[
              { label: 'Present address', value: [application.presentLine1, application.presentLine2, application.presentPO, application.presentDistrict, application.presentState, application.presentPIN].filter(Boolean).join(', '), required: true },
              { label: 'Permanent address', value: application.sameAsPresent ? 'Same as present address' : [application.permLine1, application.permLine2, application.permPO, application.permDistrict, application.permState, application.permPIN].filter(Boolean).join(', '), required: true },
            ]} />
            <ReviewGroup title="Family & guardian" stepIndex={2} onEdit={setStep} rows={[
              { label: "Father's name", value: application.fatherName, required: true },
              { label: "Mother's name", value: application.motherName, required: true },
              { label: "Guardian's name", value: application.guardianName, required: true },
              { label: 'Guardian office', value: application.guardianOffice, required: true },
              { label: 'Monthly income', value: application.monthlyIncome ? inr(Number(application.monthlyIncome)) : '', required: true },
            ]} />
            <ReviewGroup title="Citizenship" stepIndex={3} onEdit={setStep} rows={[
              { label: 'Foreign student', value: application.isForeign, required: true },
              ...(application.isForeign === 'Yes' ? [
                { label: 'Passport no.', value: maskSensitive(application.passportNo), required: true },
                { label: 'Visa no.', value: maskSensitive(application.visaNo), required: true },
              ] : []),
            ]} />
            <ReviewGroup title="Academics" stepIndex={4} onEdit={setStep} rows={[
              { label: 'Admission test', value: application.admissionTest ? `${application.admissionTest} · ${application.examYear} · Rank ${application.rank}` : '', required: true },
              { label: 'Class 10', value: application.tenthPercent ? `${application.tenthPercent}% · ${application.tenthSchool}` : '', required: true },
              { label: 'Class 12', value: [application.class12Status, application.twelfthPercent ? `${application.twelfthPercent}%` : null].filter(Boolean).join(' · '), required: true },
              ...(pg ? [{ label: 'Degree', value: application.degreePercent ? `${application.degreeName} · ${application.degreePercent}%` : '', required: true }] : []),
            ]} />
            <ReviewGroup title="Other details" stepIndex={5} onEdit={setStep} rows={[
              { label: 'ABC ID', value: application.abcId, required: true },
              { label: 'Aadhaar', value: maskSensitive(application.aadhaar) },
              { label: "Guardian's PAN", value: maskSensitive(application.guardianPAN) },
              { label: 'Blood group / religion', value: [application.bloodGroup, application.religion].filter(Boolean).join(' · ') },
            ]} />
            <ReviewGroup title="Documents" stepIndex={6} onEdit={setStep} rows={requiredDocumentSlots(application).map((slot) => ({ label: slot.label, value: application.documents?.[slot.key]?.name || '', required: true }))} />
          </div>
          <div className="form-section">
            <label className="consent-row">
              <input type="checkbox" checked={application.declaration === true} onChange={(event) => setApplication((current) => ({ ...current, declaration: event.target.checked }))} />
              <span>I confirm that all the information provided in this application is accurate and complete to the best of my knowledge, and I consent to its use for admission processing.</span>
            </label>
            {reviewError && <p className="form-error" role="alert" style={{ marginTop: '14px' }}>{reviewError}</p>}
            {!allComplete && <p className="form-inline-note"><Warning size={14} /> Resolve the items in the completeness check above to enable submission.</p>}
          </div>
        </>}

        <div className="application-form__actions">
          <button className="button button--outline" disabled={step === 0} onClick={() => setStep((current) => current - 1)} type="button"><ArrowLeft size={16} /> Previous</button>
          {step < FORM_STEPS.length - 1
            ? <button className="button button--dark" type="submit">Save &amp; Continue <ArrowRight size={16} /></button>
            : <button className="button button--charcoal" disabled={!allComplete || application.declaration !== true} type="submit"><SealCheck size={16} /> Submit application</button>}
        </div>
      </form>
    </>
  );
}

function StatusPage({ application, onNavigate, setApplication, notify }) {
  const status = application.status || 'Draft';
  const hasApplication = Boolean(application.applicationNo || application.submittedAt);
  const program = programById(application.programId);
  const stream = streamOf(application);

  return (
    <>
      <div className="application-title-row">
        <div><h1>My Application</h1><p>Track your application and see exactly what happens next.</p></div>
        {hasApplication && <StatusBadge status={status} />}
      </div>

      {!hasApplication ? (
        <div className="empty-state">
          <span><Briefcase size={28} /></span>
          <h2>No application yet</h2>
          <p>Once you submit an application it will appear here with a live status tracker and every update from the admission office.</p>
          <button className="button button--dark" onClick={() => onNavigate('application')} type="button">Start application <ArrowRight size={16} /></button>
        </div>
      ) : (
        <div className="status-layout">
          <section className="status-card">
            <div className="status-card__head">
              <div>
                <span className="status-card__label">Application number</span>
                <strong className="status-card__no">{application.applicationNo || 'Draft'}</strong>
              </div>
              <div className="status-card__dates">
                <span>Submitted: <strong>{formatDateTime(application.submittedAt)}</strong></span>
                <span>Last update: <strong>{formatDateTime(application.statusChangedAt || application.updatedAt)}</strong></span>
              </div>
            </div>
            <StatusTimeline status={status} />
            <div className="status-detail">
              <div><span>Programme</span><strong>{program ? `${program.name} · ${stream?.name || ''}` : '—'}</strong></div>
              {application.decision?.reason && <div><span>Decision note</span><strong>{application.decision.reason}</strong></div>}
              {application.flaggedSections?.length > 0 && <div><span>Corrections requested</span><strong>{application.flaggedSections.join(', ')}</strong></div>}
            </div>
          </section>

          <aside className="status-side">
            <section className="status-explainer">
              <Sparkle size={16} weight="fill" />
              <div>
                <strong>AI Status Explainer</strong>
                <p>
                  {status === 'Submitted' && 'Your application has been received. An admission officer will open it for review next.'}
                  {status === 'Under Review' && 'An officer is checking your documents and details. You do not need to do anything right now.'}
                  {status === 'Correction Requested' && 'One or more sections need fixing. Open the form, correct the flagged sections and resubmit.'}
                  {status === 'Approved' && 'You are approved. Pay the booking / admission amount from the Payments page to confirm your seat.'}
                  {status === 'Rejected' && 'Your application was rejected. Read the reason above; contact the admission office if you believe this is a mistake.'}
                  {status === 'Admission Confirmed' && 'Your seat is confirmed. Your receipt is available on the Payments page.'}
                </p>
                <small className="ai-advisory__tag">AI-generated guidance · advisory only</small>
              </div>
            </section>
            {status === 'Approved' && (
              <section className="status-explainer status-explainer--action">
                <CreditCard size={16} />
                <div>
                  <strong>Payment due</strong>
                  <p>The booking / admission amount is now open.</p>
                  <button className="button button--dark button--small" onClick={() => onNavigate('payments')} type="button">Go to Payments <ArrowRight size={14} /></button>
                </div>
              </section>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function DocumentsPage({ application, setApplication, onNavigate }) {
  const uploaded = Object.keys(application.documents || {}).length;
  return (
    <>
      <div className="application-title-row">
        <div><h1>Documents</h1><p>Upload the required documents into their labelled slots. {uploaded} file(s) uploaded so far.</p></div>
        <button className="button button--outline button--draft" onClick={() => onNavigate('application')} type="button"><PencilSimple size={15} /> Open form</button>
      </div>
      <div className="doc-page-card">
        <DocumentsPanel application={application} setApplication={setApplication} showHeading={false} />
      </div>
    </>
  );
}

function httpStatusText() {
  return 'A real deployment verifies payment on the server (webhook plus a status-API check) before it is marked successful — a browser redirect alone is never trusted.';
}

function bookingAmountFor(application) {
  const stream = streamOf(application);
  if (!stream || !stream.booking) return null;
  return application.class12Status === 'Appearing' ? stream.booking.appearing : stream.booking.passed;
}

function PaymentsPage({ application, setApplication, applicantName, notify, onNavigate }) {
  const status = application.status || 'Draft';
  const program = programById(application.programId);
  const stream = streamOf(application);
  const hasApplication = Boolean(application.programId || application.status);
  const booking = bookingAmountFor(application);
  const fixedTotal = FIXED_CHARGES.reduce((sum, item) => sum + item.amount, 0);
  const total = (booking || 0) + fixedTotal;
  const applicationFee = 0;
  const paid = status === 'Admission Confirmed' && application.payment;

  const pay = (method) => {
    const now = new Date().toISOString();
    const payment = {
      method,
      amount: total,
      receiptNo: nextReceiptNumber(),
      transactionId: `MOCK-${Date.now().toString().slice(-8)}`,
      confirmedAt: now,
      items: [
        ...(booking ? [{ label: `Booking amount (${application.class12Status === 'Appearing' ? 'class 12 appearing' : 'class 12 passed'})`, amount: booking }] : []),
        ...FIXED_CHARGES.map((item) => ({ ...item })),
      ],
    };
    setApplication((current) => ({ ...current, status: 'Admission Confirmed', statusChangedAt: now, payment }));
    notify(`Payment of ${inr(total)} confirmed. Receipt ${payment.receiptNo} is available.`, { type: 'success', link: 'payments' });
  };

  const downloadReceipt = () => {
    const payment = application.payment;
    const lines = [
      'INSTITUTE OF ENGINEERING & MANAGEMENT, KOLKATA',
      'Payment Receipt',
      '---------------------------------------------',
      `Receipt no.: ${payment.receiptNo}`,
      `Transaction id: ${payment.transactionId}`,
      `Date: ${formatDateTime(payment.confirmedAt)}`,
      `Applicant: ${applicantName}`,
      `Application no.: ${application.applicationNo || '—'}`,
      `Method: ${payment.method}`,
      '',
      ...payment.items.map((item) => `${item.label}: ${inr(item.amount)}`),
      '---------------------------------------------',
      `Total paid: ${inr(payment.amount)}`,
    ].join('\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${payment.receiptNo}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!hasApplication) {
    return (
      <div className="empty-state">
        <span><CreditCard size={28} /></span>
        <h2>No fees yet</h2>
        <p>Fees depend on the programme and stream you choose. Start your application to see the applicable amounts.</p>
        <button className="button button--dark" onClick={() => onNavigate('application')} type="button">Start application <ArrowRight size={16} /></button>
      </div>
    );
  }

  return (
    <>
      <div className="application-title-row">
        <div><h1>Payments</h1><p>Application fee is ₹0. The booking / admission amount is payable after approval.</p></div>
        {paid ? <StatusBadge status="Admission Confirmed" /> : <StatusBadge status={status} />}
      </div>

      {paid ? (
        <section className="receipt-card">
          <div className="receipt-card__head">
            <span className="receipt-card__stamp"><SealCheck size={22} weight="duotone" /> Paid</span>
            <div>
              <strong>{inr(application.payment.amount)}</strong>
              <small>{formatDateTime(application.payment.confirmedAt)}</small>
            </div>
          </div>
          <div className="receipt-rows">
            <div><span>Receipt no.</span><strong>{application.payment.receiptNo}</strong></div>
            <div><span>Transaction id</span><strong>{application.payment.transactionId}</strong></div>
            <div><span>Applicant</span><strong>{applicantName}</strong></div>
            <div><span>Method</span><strong>{application.payment.method}</strong></div>
            {application.payment.items.map((item) => (
              <div key={item.label}><span>{item.label}</span><strong>{inr(item.amount)}</strong></div>
            ))}
            <div className="receipt-rows__total"><span>Total paid</span><strong>{inr(application.payment.amount)}</strong></div>
          </div>
          <button className="button button--outline" onClick={downloadReceipt} type="button"><DownloadSimple size={16} /> Download receipt</button>
        </section>
      ) : (
        <div className="payment-columns">
          <section className="payment-card payment-entry">
            <div className="payment-methods">
              <h2>How payment works</h2>
              <div className="method-list">
                <div className="method-info"><span><CreditCard size={18} /></span><div><strong>Online (after approval)</strong><small>You are taken to the gateway's hosted page to pay by card, net banking or UPI. We only keep the transaction reference — never card details.</small></div></div>
                <div className="method-info"><span><Buildings size={18} /></span><div><strong>NEFT</strong><small>Transfer to the IEM Trust account; an admission officer records the UTR against your application.</small></div></div>
                <div className="method-info"><span><Receipt size={18} /></span><div><strong>Demand Draft</strong><small>In favour of Institute of Engineering &amp; Management Trust; a DD reference is required to record it.</small></div></div>
              </div>
              <div className="security-note"><ShieldCheck size={17} /><span>Card numbers and CVV are never entered or stored in this portal.</span></div>
            </div>
            <div className="payment-details">
              <h2>Complete payment</h2>
              {status === 'Approved' ? (
                <>
                  <p className="payment-hint">{httpStatusText()}</p>
                  <div className="method-placeholder">
                    <span><LockKey size={21} /></span>
                    <p>Continue to the hosted gateway to pay securely.</p>
                  </div>
                  <button className="button button--charcoal button--full pay-button" onClick={() => pay('Online gateway')} type="button"><LockKey size={15} /> Pay Now <strong>{inr(total)}</strong></button>
                </>
              ) : (
                <div className="payment-locked">
                  <span><LockKey size={26} /></span>
                  <h3>Payment not open yet</h3>
                  <p>{status === 'Rejected' ? 'This application was rejected, so no payment is due.' : 'The booking / admission amount becomes payable once your application is approved. Check your application status for updates from the admission office.'}</p>
                  <button className="button button--outline" onClick={() => onNavigate('status')} type="button">View status</button>
                </div>
              )}
            </div>
          </section>
          <aside className="payment-summary">
            <section className="summary-card">
              <h2>Fee summary</h2>
              <div className="summary-program"><span>Programme</span><strong>{program ? `${program.name} · ${stream?.name || ''}` : '—'}</strong></div>
              <div className="summary-row"><span>Application fee</span><strong>{inr(applicationFee)}</strong></div>
              <div className="summary-row"><span>Booking amount{application.class12Status ? ` (${application.class12Status})` : ''}</span><strong>{booking == null ? 'Not published' : inr(booking)}</strong></div>
              {FIXED_CHARGES.map((item) => (
                <div className="summary-row" key={item.label}><span>{item.label}</span><strong>{inr(item.amount)}</strong></div>
              ))}
              <div className="summary-row summary-row--total"><strong>Total payable</strong><strong>{booking == null ? '—' : inr(total)}</strong></div>
              <div className="refund-note"><Info size={16} /><span>Payments are non-refundable once confirmed. Check all details before paying.</span></div>
            </section>
            {program && (
              <section className="summary-card">
                <h2>Semester fees</h2>
                {program.fees.map((fee) => (
                  <div className="summary-row" key={fee.label}><span>{fee.label}</span><strong>{inr(fee.amount)}</strong></div>
                ))}
              </section>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

function ProfilePage({ user, onNavigate, onLogout }) {
  return (
    <>
      <div className="application-title-row">
        <div><h1>Profile</h1><p>Your account, consent and session settings.</p></div>
      </div>
      <div className="profile-grid">
        <section className="profile-card">
          <h2>Account</h2>
          <div className="profile-rows">
            <div><span>Full name</span><strong>{user?.fullName || 'Applicant'}</strong></div>
            <div><span>Email</span><strong>{user?.email || '—'}</strong></div>
            <div><span>Mobile</span><strong>{user?.countryCode || '+91'} {user?.mobile || '—'}</strong></div>
            <div><span>Role</span><strong>Applicant</strong></div>
          </div>
        </section>
        <section className="profile-card">
          <h2>Consent &amp; privacy</h2>
          <p className="profile-copy">You consented to the use of your information for admission processing at registration. Aadhaar and PAN, where collected, are encrypted at rest and masked in read operations. Admin actions are audit-logged.</p>
          <div className="profile-actions">
            <button className="button button--outline" onClick={() => onNavigate('documents')} type="button">My documents</button>
            <button className="button button--charcoal" onClick={onLogout} type="button"><SignOut size={16} /> Sign out</button>
          </div>
        </section>
      </div>
    </>
  );
}

function Stepper({ current, labels, variant = 'form' }) {
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

function findAiAnswer(question) {
  const q = question.toLowerCase();
  if (/(fee|cost|price|semester|payment|how much)/.test(q)) {
    return 'Tuition varies by programme — for example B.Tech CSE is ₹1,40,000 for semester 1 and ₹1,15,000 for semesters 2–8, while MBA is ₹1,75,000 per semester. There is no application fee; the booking / admission amount is payable after approval. See the Courses page for the exact figures.';
  }
  if (/(eligib|criteria|percentage|marks|qualif)/.test(q)) {
    return 'Eligibility is set per programme. B.Tech CSE needs 10th and 12th at 80%; most other B.Tech streams need 60% with PCM at 45–50%; MBA needs 55% in 10th, 12th and graduation. The Courses page lists the exact minimum for every stream.';
  }
  if (/(document|upload|marksheet|certificate|photo|file)/.test(q)) {
    return 'You upload a class 10 marksheet, class 12 marksheet, ID proof, photograph, and for PG a graduation marksheet. A category certificate is required if your category is not General. Files must be PDF, JPG or PNG and at most 5 MB each.';
  }
  if (/(status|track|review|approv|reject|correction)/.test(q)) {
    return 'Your live status and last-update date are on the My Application page: Draft → Submitted → Under Review → (Correction Requested) → Approved → Admission Confirmed. If a correction is requested, only the flagged sections unlock.';
  }
  if (/(date|deadline|last date|when)/.test(q)) {
    return 'Applications are open for the 2026-27 session. Deadlines differ by programme and are announced by the admission office — check the official announcements or contact admissions@iem.edu.in for exact dates.';
  }
  if (/(contact|phone|email|office|address|campus)/.test(q)) {
    return 'Admission offices are at the IEM Ashram Building (Salt Lake), the UEM Building (New Town) and UEM Jaipur. Phone 8010700500 / 8069795500, email admissions@iem.edu.in.';
  }
  if (/(course|programme|program|stream|recommend|which)/.test(q)) {
    return 'We offer UG programmes (B.Tech with 13 streams, BHM, BBA, BCA, BBA LLB) and PG programmes (MCA, MBA, MBA Global Management, M.Tech). Tell me your interests and I can suggest directions — the course recommender is advisory only.';
  }
  if (/(hostel|scholarship|refund|neft|dd|offline)/.test(q)) {
    return 'For offline payments you can use NEFT or a Demand Draft in favour of the Institute of Engineering & Management Trust; an officer records the UTR / DD reference. For scholarships, hostel or refund specifics, please contact the admission office — I avoid guessing policy I have not been given.';
  }
  return 'I am not certain about that from the admission information I have verified. Please check the official pages or ask an admission officer at admissions@iem.edu.in (8010700500) so you get an accurate answer rather than a guess.';
}

function AiChatbox({ open, onOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am the IEM admission assistant. Ask me about eligibility, fees, documents, deadlines or your application status.' },
  ]);
  const [input, setInput] = useState('');
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, open]);

  const send = (text) => {
    const question = sanitize(text);
    if (!question) return;
    setMessages((current) => [...current, { role: 'user', text: question }, { role: 'ai', text: findAiAnswer(question) }]);
    setInput('');
  };

  if (!open) {
    return (
      <button className="ai-fab" onClick={onOpen} type="button" aria-label="Open AI admission assistant">
        <Robot size={22} weight="duotone" />
        <span>Ask AI</span>
      </button>
    );
  }

  return (
    <div className="ai-chat" role="dialog" aria-label="AI admission assistant">
      <div className="ai-chat__header">
        <span className="ai-chat__avatar"><Robot size={18} weight="duotone" /></span>
        <div><strong>Admission Assistant</strong><small>AI-generated guidance · advisory only</small></div>
        <button aria-label="Close assistant" onClick={onClose} type="button"><X size={16} /></button>
      </div>
      <div className="ai-chat__body" ref={bodyRef}>
        {messages.map((message, index) => (
          <div className={`ai-msg ai-msg--${message.role}`} key={index}>{message.text}</div>
        ))}
      </div>
      <div className="ai-chat__suggestions">
        {['Eligibility for B.Tech CSE?', 'Which documents do I need?', 'How much are the fees?'].map((suggestion) => (
          <button key={suggestion} onClick={() => send(suggestion)} type="button">{suggestion}</button>
        ))}
      </div>
      <form className="ai-chat__form" onSubmit={(event) => { event.preventDefault(); send(input); }}>
        <input aria-label="Ask the assistant" placeholder="Ask about eligibility, fees, documents…" value={input} onChange={(event) => setInput(event.target.value)} />
        <button type="submit" aria-label="Send"><PaperPlaneRight size={17} weight="fill" /></button>
      </form>
      <p className="ai-chat__disclaimer">The assistant never makes admission decisions or blocks your application.</p>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('home');
  const [user, setUser] = usePersistentState('iem-user', null);
  const userScope = `:${user?.email || user?.mobile || 'guest'}`;
  const [application, setApplication] = usePersistentState(`iem-application${userScope}`, {});
  const [notifications, setNotifications] = usePersistentState(`iem-notifications${userScope}`, []);
  const [aiOpen, setAiOpen] = useState(false);

  const go = (next) => {
    if (next === 'logout') {
      setUser(null);
      setPage('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const notify = (message, options = {}) => {
    setNotifications((list) => [
      { id: `${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, message, type: options.type || 'info', link: options.link || 'dashboard', read: false, at: new Date().toISOString() },
      ...list,
    ]);
  };

  useEffect(() => {
    const titles = {
      home: 'IEM Admissions | Apply for 2026-27', courses: 'Courses | IEM Admissions', process: 'Admission Process | IEM Admissions',
      faqs: 'FAQs | IEM Admissions', contact: 'Contact Us | IEM Admissions', register: 'Create account | IEM Admissions',
      login: 'Sign in | IEM Admissions', verify: 'Verify account | IEM Admissions', forgot: 'Password recovery | IEM Admissions',
      application: 'Application | IEM Admissions', status: 'My Application | IEM Admissions', documents: 'Documents | IEM Admissions',
      payments: 'Payments | IEM Admissions', profile: 'Profile | IEM Admissions', dashboard: 'Dashboard | IEM Admissions',
    };
    document.title = titles[page] || 'IEM Admissions';
  }, [page]);

  const applicantName = user?.fullName || 'Applicant';

  const register = (account) => {
    setUser(account);
    notify('Account created. Enter the OTP we emailed you to verify it.', { type: 'info', link: 'dashboard' });
    setPage('verify');
  };

  const verify = () => {
    notify('Email verified. Welcome to the IEM admissions portal.', { type: 'success', link: 'dashboard' });
    setPage('dashboard');
  };

  const login = (account) => {
    setUser(account);
    setPage('dashboard');
  };

  const readNotification = (id) => setNotifications((list) => list.map((item) => (item.id === id ? { ...item, read: true } : item)));
  const markAllRead = () => setNotifications((list) => list.map((item) => ({ ...item, read: true })));

  const applicantShellProps = { onNavigate: go, applicantName, notifications, onReadNotification: readNotification, onMarkAllRead: markAllRead };

  if (page === 'courses') return <CoursesPage onNavigate={go} />;
  if (page === 'process') return <ProcessPage onNavigate={go} />;
  if (page === 'faqs') return <FaqsPage onNavigate={go} />;
  if (page === 'contact') return <ContactPage onNavigate={go} />;
  if (page === 'register') return <RegistrationPage onNavigate={go} onRegistered={register} />;
  if (page === 'login') return <LoginPage onNavigate={go} onLogin={login} />;
  if (page === 'verify') return <OtpPage onNavigate={go} onVerified={verify} mobile={user?.mobile} />;
  if (page === 'forgot') return <ForgotPasswordPage onNavigate={go} />;

  const isApplicantPage = ['dashboard', 'application', 'status', 'documents', 'payments', 'profile'].includes(page);
  if (isApplicantPage) {
    if (!user) {
      return <LoginPage onNavigate={go} onLogin={login} />;
    }
    let content;
    if (page === 'application') content = <ApplicationPage onNavigate={go} applicantName={applicantName} application={application} setApplication={setApplication} notify={notify} />;
    else if (page === 'status') content = <StatusPage application={application} setApplication={setApplication} onNavigate={go} notify={notify} />;
    else if (page === 'documents') content = <DocumentsPage application={application} setApplication={setApplication} onNavigate={go} />;
    else if (page === 'payments') content = <PaymentsPage application={application} setApplication={setApplication} applicantName={applicantName} notify={notify} onNavigate={go} />;
    else if (page === 'profile') content = <ProfilePage user={user} onNavigate={go} onLogout={() => go('logout')} />;
    else content = <DashboardPage application={application} onNavigate={go} notifications={notifications} />;
    return (
      <>
        <ApplicantLayout active={page} {...applicantShellProps}>{content}</ApplicantLayout>
        {AI_ENABLED && <AiChatbox open={aiOpen} onOpen={() => setAiOpen(true)} onClose={() => setAiOpen(false)} />}
      </>
    );
  }

  return (
    <>
      <LandingPage onNavigate={go} onOpenAi={() => setAiOpen(true)} />
      {AI_ENABLED && <AiChatbox open={aiOpen} onOpen={() => setAiOpen(true)} onClose={() => setAiOpen(false)} />}
    </>
  );
}
