import crypto from 'crypto';
import { getSupabaseClient } from '../../db/supabase.js';
import { getBucket, uploadStream, openDownloadStream, deleteFile } from '../../db/gridfs.js';
import { COURSE_BY_ID, COURSES_CATALOGUE } from '../courses/coursesData.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  InternalServerError,
} from '../../errors.js';
import {
  ALLOWED_DOCUMENT_SLOTS,
  ALLOWED_MIME_TYPES,
  MAX_DOCUMENT_FILE_SIZE,
} from '../../db/validators.js';

// In-memory application storage fallback
const inMemoryStore = {
  applications: new Map(), // userId -> application
  applicationsById: new Map(), // applicationId -> application
  documents: new Map(), // `${applicationId}:${slot}` -> document record
  files: new Map(), // fileId -> { buffer, filename, mimeType, size }
  sequence: 1,
};

export function resetApplicationStore() {
  inMemoryStore.applications.clear();
  inMemoryStore.applicationsById.clear();
  inMemoryStore.documents.clear();
  inMemoryStore.files.clear();
  inMemoryStore.sequence = 1;
}

/**
 * Generate sequential Application Number: UEM-YYYY-00001
 */
export function generateApplicationNumber() {
  const year = new Date().getFullYear();
  const seq = String(inMemoryStore.sequence++).padStart(5, '0');
  return `UEM-${year}-${seq}`;
}

/**
 * Determine required document slots based on application selections
 */
export function getRequiredDocumentSlots(app) {
  const slots = [
    { key: 'marksheet10', label: 'Class 10 Marksheet' },
    { key: 'marksheet12', label: 'Class 12 Marksheet' },
    { key: 'idProof', label: 'ID Proof (Aadhaar / Passport)' },
    { key: 'photograph', label: 'Photograph' },
  ];

  const program = app.programId ? COURSE_BY_ID[app.programId.toLowerCase()] : null;
  const isPg = program?.level === 'PG' || app.level === 'PG';
  if (isPg) {
    slots.push({ key: 'graduationMarksheet', label: 'Graduation Marksheet' });
  }

  if (app.category && app.category !== 'General') {
    slots.push({ key: 'categoryCertificate', label: 'Category Certificate' });
  }

  return slots;
}

