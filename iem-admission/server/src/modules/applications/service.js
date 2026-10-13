import crypto from 'crypto';
import { getSupabaseClient } from '../../db/supabase.js';
import { getBucket, uploadStream, openDownloadStream, deleteFile } from '../../db/gridfs.js';
import { COURSE_BY_ID } from '../courses/coursesData.js';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
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

    if (client) {
      const { data, error } = await client
        .from('applications')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        application = data;
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
      await client
        .from('applications')
        .update({
          course_id: updated.courseId || null,
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
      if (course) query = query.eq('course_id', course);
      if (search) {
        query = query.or(
          `full_name.ilike.%${search}%,application_no.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data, count, error } = await query.range(from, to).order('created_at', { ascending: false });

      return {
        applications: data || [],
        total: count || 0,
        page,
        limit,
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
    };
  }

  /**
   * ADMIN: Get single application with consolidated view & documents (FR6.1)
   */
  async getApplicationById(applicationId) {
    const client = getSupabaseClient();
    let app = null;

    if (client) {
      const { data } = await client
        .from('applications')
        .select('*, courses(*)')
        .eq('id', applicationId)
        .maybeSingle();
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

    const documents = await this.getDocumentsForApplication(app.id);
    return {
      ...app,
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
      app.status = 'CorrectionRequested';
      app.flaggedSections = flaggedSections;
      app.statusChangedAt = now;
      app.updatedAt = now;
    }

    return {
      success: true,
      message: 'Correction requested from applicant.',
      status: 'CorrectionRequested',
    };
  }
}

export const applicationService = new ApplicationService();
export default applicationService;
