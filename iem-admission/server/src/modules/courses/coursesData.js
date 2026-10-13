/**
 * Official IEM Programmes, Streams, Eligibility and Fee catalogue
 * Academic Year 2026-27 (per product.md §3 and §8)
 */
export const COURSES_CATALOGUE = [
  {
    id: 'btech',
    name: 'B.Tech',
    level: 'UG',
    duration: '4 Years',
    entrance: 'IEMJEE',
    academicYear: '2026-27',
    fees: [
      { label: 'Semester 1', amount: 140000 },
      { label: 'Semesters 2–8', amount: 115000 },
    ],
    applicationFee: 0,
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
    id: 'bhm',
    name: 'BHM',
    level: 'UG',
    duration: '4 Years',
    entrance: 'IEMCET',
    academicYear: '2026-27',
    fees: [
      { label: 'Semester 1', amount: 60000 },
      { label: 'Semesters 2–8', amount: 50000 },
    ],
    applicationFee: 0,
    streams: [
      { id: 'bhm', name: 'Hospitality Management', eligibility: { tenth: 60, twelfth: 60 }, booking: { appearing: 50000, passed: 50000 } },
    ],
  },
  {
    id: 'bba',
    name: 'BBA',
    level: 'UG',
    duration: '4 Years',
    entrance: 'IEMCET',
    academicYear: '2026-27',
    fees: [
      { label: 'Semester 1', amount: 70000 },
      { label: 'Semesters 2–8', amount: 60000 },
    ],
    applicationFee: 0,
    streams: [
      { id: 'bba', name: 'Business Administration', eligibility: { tenth: 60, twelfth: 60 }, booking: { appearing: 50000, passed: 50000 } },
    ],
  },
  {
    id: 'bca',
    name: 'BCA',
    level: 'UG',
    duration: '4 Years',
    entrance: 'IEMCET',
    academicYear: '2026-27',
    fees: [
      { label: 'Semester 1', amount: 70000 },
      { label: 'Semesters 2–8', amount: 60000 },
    ],
    applicationFee: 0,
    streams: [
      { id: 'bca', name: 'Computer Applications', eligibility: { tenth: 60, twelfth: 60 }, note: 'Requires Maths / Business Maths / Computer in class 12', booking: { appearing: 50000, passed: 50000 } },
    ],
  },
  {
    id: 'bba-llb',
    name: 'BBA LLB',
    level: 'UG',
    duration: '5 Years',
    entrance: 'IEMCET',
    academicYear: '2026-27',
    fees: [
      { label: 'Semester 1', amount: 60000 },
      { label: 'Semesters 2–10', amount: 50000 },
    ],
    applicationFee: 0,
    streams: [
      { id: 'bba-llb', name: 'Law (Integrated)', eligibility: { tenth: 60, twelfth: 60 }, booking: { appearing: 50000, passed: 50000 } },
    ],
  },
  {
    id: 'mca',
    name: 'MCA',
    level: 'PG',
    duration: '2 Years',
    entrance: 'IEMCET',
    academicYear: '2026-27',
    fees: [
      { label: 'Semesters 1–4', amount: 75000 },
    ],
    applicationFee: 0,
    streams: [
      { id: 'mca', name: 'Computer Applications', eligibility: { tenth: 60, twelfth: 60, graduation: 60 }, booking: { appearing: 77000, passed: 77000 } },
    ],
  },
  {
    id: 'mba',
    name: 'MBA',
    level: 'PG',
    duration: '2 Years',
    entrance: 'CAT / MAT',
    academicYear: '2026-27',
    fees: [
      { label: 'Semesters 1–4', amount: 175000 },
    ],
    applicationFee: 0,
    streams: [
      { id: 'mba', name: 'Business Administration', eligibility: { tenth: 55, twelfth: 55, graduation: 55 }, booking: { appearing: 162000, passed: 162000 } },
    ],
  },
  {
    id: 'mba-gm',
    name: 'MBA (Global Management)',
    level: 'PG',
    duration: '2 Years',
    entrance: 'CAT / MAT',
    academicYear: '2026-27',
    fees: [
      { label: 'Semesters 1–4', amount: 175000 },
    ],
    applicationFee: 0,
    streams: [
      { id: 'mba-gm', name: 'General Management', eligibility: { tenth: 55, twelfth: 55, graduation: 55 }, booking: { appearing: 162000, passed: 162000 } },
    ],
  },
  {
    id: 'mtech',
    name: 'M.Tech',
    level: 'PG',
    duration: '2 Years',
    entrance: 'IEMCET',
    academicYear: '2026-27',
    fees: [
      { label: 'Semester 1', amount: 77000 },
      { label: 'Semesters 2–4', amount: 75000 },
    ],
    applicationFee: 0,
    streams: [
      { id: 'mtech-cse', name: 'Computer Science & Engineering', eligibility: { tenth: 60, twelfth: 60, graduation: 60 }, booking: { appearing: 77000, passed: 77000 } },
      { id: 'mtech-aiml', name: 'Computer Science & Engineering (AI & ML)', eligibility: { tenth: 60, twelfth: 60, graduation: 60 }, booking: { appearing: 77000, passed: 77000 } },
      { id: 'mtech-ece', name: 'Electronics & Communication Engineering', eligibility: { tenth: 60, twelfth: 60, graduation: 60 }, booking: { appearing: 77000, passed: 77000 } },
    ],
  },
];

export const COURSE_BY_ID = Object.fromEntries(
  COURSES_CATALOGUE.map((prog) => [prog.id, prog])
);