export function mapApplicationRow(row, course = null) {
  const streamId = row.stream || '';
  const streamMatch = COURSES_CATALOGUE
    .map((program) => ({
      program,
      stream: program.streams.find((item) => item.id === streamId),
    }))
    .find((item) => item.stream);
  const programMatch = course
    ? COURSES_CATALOGUE.find((program) => program.name === course.name)
    : streamMatch?.program;
  const selectedStream = programMatch?.streams.find(
    (item) => item.id === streamId || item.name === course?.stream
  ) || streamMatch?.stream;
  return {
    ...row,
    courseId: row.course_id || null,
    programId: programMatch?.id || '',
    programName: programMatch?.name || course?.name || '',
    streamId: selectedStream?.id || streamId,
    streamName: selectedStream?.name || course?.stream || '',
    fullName: row.full_name || '',
    gender: row.gender === 'F' ? 'Female' : row.gender === 'M' ? 'Male' : '',
    countryCode: row.country_code || '+91',
    presentLine1: row.present_address?.line1 || '',
    presentLine2: row.present_address?.line2 || '',
    presentPO: row.present_address?.po || '',
    presentDistrict: row.present_address?.district || '',
    presentState: row.present_address?.state || '',
    presentPIN: row.present_address?.pin || '',
    permLine1: row.permanent_address?.line1 || '',
    permLine2: row.permanent_address?.line2 || '',
    permPO: row.permanent_address?.po || '',
    permDistrict: row.permanent_address?.district || '',
    permState: row.permanent_address?.state || '',
    permPIN: row.permanent_address?.pin || '',
    sameAsPresent: Boolean(row.same_as_present),
    fatherName: row.father?.name || '',
    fatherEmail: row.father?.email || '',
    fatherMobile: row.father?.mobile || '',
    motherName: row.mother?.name || '',
    motherEmail: row.mother?.email || '',
    motherMobile: row.mother?.mobile || '',
    guardianName: row.guardian?.name || '',
    guardianRelation: row.guardian?.relation || '',
    guardianOffice: row.guardian?.office || '',
    guardianOfficePhone: row.guardian?.phone || '',
    monthlyIncome: row.guardian?.monthlyIncome ?? '',
    guardianMobile: row.guardian?.mobile || '',
    isForeign: row.is_foreign ? 'Yes' : 'No',
    foreignResidence: row.citizenship_details?.residence || '',
    passportNo: row.citizenship_details?.passportNo || '',
    passportIssueDate: row.citizenship_details?.passportIssueDate || '',
    visaNo: row.citizenship_details?.visaNo || '',
    visaIssueDate: row.citizenship_details?.visaIssueDate || '',
    visaIssuePlace: row.citizenship_details?.visaIssuePlace || '',
    admissionTest: row.admission_test?.test || '',
    examYear: row.admission_test?.year || '',
    registrationNo: row.admission_test?.registrationNo || '',
    rank: row.admission_test?.rank ?? '',
    tenthExamName: row.tenth?.examName || '',
    tenthBoard: row.tenth?.board || '',
    tenthYear: row.tenth?.year || '',
    tenthPercent: row.tenth?.percent ?? '',
    tenthSchool: row.tenth?.school || '',
    tenthSubjects: row.tenth?.subjects || '',
    twelfthExamName: row.twelfth?.examName || '',
    twelfthBoard: row.twelfth?.board || '',
    twelfthYear: row.twelfth?.year || '',
    twelfthPercent: row.twelfth?.percent ?? '',
    twelfthSchool: row.twelfth?.school || '',
    twelfthSchoolAddress: row.twelfth?.schoolAddress || '',
    twelfthSubjects: row.twelfth?.subjects || '',
    class12Status: row.class12_status || '',
    marks12English: row.twelfth_subjects?.english ?? '',
    marks12Physics: row.twelfth_subjects?.physics ?? '',
    marks12ChemCS: row.twelfth_subjects?.chemCS ?? '',
    marks12Maths: row.twelfth_subjects?.maths ?? '',
    degreeName: row.degree?.name || '',
    degreeBoard: row.degree?.board || '',
    degreeYear: row.degree?.year || '',
    degreePercent: row.degree?.percent ?? '',
    degreeInstitution: row.degree?.institution || '',
    degreeSubjects: row.degree?.subjects || '',
    pgName: row.post_graduate?.name || '',
    pgBoard: row.post_graduate?.board || '',
    pgYear: row.post_graduate?.year || '',
    pgPercent: row.post_graduate?.percent ?? '',
    pgInstitution: row.post_graduate?.institution || '',
    pgSubjects: row.post_graduate?.subjects || '',
    category: row.category || 'General',
    bloodGroup: row.blood_group || '',
    religion: row.religion || '',
    activities: row.activities || '',
    abcId: row.abc_id || '',
    applicationNo: row.application_no || '',
    draftSavedAt: row.draft_saved_at || null,
    submittedAt: row.submitted_at || null,
    statusChangedAt: row.status_changed_at || null,
    decisionReason: row.decision_reason || '',
    flaggedSections: row.flagged_sections || [],
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

/**
 * Check completeness of application and list any missing fields or documents
 */
export function evaluateCompleteness(app, documentsMap = {}) {
  const missing = [];
  const errorsBySection = {
    personal: [],
    address: [],
    family: [],
    citizenship: [],
    academics: [],
    other: [],
    documents: [],
  };

  // 1. Program & Personal
  if (!app.programId) errorsBySection.personal.push('Program is required');
  if (!app.streamId) errorsBySection.personal.push('Stream is required');
  if (!app.fullName?.trim()) errorsBySection.personal.push('Full name is required');
  if (!app.gender) errorsBySection.personal.push('Gender is required');
  if (!app.dob) errorsBySection.personal.push('Date of birth is required');
  if (!app.email?.trim()) errorsBySection.personal.push('Email is required');
  if (!app.mobile || !/^\d{10}$/.test(String(app.mobile).trim())) {
    errorsBySection.personal.push('10-digit mobile number is required');
  }
  if (!app.category) errorsBySection.personal.push('Category is required');

  // 2. Address
  if (!app.presentLine1?.trim()) errorsBySection.address.push('Present address line 1 is required');
  if (!app.presentPIN || !/^\d{6}$/.test(String(app.presentPIN).trim())) {
    errorsBySection.address.push('Valid 6-digit present PIN is required');
  }
  if (!app.sameAsPresent) {
    if (!app.permLine1?.trim()) errorsBySection.address.push('Permanent address line 1 is required');
    if (!app.permPIN || !/^\d{6}$/.test(String(app.permPIN).trim())) {
      errorsBySection.address.push('Valid 6-digit permanent PIN is required');
    }
  }

  // 3. Family
  if (!app.fatherName?.trim()) errorsBySection.family.push("Father's name is required");
  if (!app.motherName?.trim()) errorsBySection.family.push("Mother's name is required");
  if (!app.guardianName?.trim()) errorsBySection.family.push("Guardian's name is required");
  if (!app.guardianOffice?.trim()) errorsBySection.family.push('Guardian office address & designation is required');
  if (app.monthlyIncome === undefined || app.monthlyIncome === null || app.monthlyIncome === '') {
    errorsBySection.family.push('Monthly income is required');
  }

  // 4. Citizenship
  if (!app.isForeign) {
    errorsBySection.citizenship.push('Citizenship status is required');
  } else if (app.isForeign === 'Yes' || app.isForeign === true) {
    if (!app.foreignResidence?.trim()) errorsBySection.citizenship.push('Country of residence is required');
    if (!app.passportNo?.trim()) errorsBySection.citizenship.push('Passport number is required');
    if (!app.visaNo?.trim()) errorsBySection.citizenship.push('Visa number is required');
  }

  // 5. Academics
  if (!app.admissionTest) errorsBySection.academics.push('Admission test is required');
  if (!app.examYear) errorsBySection.academics.push('Exam year is required');
  if (!app.registrationNo?.trim()) errorsBySection.academics.push('Registration number is required');
  if (app.rank === undefined || app.rank === null || app.rank === '') {
    errorsBySection.academics.push('Rank is required');
  }

  // 10th
  if (!app.tenthExamName?.trim()) errorsBySection.academics.push('Class 10 exam name is required');
  if (!app.tenthBoard?.trim()) errorsBySection.academics.push('Class 10 board is required');
  if (!app.tenthYear) errorsBySection.academics.push('Class 10 passing year is required');
  if (app.tenthPercent === undefined || app.tenthPercent === null || app.tenthPercent === '') {
    errorsBySection.academics.push('Class 10 aggregate percentage is required');
  }
  if (!app.tenthSchool?.trim()) errorsBySection.academics.push('Class 10 school name is required');

  // 12th
  if (!app.twelfthExamName?.trim()) errorsBySection.academics.push('Class 12 exam name is required');
  if (!app.twelfthBoard?.trim()) errorsBySection.academics.push('Class 12 board is required');
  if (!app.class12Status) errorsBySection.academics.push('Class 12 status is required');
  if (app.class12Status === 'Passed') {
    if (app.twelfthPercent === undefined || app.twelfthPercent === null || app.twelfthPercent === '') {
      errorsBySection.academics.push('Class 12 aggregate percentage is required when passed');
    }
    const isBbaOrMba = ['bba', 'bba-llb', 'mba', 'mba-gm'].includes(app.programId?.toLowerCase());
    if (!isBbaOrMba) {
      if (app.marks12English === undefined || app.marks12English === null || app.marks12English === '') {
        errorsBySection.academics.push('Class 12 English marks are required');
      }
      if (app.marks12Physics === undefined || app.marks12Physics === null || app.marks12Physics === '') {
        errorsBySection.academics.push('Class 12 Physics marks are required');
      }
      if (app.marks12ChemCS === undefined || app.marks12ChemCS === null || app.marks12ChemCS === '') {
        errorsBySection.academics.push('Class 12 Chemistry / CS marks are required');
      }
      if (app.marks12Maths === undefined || app.marks12Maths === null || app.marks12Maths === '') {
        errorsBySection.academics.push('Class 12 Mathematics marks are required');
      }
    }
  }
  if (!app.twelfthSchool?.trim()) errorsBySection.academics.push('Class 12 school name is required');
  if (!app.twelfthSchoolAddress?.trim()) errorsBySection.academics.push('Class 12 school address is required');

  // PG degree
  const program = app.programId ? COURSE_BY_ID[app.programId.toLowerCase()] : null;
  const isPg = program?.level === 'PG' || app.level === 'PG';
  if (isPg) {
    if (!app.degreeName?.trim()) errorsBySection.academics.push('Degree name is required for PG programmes');
    if (!app.degreeBoard?.trim()) errorsBySection.academics.push('University/Board is required for PG programmes');
    if (!app.degreeYear) errorsBySection.academics.push('Degree passing year is required');
    if (app.degreePercent === undefined || app.degreePercent === null || app.degreePercent === '') {
      errorsBySection.academics.push('Degree percentage is required');
    }
    if (!app.degreeInstitution?.trim()) errorsBySection.academics.push('Institution name is required');
  }

  // 6. Other details
  if (!app.abcId?.trim()) errorsBySection.other.push('ABC ID is mandatory');

  // 7. Documents check
  const requiredSlots = getRequiredDocumentSlots(app);
  const missingDocumentSlots = [];
  for (const slot of requiredSlots) {
    const doc = documentsMap[slot.key];
    if (!doc || doc.upload_status === 'flagged') {
      errorsBySection.documents.push(`Missing required document: ${slot.label}`);
      missingDocumentSlots.push(slot.key);
    }
  }

  const allErrors = Object.values(errorsBySection).flat();
  const canSubmit = allErrors.length === 0;

  return {
    canSubmit,
    errorsBySection,
    allErrors,
    missingDocumentSlots,
    requiredSlots,
  };
}

export class ApplicationService {
  /**
   * Get or initialize application for the authenticated user
   */
  async getOrCreateApplication(user) {
    const userId = user.id;
    const client = getSupabaseClient();

    let application = null;
    let documentsMap = {};

    let course = null;
    if (client) {
      const { data, error } = await client
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        throw new BadRequestError(`Could not load application: ${error.message}`);
      }
      if (data) {
        application = data;
        if (data.course_id) {
          const courseResult = await client
            .from('courses')
            .select('name, stream')
            .eq('id', data.course_id)
            .maybeSingle();
          if (courseResult.error) {
            throw new BadRequestError(`Could not load selected course: ${courseResult.error.message}`);
          }
          course = courseResult.data;
        }
      }
    } else {
      application = inMemoryStore.applications.get(userId) || null;
    }

    // If no existing application, initialize a fresh draft populated with user profile
    if (!application) {
      const newApp = {
        id: crypto.randomUUID(),
        userId,
        fullName: user.fullName || '',
        email: user.email || '',
        mobile: user.mobile || '',
        countryCode: user.countryCode || '+91',
        gender: '',
        dob: '',
        category: 'General',
        programId: '',
        streamId: '',
        sameAsPresent: false,
        status: 'Draft',
        draftSavedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        flaggedSections: [],
      };

      if (client) {
        const { data: created, error } = await client
          .from('applications')
          .insert({
            id: newApp.id,
            user_id: userId,
            full_name: newApp.fullName,
            email: newApp.email,
            mobile: newApp.mobile,
            category: newApp.category,
            status: 'Draft',
            draft_saved_at: newApp.draftSavedAt,
          })
          .select()
          .single();

        if (!error && created) {
          application = created;
        } else {
          application = newApp;
        }
      } else {
        inMemoryStore.applications.set(userId, newApp);
        inMemoryStore.applicationsById.set(newApp.id, newApp);
        application = newApp;
      }
    }

    // Fetch documents
    documentsMap = await this.getDocumentsForApplication(application.id || application.userId);
    if (client && application.course_id !== undefined) {
      application = mapApplicationRow(application, course);
    }

    return {
      ...application,
      documents: documentsMap,
    };
  }

  /**
   * Get all document records attached to an application
   */
  async getDocumentsForApplication(applicationId) {
    const client = getSupabaseClient();
    const documentsMap = {};

    if (client) {
      const { data } = await client
        .from('application_documents')
        .select('*')
        .eq('application_id', applicationId);

      if (data) {
        for (const doc of data) {
          documentsMap[doc.slot] = {
            id: doc.id,
            slot: doc.slot,
            name: doc.original_filename,
            size: doc.file_size,
            type: doc.mime_type,
            status: doc.upload_status,
            adminComment: doc.admin_comment,
            uploadedAt: doc.uploaded_at,
          };
        }
      }
    } else {
      for (const [key, doc] of inMemoryStore.documents.entries()) {
        if (key.startsWith(`${applicationId}:`)) {
          documentsMap[doc.slot] = {
            id: doc.id,
            slot: doc.slot,
            name: doc.original_filename,
            size: doc.file_size,
            type: doc.mime_type,
            status: doc.upload_status,
            adminComment: doc.admin_comment,
            uploadedAt: doc.uploaded_at,
          };
        }
      }
    }

    return documentsMap;
  }

  /**
   * Save application as draft (FR7)
   */
  async saveDraft(user, draftData) {
    const current = await this.getOrCreateApplication(user);

    // Prevent editing if application is locked unless correction requested
    const lockedStatuses = ['Submitted', 'UnderReview', 'Approved', 'Rejected', 'AdmissionConfirmed'];
    if (lockedStatuses.includes(current.status)) {
      throw new ForbiddenError(
        `Application is ${current.status} and locked from editing.`
      );
    }

    const now = new Date().toISOString();
    const updated = {
      ...current,
      ...draftData,
      status: current.status === 'CorrectionRequested' ? 'CorrectionRequested' : 'Draft',
      draftSavedAt: now,
      updatedAt: now,
    };

    const client = getSupabaseClient();
    if (client) {
      const selectedProgram = updated.programId ? COURSE_BY_ID[updated.programId.toLowerCase()] : null;
      const selectedStream = selectedProgram?.streams.find((item) => item.id === updated.streamId);
      let courseId = null;
      if (selectedProgram && selectedStream) {
        const { data: course, error: courseError } = await client
          .from('courses')
          .select('id')
          .eq('academic_year', selectedProgram.academicYear)
          .eq('name', selectedProgram.name)
          .eq('stream', selectedStream.name)
          .maybeSingle();
        if (courseError) {
          throw new BadRequestError(`Could not save selected course: ${courseError.message}`);
        }
        courseId = course?.id || null;
      }

      const { error: updateError } = await client
        .from('applications')
        .update({
          course_id: courseId,
          stream: updated.streamId || updated.stream || null,
          full_name: updated.fullName,
          gender: updated.gender ? updated.gender[0].toUpperCase() : null,
          dob: updated.dob || null,
          email: updated.email,
          mobile: updated.mobile,
          present_address: {
            line1: updated.presentLine1,
            line2: updated.presentLine2,
            po: updated.presentPO,
            district: updated.presentDistrict,
            state: updated.presentState,
            pin: updated.presentPIN,
          },
          permanent_address: {
            line1: updated.permLine1,
            line2: updated.permLine2,
            po: updated.permPO,
            district: updated.permDistrict,
            state: updated.permState,
            pin: updated.permPIN,
          },
          same_as_present: Boolean(updated.sameAsPresent),
          father: {
            name: updated.fatherName,
            email: updated.fatherEmail,
            mobile: updated.fatherMobile,
          },
          mother: {
            name: updated.motherName,
            email: updated.motherEmail,
            mobile: updated.motherMobile,
          },
          guardian: {
            name: updated.guardianName,
            relation: updated.guardianRelation,
            office: updated.guardianOffice,
            phone: updated.guardianOfficePhone,
            monthlyIncome: updated.monthlyIncome,
            mobile: updated.guardianMobile,
          },
          is_foreign: updated.isForeign === 'Yes' || updated.isForeign === true,
          citizenship_details: {
            residence: updated.foreignResidence,
            passportNo: updated.passportNo,
            passportIssueDate: updated.passportIssueDate,
            visaNo: updated.visaNo,
            visaIssueDate: updated.visaIssueDate,
            visaIssuePlace: updated.visaIssuePlace,
          },
          admission_test: {
            test: updated.admissionTest,
            year: updated.examYear,
            registrationNo: updated.registrationNo,
            rank: updated.rank,
          },
          tenth: {
            examName: updated.tenthExamName,
            board: updated.tenthBoard,
            year: updated.tenthYear,
            percent: updated.tenthPercent,
            school: updated.tenthSchool,
            subjects: updated.tenthSubjects,
          },
          twelfth: {
            examName: updated.twelfthExamName,
            board: updated.twelfthBoard,
            year: updated.twelfthYear,
            percent: updated.twelfthPercent,
            school: updated.twelfthSchool,
            schoolAddress: updated.twelfthSchoolAddress,
            subjects: updated.twelfthSubjects,
          },
          twelfth_subjects: {
            english: updated.marks12English,
            physics: updated.marks12Physics,
            chemCS: updated.marks12ChemCS,
            maths: updated.marks12Maths,
          },
          class12_status: updated.class12Status || null,
          degree: {
            name: updated.degreeName,
            board: updated.degreeBoard,
            year: updated.degreeYear,
            percent: updated.degreePercent,
            institution: updated.degreeInstitution,
            subjects: updated.degreeSubjects,
          },
          post_graduate: {
            name: updated.pgName,
            board: updated.pgBoard,
            year: updated.pgYear,
            percent: updated.pgPercent,
            institution: updated.pgInstitution,
            subjects: updated.pgSubjects,
          },
          category: updated.category || 'General',
          blood_group: updated.bloodGroup,
          religion: updated.religion,
          activities: updated.activities,
          abc_id: updated.abcId,
          draft_saved_at: now,
          updated_at: now,
        })
        .eq('id', current.id);
      if (updateError) {
        throw new BadRequestError(`Could not save application draft: ${updateError.message}`);
      }
    } else {
      inMemoryStore.applications.set(user.id, updated);
      inMemoryStore.applicationsById.set(current.id, updated);
    }

    const documents = await this.getDocumentsForApplication(current.id);
    return {
      ...updated,
      documents,
    };
  }

  /**
   * Preview application summary and completeness state (FR10)
   */
  async getPreview(user) {
    const app = await this.getOrCreateApplication(user);
    const documents = app.documents || {};
    const evaluation = evaluateCompleteness(app, documents);

    return {
      application: app,
      documents,
      completeness: evaluation,
    };
  }

  /**
   * Submit application (FR11)
   */
  async submitApplication(user, { declaration } = {}) {
    if (!declaration) {
      throw new BadRequestError('You must confirm the declaration to submit the application.');
    }

    const app = await this.getOrCreateApplication(user);
    const documents = app.documents || {};

    // Validate completeness
    const evaluation = evaluateCompleteness(app, documents);
    if (!evaluation.canSubmit) {
      throw new BadRequestError(
        'Cannot submit incomplete application. Resolve the highlighted issues first.',
        {
          errorsBySection: evaluation.errorsBySection,
          errors: evaluation.allErrors,
          missingDocumentSlots: evaluation.missingDocumentSlots,
        }
      );
    }

    // Check allowed status
    if (app.status !== 'Draft' && app.status !== 'CorrectionRequested') {
      throw new ConflictError(`Application is already in ${app.status} status.`);
    }

    const now = new Date().toISOString();
    const applicationNo = app.applicationNo || generateApplicationNumber();

    const submittedApp = {
      ...app,
      applicationNo,
      status: 'Submitted',
      submittedAt: now,
      statusChangedAt: now,
      updatedAt: now,
      flaggedSections: [],
    };

    const client = getSupabaseClient();
    if (client) {
      await client
        .from('applications')
        .update({
          application_no: applicationNo,
          status: 'Submitted',
          submitted_at: now,
          status_changed_at: now,
          flagged_sections: [],
          updated_at: now,
        })
        .eq('id', app.id);
    } else {
      inMemoryStore.applications.set(user.id, submittedApp);
      inMemoryStore.applicationsById.set(app.id, submittedApp);
    }

    return {
      success: true,
      message: 'Application successfully submitted and locked for review.',
      applicationNo,
      application: submittedApp,
    };
  }

  /**
   * Upload a document into a labelled slot (FR9, FR6.3, FR6.4)
   */
  async uploadDocument(user, slot, file) {
    if (!file) {
      throw new BadRequestError('No file uploaded.');
    }

    // FR6.3 & FR6.4: Validate slot
    if (!ALLOWED_DOCUMENT_SLOTS.includes(slot)) {
      throw new BadRequestError(
        `Invalid document slot '${slot}'. Allowed slots: ${ALLOWED_DOCUMENT_SLOTS.join(', ')}`
      );
    }

    // FR6.3 & FR6.4: Validate format
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestError(
        `Unsupported format '${file.mimetype}'. Only PDF, JPEG, and PNG files are allowed.`
      );
    }

    // FR6.3 & FR6.4: Validate size <= 5MB
    if (file.size > MAX_DOCUMENT_FILE_SIZE) {
      throw new BadRequestError(
        `File exceeds 5MB limit. Uploaded file size is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      );
    }

    const app = await this.getOrCreateApplication(user);

    // Prevent uploads if locked
    const lockedStatuses = ['Submitted', 'UnderReview', 'Approved', 'Rejected', 'AdmissionConfirmed'];
    if (lockedStatuses.includes(app.status)) {
      throw new ForbiddenError(
        `Cannot upload documents: application is locked with status '${app.status}'.`
      );
    }

    let fileId = crypto.randomUUID();

    // Store file in MongoDB GridFS or in-memory
    let storedInGridFS = false;
    try {
      const bucket = getBucket();
      if (bucket) {
        const stream = bucket.openUploadStream(file.originalname, {
          metadata: {
            applicationId: app.id,
            slot,
            mimeType: file.mimetype,
            fileSize: file.size,
          },
        });
        stream.end(file.buffer);
        fileId = stream.id.toString();
        storedInGridFS = true;
      }
    } catch {
      // In-memory fallback
      storedInGridFS = false;
    }

    if (!storedInGridFS) {
      inMemoryStore.files.set(fileId, {
        buffer: file.buffer,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      });
    }

    const docRecord = {
      id: crypto.randomUUID(),
      application_id: app.id,
      slot,
      gridfs_file_id: fileId,
      original_filename: file.originalname,
      mime_type: file.mimetype,
      file_size: file.size,
      upload_status: 'uploaded',
      admin_comment: null,
      uploaded_at: new Date().toISOString(),
    };

    const client = getSupabaseClient();
    if (client) {
      const { data: existingDoc } = await client
        .from('application_documents')
        .select('id, gridfs_file_id')
        .eq('application_id', app.id)
        .eq('slot', slot)
        .maybeSingle();

      if (existingDoc) {
        await client
          .from('application_documents')
          .update({
            gridfs_file_id: fileId,
            original_filename: file.originalname,
            mime_type: file.mimetype,
            file_size: file.size,
            upload_status: 'uploaded',
            admin_comment: null,
            uploaded_at: new Date().toISOString(),
          })
          .eq('id', existingDoc.id);
      } else {
        await client.from('application_documents').insert(docRecord);
      }
    } else {
      inMemoryStore.documents.set(`${app.id}:${slot}`, docRecord);
    }

    return {
      success: true,
      message: `Document '${file.originalname}' uploaded successfully to slot '${slot}'.`,
      document: {
        slot,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        status: 'uploaded',
        uploadedAt: docRecord.uploaded_at,
      },
    };
  }

  /**
   * Delete uploaded document
   */
  async deleteDocument(user, slot) {
    const app = await this.getOrCreateApplication(user);

    const lockedStatuses = ['Submitted', 'UnderReview', 'Approved', 'Rejected', 'AdmissionConfirmed'];
    if (lockedStatuses.includes(app.status)) {
      throw new ForbiddenError(
        `Cannot remove documents: application is locked with status '${app.status}'.`
      );
    }

    const client = getSupabaseClient();
    if (client) {
      const { data: doc } = await client
        .from('application_documents')
        .select('*')
        .eq('application_id', app.id)
        .eq('slot', slot)
        .maybeSingle();

      if (doc) {
        try {
          await deleteFile(doc.gridfs_file_id);
        } catch {
          // Ignore GridFS delete error if file not found
        }
        await client
          .from('application_documents')
          .delete()
          .eq('id', doc.id);
      }
    } else {
      const doc = inMemoryStore.documents.get(`${app.id}:${slot}`);
      if (doc) {
        inMemoryStore.files.delete(doc.gridfs_file_id);
        inMemoryStore.documents.delete(`${app.id}:${slot}`);
      }
    }

    return {
      success: true,
      message: `Document removed from slot '${slot}'.`,
    };
  }

  /**
   * Get document file stream/buffer for viewing or download
   */
  async getDocumentFile(user, slot, applicationId = null) {
    let appId = applicationId;
    if (!appId) {
      const app = await this.getOrCreateApplication(user);
      appId = app.id;
    } else {
      // If user is applicant, ensure they own the application
      if (user.role === 'applicant') {
        const userApp = await this.getOrCreateApplication(user);
        if (userApp.id !== appId) {
          throw new ForbiddenError('You can only view documents from your own application');
        }
      }
    }

    let doc = null;
    const client = getSupabaseClient();
    if (client) {
      const { data } = await client
        .from('application_documents')
        .select('*')
        .eq('application_id', appId)
        .eq('slot', slot)
        .maybeSingle();
      doc = data;
    } else {
      doc = inMemoryStore.documents.get(`${appId}:${slot}`);
    }

    if (!doc) {
      throw new NotFoundError(`No document uploaded in slot '${slot}'`);
    }

    // Check if in MongoDB GridFS
    try {
      const downloadStream = openDownloadStream(doc.gridfs_file_id);
      return {
        stream: downloadStream,
        filename: doc.original_filename,
        mimeType: doc.mime_type,
        size: doc.file_size,
      };
    } catch {
      // In-memory fallback
      const stored = inMemoryStore.files.get(doc.gridfs_file_id);
      if (stored) {
        return {
          buffer: stored.buffer,
          filename: stored.filename,
          mimeType: stored.mimeType,
          size: stored.size,
        };
      }
    }

    throw new NotFoundError(`Document binary data not found for slot '${slot}'`);
  }

  /**
   * ADMIN: List all submitted applications (FR17)
   */
  async listApplications({ status, course, search, page = 1, limit = 20 } = {}) {
    const client = getSupabaseClient();
    if (client) {
      let query = client
        .from('applications')
        .select('*, courses(*)', { count: 'exact' });

      if (status) query = query.eq('status', status);
      if (course) {
        const selectedProgram = COURSE_BY_ID[course.toLowerCase()];
        if (selectedProgram) {
          const { data: courses, error: courseError } = await client
            .from('courses')
            .select('id')
            .eq('academic_year', selectedProgram.academicYear)
            .eq('name', selectedProgram.name);
          if (courseError) {
            throw new InternalServerError(`Could not filter applications by course: ${courseError.message}`);
          }
          const courseIds = (courses || []).map((item) => item.id);
          const streamIds = selectedProgram.streams.map((stream) => stream.id);
          const courseFilters = [];
          if (courseIds.length > 0) {
            courseFilters.push(`course_id.in.(${courseIds.join(',')})`);
          }
          if (streamIds.length > 0) {
            courseFilters.push(`and(course_id.is.null,stream.in.(${streamIds.join(',')}))`);
          }
          if (courseFilters.length === 0) {
            return { applications: [], total: 0, page, limit, totalPages: 0 };
          }
          query = query.or(courseFilters.join(','));
        } else {
          query = query.eq('course_id', course);
        }
      }
      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,application_no.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });
      if (error) {
        throw new InternalServerError(`Could not load applications: ${error.message}`);
      }

      return {
        applications: (data || []).map((application) =>
          mapApplicationRow(
            application,
            Array.isArray(application.courses) ? application.courses[0] : application.courses
          )
        ),
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    }

    // In-memory fallback
    let list = Array.from(inMemoryStore.applications.values());
    if (status) list = list.filter((a) => a.status === status);
    if (course) list = list.filter((a) => a.programId === course);
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.fullName?.toLowerCase().includes(s) ||
          a.applicationNo?.toLowerCase().includes(s) ||
          a.email?.toLowerCase().includes(s)
      );
    }

    const total = list.length;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      applications: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * ADMIN: Get single application with consolidated view & documents (FR6.1)
   */
  async getApplicationById(applicationId) {
    const client = getSupabaseClient();
    let app = null;

    if (client) {
      const { data, error } = await client
        .from('applications')
        .select('*, courses(*)')
        .eq('id', applicationId)
        .maybeSingle();
      if (error) {
        throw new InternalServerError(`Could not load application: ${error.message}`);
      }
      app = data;
    } else {
      app = inMemoryStore.applicationsById.get(applicationId);
      if (!app) {
        for (const a of inMemoryStore.applications.values()) {
          if (a.id === applicationId) {
            app = a;
            break;
          }
        }
      }
    }

    if (!app) {
      throw new NotFoundError(`Application with ID '${applicationId}' not found.`);
    }

    const course = Array.isArray(app.courses) ? app.courses[0] : app.courses;
    const normalizedApplication = getSupabaseClient()
      ? mapApplicationRow(app, course)
      : app;
    const documents = await this.getDocumentsForApplication(app.id);
    return {
      ...normalizedApplication,
      documents,
    };
  }

  /**
   * ADMIN: Verify or flag document (FR6.2)
   */
  async verifyOrFlagDocument(adminUser, applicationId, slot, { status, comment }) {
    if (!['verified', 'flagged'].includes(status)) {
      throw new BadRequestError("Document status must be 'verified' or 'flagged'");
    }

    const client = getSupabaseClient();
    const now = new Date().toISOString();

    if (client) {
      const { data: updated, error } = await client
        .from('application_documents')
        .update({
          upload_status: status,
          admin_comment: comment || null,
          verified_by: adminUser.id,
          verified_at: now,
        })
        .eq('application_id', applicationId)
        .eq('slot', slot)
        .select()
        .single();

      if (error) throw new BadRequestError(error.message);
      return updated;
    }

    const key = `${applicationId}:${slot}`;
    const doc = inMemoryStore.documents.get(key);
    if (!doc) {
      throw new NotFoundError(`Document not found in slot '${slot}'`);
    }

    doc.upload_status = status;
    doc.admin_comment = comment || null;
    doc.verified_by = adminUser.id;
    doc.verified_at = now;

    return doc;
  }

  /**
   * ADMIN: Record admission decision (Approve or Reject with mandatory reason) (FR18)
   */
  async recordDecision(adminUser, applicationId, { decision, reason }) {
    if (!['Approved', 'Rejected'].includes(decision)) {
      throw new BadRequestError("Decision must be either 'Approved' or 'Rejected'");
    }

    if (decision === 'Rejected' && (!reason || reason.trim() === '')) {
      throw new BadRequestError('A specific reason is mandatory when rejecting an application.');
    }

    const app = await this.getApplicationById(applicationId);
    const now = new Date().toISOString();

    const client = getSupabaseClient();
    if (client) {
      await client
        .from('applications')
        .update({
          status: decision,
          decision_by: adminUser.id,
          decision_at: now,
          decision_reason: reason || null,
          status_changed_at: now,
          updated_at: now,
        })
        .eq('id', applicationId);
    } else {
      app.status = decision;
      app.decision = { by: adminUser.id, at: now, reason: reason || null };
      app.statusChangedAt = now;
      app.updatedAt = now;
    }

    return {
      success: true,
      message: `Application status updated to '${decision}'.`,
      applicationId,
      status: decision,
    };
  }

  /**
   * ADMIN: Request correction from applicant (FR12)
   */
  async requestCorrection(adminUser, applicationId, { flaggedSections = [], comment }) {
    const app = await this.getApplicationById(applicationId);
    const now = new Date().toISOString();

    const client = getSupabaseClient();
    if (client) {
      await client
        .from('applications')
        .update({
          status: 'CorrectionRequested',
          flagged_sections: flaggedSections,
          decision_reason: comment || null,
          status_changed_at: now,
          updated_at: now,
        })
        .eq('id', applicationId);
    } else {
      // Build an updated application object and write it back to both maps
      const updatedApp = {
        ...app,
        status: 'CorrectionRequested',
        flaggedSections,
        statusChangedAt: now,
        updatedAt: now,
      };
      inMemoryStore.applicationsById.set(app.id, updatedApp);
      // Also update the by-userId map
      for (const [uid, a] of inMemoryStore.applications.entries()) {
        if (a.id === app.id) {
          inMemoryStore.applications.set(uid, updatedApp);
          break;
        }
      }
    }

    return {
      success: true,
      message: 'Correction requested from applicant.',
      status: 'CorrectionRequested',
      flaggedSections,
    };
  }

  /**
   * ADMIN: Get aggregate dashboard statistics (FR19)
   */
  async getDashboardStats() {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client
        .from('applications')
        .select('id, status, course_id, stream, created_at, submitted_at, courses(name, stream)');
      if (error) {
        throw new InternalServerError(`Could not load dashboard statistics: ${error.message}`);
      }

      const apps = data || [];
      const total = apps.length;
      const byStatus = {
        Draft: 0,
        Submitted: 0,
        UnderReview: 0,
        CorrectionRequested: 0,
        Approved: 0,
        Rejected: 0,
        AdmissionConfirmed: 0,
      };
      const byCourse = {};

      for (const a of apps) {
        const s = a.status || 'Draft';
        if (byStatus[s] !== undefined) {
          byStatus[s]++;
        } else {
          byStatus[s] = 1;
        }
        const relatedCourse = Array.isArray(a.courses) ? a.courses[0] : a.courses;
        const program = relatedCourse
          ? COURSES_CATALOGUE.find((item) => item.name === relatedCourse.name)
          : COURSES_CATALOGUE.find((item) => item.streams.some(
            (stream) => stream.id === a.stream || stream.name === a.stream
          ));
        const c = program?.id || a.course_id || 'unassigned';
        byCourse[c] = (byCourse[c] || 0) + 1;
      }

      return {
        total,
        byStatus,
        byCourse,
        submittedTotal: total - (byStatus.Draft || 0),
        pendingReview: (byStatus.Submitted || 0) + (byStatus.UnderReview || 0),
        approved: byStatus.Approved || 0,
        rejected: byStatus.Rejected || 0,
        correctionRequested: byStatus.CorrectionRequested || 0,
      };
    }

    // In-memory store fallback
    const apps = Array.from(inMemoryStore.applications.values());
    const total = apps.length;
    const byStatus = {
      Draft: 0,
      Submitted: 0,
      UnderReview: 0,
      CorrectionRequested: 0,
      Approved: 0,
      Rejected: 0,
      AdmissionConfirmed: 0,
    };
    const byCourse = {};

    for (const a of apps) {
      const s = a.status || 'Draft';
      byStatus[s] = (byStatus[s] || 0) + 1;
      const c = a.programId || 'unassigned';
      byCourse[c] = (byCourse[c] || 0) + 1;
    }

    return {
      total,
      byStatus,
      byCourse,
      submittedTotal: total - (byStatus.Draft || 0),
      pendingReview: (byStatus.Submitted || 0) + (byStatus.UnderReview || 0),
      approved: byStatus.Approved || 0,
      rejected: byStatus.Rejected || 0,
      correctionRequested: byStatus.CorrectionRequested || 0,
    };
  }

  /**
   * ADMIN: Export applications as CSV format (FR19)
   */
  async exportApplications({ status, course } = {}) {
    const listRes = await this.listApplications({ status, course, limit: 10000 });
    const apps = listRes.applications || [];

    const headers = [
      'Application No',
      'Full Name',
      'Email',
      'Mobile',
      'Programme',
      'Stream',
      'Status',
      'Category',
      'Submitted At',
      'Decision Reason',
    ];

    const escapeCsv = (val) => {
      if (val == null) return '""';
      const str = String(val).replace(/"/g, '""');
      return '"' + str + '"';
    };

    const rows = apps.map((a) =>
      [
        escapeCsv(a.applicationNo || a.application_no || 'DRAFT'),
        escapeCsv(a.fullName || a.full_name || ''),
        escapeCsv(a.email || ''),
        escapeCsv(a.mobile || ''),
        escapeCsv(a.programId || a.course_id || ''),
        escapeCsv(a.streamId || a.stream || ''),
        escapeCsv(a.status || 'Draft'),
        escapeCsv(a.category || ''),
        escapeCsv(a.submittedAt || a.submitted_at || ''),
        escapeCsv(a.decisionReason || a.decision_reason || a.decision?.reason || ''),
      ].join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

}

export const applicationService = new ApplicationService();
export default applicationService;
