import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { resetAuthStore, setInMemoryUserRole } from '../src/modules/auth/service.js';
import {
  evaluateCompleteness,
  mapApplicationRow,
  resetApplicationStore,
} from '../src/modules/applications/service.js';

describe('Phase 3 — Applications & Documents Module Tests', () => {
  let applicantCookie = '';
  let adminCookie = '';
  let applicantId = '';
  let adminId = '';

  const applicantData = {
    fullName: 'Debapriya Roy',
    email: 'debapriya@example.com',
    mobile: '9830112233',
    password: 'Password@2026',
    consent: true,
  };

  const adminData = {
    fullName: 'Admission Officer',
    email: 'officer@iem.edu.in',
    mobile: '9830998877',
    password: 'Password@2026',
    consent: true,
  };

  beforeEach(async () => {
    resetAuthStore();
    resetApplicationStore();

    // 1. Register & verify applicant
    const regRes = await request(app).post('/api/auth/register').send(applicantData);
    applicantId = regRes.body.user.id;
    await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: applicantData.email, otp: regRes.body.otpCode });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ identifier: applicantData.email, password: applicantData.password });
    applicantCookie = loginRes.headers['set-cookie']?.[0] || '';

    // 2. Register, verify & elevate admin
    const adminReg = await request(app).post('/api/auth/register').send(adminData);
    adminId = adminReg.body.user.id;
    setInMemoryUserRole(adminId, 'admin');
    await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: adminData.email, otp: adminReg.body.otpCode });

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: adminData.email, password: adminData.password });
    adminCookie = adminLogin.headers['set-cookie']?.[0] || '';
  });

  it('maps Supabase application rows into the form shape used for completeness checks', () => {
    const application = mapApplicationRow({
      id: 'application-id',
      course_id: null,
      stream: 'cse',
      full_name: 'Debapriya Roy',
      gender: 'F',
      dob: '2005-04-12',
      email: 'debapriya@example.com',
      mobile: '9830112233',
      present_address: { line1: 'Sector V', pin: '700091' },
      permanent_address: { line1: 'Sector V', pin: '700091' },
      same_as_present: true,
      father: { name: 'Alok Roy' },
      mother: { name: 'Sunita Roy' },
      guardian: { name: 'Alok Roy', office: 'Office', monthlyIncome: 75000 },
      is_foreign: false,
      admission_test: { test: 'IEMJEE', year: 2026, registrationNo: 'IEM2026-9876', rank: 142 },
      tenth: { examName: 'ICSE', board: 'CISCE', year: 2022, percent: 88.5, school: 'Modern High School', subjects: 'Science' },
      twelfth: { examName: 'ISC', board: 'CISCE', year: 2024, percent: 85, school: 'Modern High School', schoolAddress: 'Kolkata' },
      twelfth_subjects: { english: 85, physics: 82, chemCS: 84, maths: 88 },
      class12_status: 'Passed',
      category: 'General',
      abc_id: 'ABC-1234',
    });
    const documents = Object.fromEntries(
      ['marksheet10', 'marksheet12', 'idProof', 'photograph'].map((slot) => [slot, { status: 'uploaded' }])
    );

    assert.equal(application.programId, 'btech');
    assert.equal(application.programName, 'B.Tech');
    assert.equal(application.streamId, 'cse');
    assert.equal(application.streamName, 'Computer Science & Engineering');
    assert.equal(application.gender, 'Female');
    assert.equal(application.isForeign, 'No');
    assert.equal(application.marks12Maths, 88);
    assert.equal(evaluateCompleteness(application, documents).canSubmit, true);
  });

  describe('1. Course Catalogue (FR4, FR5)', () => {
    it('GET /api/courses should return available programmes', async () => {
      const res = await request(app).get('/api/courses');
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(res.body.courses.length >= 8);
      const btech = res.body.courses.find((c) => c.id === 'btech');
      assert.ok(btech);
      assert.equal(btech.level, 'UG');
      assert.ok(btech.streams.some((s) => s.id === 'cse'));
    });

    it('GET /api/courses?level=PG should filter by level', async () => {
      const res = await request(app).get('/api/courses?level=PG');
      assert.equal(res.status, 200);
      assert.ok(res.body.courses.every((c) => c.level === 'PG'));
    });
  });

  describe('2. Application Draft & Auto-Resume (FR4, FR7, FR8)', () => {
    it('GET /api/applications/me should initialize a draft for authenticated applicant', async () => {
      const res = await request(app)
        .get('/api/applications/me')
        .set('Cookie', applicantCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.application.status, 'Draft');
      assert.equal(res.body.application.email, applicantData.email);
    });

    it('PUT /api/applications/me should save partial application data with timestamp', async () => {
      const draftPayload = {
        programId: 'btech',
        streamId: 'cse',
        fullName: 'Debapriya Roy',
        gender: 'Female',
        dob: '2005-04-12',
        category: 'General',
        presentLine1: 'Salt Lake Sector V',
        presentPIN: '700091',
        sameAsPresent: true,
      };

      const res = await request(app)
        .put('/api/applications/me')
        .set('Cookie', applicantCookie)
        .send(draftPayload);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.application.programId, 'btech');
      assert.equal(res.body.application.streamId, 'cse');
      assert.ok(res.body.application.draftSavedAt);

      // Verify auto-resume on subsequent fetch
      const resumeRes = await request(app)
        .get('/api/applications/me')
        .set('Cookie', applicantCookie);

      assert.equal(resumeRes.status, 200);
      assert.equal(resumeRes.body.application.programId, 'btech');
      assert.equal(resumeRes.body.application.presentLine1, 'Salt Lake Sector V');
    });
  });

  describe('3. Document Upload Validation & Storage (FR9, FR6.3, FR6.4)', () => {
    it('should reject file upload with unsupported MIME type with specific error message', async () => {
      const res = await request(app)
        .post('/api/applications/me/documents/marksheet10')
        .set('Cookie', applicantCookie)
        .attach('file', Buffer.from('fake-exe-content'), {
          filename: 'document.exe',
          contentType: 'application/x-msdownload',
        });

      assert.equal(res.status, 400);
      assert.ok(res.body.error.message.includes('Unsupported format'));
    });

    it('should reject file upload to an invalid slot', async () => {
      const res = await request(app)
        .post('/api/applications/me/documents/invalid_slot_name')
        .set('Cookie', applicantCookie)
        .attach('file', Buffer.from('pdf content'), {
          filename: 'doc.pdf',
          contentType: 'application/pdf',
        });

      assert.equal(res.status, 400);
      assert.ok(res.body.error.message.includes('Invalid document slot'));
    });

    it('should accept valid PDF/JPG uploads within 5MB and store metadata', async () => {
      const dummyPdf = Buffer.from('%PDF-1.4 test mark sheet content');
      const res = await request(app)
        .post('/api/applications/me/documents/marksheet10')
        .set('Cookie', applicantCookie)
        .attach('file', dummyPdf, {
          filename: '10th_marksheet.pdf',
          contentType: 'application/pdf',
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.document.slot, 'marksheet10');
      assert.equal(res.body.document.status, 'uploaded');

      // Verify document is now attached to the application
      const appRes = await request(app)
        .get('/api/applications/me')
        .set('Cookie', applicantCookie);

      assert.ok(appRes.body.application.documents.marksheet10);
      assert.equal(appRes.body.application.documents.marksheet10.name, '10th_marksheet.pdf');
    });

    it('should stream/download the uploaded file via GET /documents/:slot/file', async () => {
      const dummyPdf = Buffer.from('%PDF-1.4 binary content download test');
      await request(app)
        .post('/api/applications/me/documents/idProof')
        .set('Cookie', applicantCookie)
        .attach('file', dummyPdf, {
          filename: 'aadhaar_card.pdf',
          contentType: 'application/pdf',
        });

      const res = await request(app)
        .get('/api/applications/me/documents/idProof/file')
        .set('Cookie', applicantCookie);

      assert.equal(res.status, 200);
      assert.equal(res.headers['content-type'], 'application/pdf');
      assert.ok(res.headers['content-disposition'].includes('aadhaar_card.pdf'));
    });

    it('should allow deleting an uploaded document in Draft status', async () => {
      const dummyPdf = Buffer.from('temp doc');
      await request(app)
        .post('/api/applications/me/documents/photograph')
        .set('Cookie', applicantCookie)
        .attach('file', dummyPdf, {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        });

      const delRes = await request(app)
        .delete('/api/applications/me/documents/photograph')
        .set('Cookie', applicantCookie);

      assert.equal(delRes.status, 200);
      assert.equal(delRes.body.success, true);

      // Verify slot is now empty
      const appRes = await request(app)
        .get('/api/applications/me')
        .set('Cookie', applicantCookie);

      assert.equal(appRes.body.application.documents.photograph, undefined);
    });
  });

  describe('4. Preview & Submission Workflow (FR10, FR11)', () => {
    it('GET /api/applications/me/preview should flag incomplete application and block submit', async () => {
      const previewRes = await request(app)
        .get('/api/applications/me/preview')
        .set('Cookie', applicantCookie);

      assert.equal(previewRes.status, 200);
      assert.equal(previewRes.body.completeness.canSubmit, false);
      assert.ok(previewRes.body.completeness.allErrors.length > 0);

      // Attempting to submit while incomplete should fail with 400
      const submitRes = await request(app)
        .post('/api/applications/me/submit')
        .set('Cookie', applicantCookie)
        .send({ declaration: true });

      assert.equal(submitRes.status, 400);
      assert.ok(submitRes.body.error.message.includes('incomplete'));
      assert.ok(submitRes.body.error.details.errorsBySection.personal.length > 0);
    });

    it('POST /api/applications/me/submit should succeed when all fields & documents are complete', async () => {
      // 1. Fill complete valid application
      const fullForm = {
        programId: 'btech',
        streamId: 'cse',
        fullName: 'Debapriya Roy',
        gender: 'Female',
        dob: '2005-04-12',
        email: 'debapriya@example.com',
        mobile: '9830112233',
        category: 'General',
        presentLine1: 'Sector V, Salt Lake',
        presentPIN: '700091',
        sameAsPresent: true,
        fatherName: 'Alok Roy',
        motherName: 'Sunita Roy',
        guardianName: 'Alok Roy',
        guardianOffice: 'Govt. of WB, Salt Lake',
        monthlyIncome: 75000,
        isForeign: 'No',
        admissionTest: 'IEMJEE',
        examYear: 2026,
        registrationNo: 'IEM2026-9876',
        rank: 142,
        tenthExamName: 'ICSE',
        tenthBoard: 'CISCE',
        tenthYear: 2022,
        tenthPercent: 88.5,
        tenthSchool: 'Modern High School',
        twelfthExamName: 'ISC',
        twelfthBoard: 'CISCE',
        class12Status: 'Passed',
        twelfthYear: 2024,
        twelfthPercent: 85.0,
        marks12English: 85,
        marks12Physics: 82,
        marks12ChemCS: 84,
        marks12Maths: 88,
        twelfthSchool: 'Modern High School',
        twelfthSchoolAddress: 'Kolkata, WB',
        abcId: 'ABC-1234-5678-9012',
      };

      await request(app)
        .put('/api/applications/me')
        .set('Cookie', applicantCookie)
        .send(fullForm);

      // 2. Upload mandatory documents for UG General (marksheet10, marksheet12, idProof, photograph)
      const slots = ['marksheet10', 'marksheet12', 'idProof', 'photograph'];
      for (const slot of slots) {
        await request(app)
          .post(`/api/applications/me/documents/${slot}`)
          .set('Cookie', applicantCookie)
          .attach('file', Buffer.from(`dummy file for ${slot}`), {
            filename: `${slot}.pdf`,
            contentType: 'application/pdf',
          });
      }

      // 3. Preview should now report canSubmit: true
      const previewRes = await request(app)
        .get('/api/applications/me/preview')
        .set('Cookie', applicantCookie);

      assert.equal(previewRes.status, 200);
      assert.equal(previewRes.body.completeness.canSubmit, true);

      // 4. Submit application
      const submitRes = await request(app)
        .post('/api/applications/me/submit')
        .set('Cookie', applicantCookie)
        .send({ declaration: true });

      assert.equal(submitRes.status, 200);
      assert.equal(submitRes.body.success, true);
      assert.equal(submitRes.body.application.status, 'Submitted');
      assert.ok(submitRes.body.applicationNo.startsWith('UEM-'));

      // 5. Subsequent draft save should be locked (Forbidden 403)
      const editAfterSubmit = await request(app)
        .put('/api/applications/me')
        .set('Cookie', applicantCookie)
        .send({ fullName: 'Tampered Name' });

      assert.equal(editAfterSubmit.status, 403);
    });
  });

  describe('5. Admin Review & Verification (FR6, FR17, FR18)', () => {
    let submittedAppId = '';

    beforeEach(async () => {
      // Create and submit an application
      await request(app).put('/api/applications/me').set('Cookie', applicantCookie).send({
        programId: 'bba',
        streamId: 'bba',
        fullName: 'Debapriya Roy',
        gender: 'Female',
        dob: '2005-04-12',
        email: 'debapriya@example.com',
        mobile: '9830112233',
        category: 'General',
        presentLine1: 'Sector V',
        presentPIN: '700091',
        sameAsPresent: true,
        fatherName: 'Alok Roy',
        motherName: 'Sunita Roy',
        guardianName: 'Alok Roy',
        guardianOffice: 'Office',
        monthlyIncome: 60000,
        isForeign: 'No',
        admissionTest: 'IEMCET',
        examYear: 2026,
        registrationNo: 'REG-100',
        rank: 55,
        tenthExamName: 'ICSE',
        tenthBoard: 'CISCE',
        tenthYear: 2022,
        tenthPercent: 80,
        tenthSchool: 'School',
        twelfthExamName: 'ISC',
        twelfthBoard: 'CISCE',
        class12Status: 'Appearing',
        twelfthYear: 2026,
        twelfthSchool: 'School',
        twelfthSchoolAddress: 'Kolkata',
        abcId: 'ABC-1234',
      });

      for (const slot of ['marksheet10', 'marksheet12', 'idProof', 'photograph']) {
        await request(app)
          .post(`/api/applications/me/documents/${slot}`)
          .set('Cookie', applicantCookie)
          .attach('file', Buffer.from(`content for ${slot}`), {
            filename: `${slot}.pdf`,
            contentType: 'application/pdf',
          });
      }

      const submitRes = await request(app)
        .post('/api/applications/me/submit')
        .set('Cookie', applicantCookie)
        .send({ declaration: true });

      submittedAppId = submitRes.body.application.id;
    });

    it('GET /api/admin/applications should list submitted applications', async () => {
      const res = await request(app)
        .get('/api/admin/applications')
        .set('Cookie', adminCookie);

      assert.equal(res.status, 200);
      assert.ok(res.body.applications.length >= 1);
    });

    it('GET /api/admin/applications/:id should provide consolidated view', async () => {
      const res = await request(app)
        .get(`/api/admin/applications/${submittedAppId}`)
        .set('Cookie', adminCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.application.id, submittedAppId);
      assert.ok(res.body.application.documents.marksheet10);
    });

    it('PATCH /api/admin/applications/:id/documents/:slot should verify or flag documents (FR6.2)', async () => {
      const res = await request(app)
        .patch(`/api/admin/applications/${submittedAppId}/documents/marksheet10`)
        .set('Cookie', adminCookie)
        .send({ status: 'verified', comment: 'Marks verified against CISCE portal' });

      assert.equal(res.status, 200);
      assert.equal(res.body.document.upload_status, 'verified');
    });

    it('POST /api/admin/applications/:id/decision should reject with mandatory reason (FR18)', async () => {
      // Rejection without reason must fail
      const failedReject = await request(app)
        .post(`/api/admin/applications/${submittedAppId}/decision`)
        .set('Cookie', adminCookie)
        .send({ decision: 'Rejected', reason: '' });

      assert.equal(failedReject.status, 400);

      // Valid rejection with reason
      const validReject = await request(app)
        .post(`/api/admin/applications/${submittedAppId}/decision`)
        .set('Cookie', adminCookie)
        .send({ decision: 'Rejected', reason: 'Class 12 eligibility cutoff not met' });

      assert.equal(validReject.status, 200);
      assert.equal(validReject.body.status, 'Rejected');
    });

    it('POST /api/admin/applications/:id/decision should approve application (FR18)', async () => {
      const approveRes = await request(app)
        .post(`/api/admin/applications/${submittedAppId}/decision`)
        .set('Cookie', adminCookie)
        .send({ decision: 'Approved' });

      assert.equal(approveRes.status, 200);
      assert.equal(approveRes.body.status, 'Approved');
    });

    it('GET /api/admin/applications/dashboard and /api/admin/dashboard should return metrics', async () => {
      const res = await request(app)
        .get('/api/admin/applications/dashboard')
        .set('Cookie', adminCookie);

      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.ok(typeof res.body.stats.total === 'number');
      assert.ok(typeof res.body.stats.byCourse === 'object');

      // Test alias
      const aliasRes = await request(app)
        .get('/api/admin/dashboard')
        .set('Cookie', adminCookie);
      assert.equal(aliasRes.status, 200);
      assert.equal(aliasRes.body.success, true);
    });

    it('GET /api/admin/applications/export and /api/admin/export should return CSV data', async () => {
      const res = await request(app)
        .get('/api/admin/applications/export')
        .set('Cookie', adminCookie);

      assert.equal(res.status, 200);
      assert.ok(res.headers['content-type'].includes('text/csv'));
      assert.ok(res.text.includes('Application No'));

      // Test alias
      const aliasRes = await request(app)
        .get('/api/admin/export')
        .set('Cookie', adminCookie);
      assert.equal(aliasRes.status, 200);
      assert.ok(aliasRes.headers['content-type'].includes('text/csv'));
    });

    it('GET /api/admin/applications/:id/documents/:slot/file streams document', async () => {
      const streamRes = await request(app)
        .get('/api/admin/applications/' + submittedAppId + '/documents/marksheet10/file')
        .set('Cookie', adminCookie);

      assert.equal(streamRes.status, 200);
      assert.equal(streamRes.headers['content-type'], 'application/pdf');
    });

    it('Correction Workflow: admin flags sections, applicant corrects flagged section & resubmits (FR12)', async () => {
      // 1. Admin flags 'academic' section
      const flagRes = await request(app)
        .post('/api/admin/applications/' + submittedAppId + '/request-correction')
        .set('Cookie', adminCookie)
        .send({
          flaggedSections: ['academic'],
          comment: 'Please check your 10th percentage against your marksheet.',
        });

      assert.equal(flagRes.status, 200);
      assert.equal(flagRes.body.status, 'CorrectionRequested');
      assert.deepEqual(flagRes.body.flaggedSections, ['academic']);

      // 2. Applicant edits flagged section (academic) -> should succeed
      const editAcademic = await request(app)
        .put('/api/applications/me')
        .set('Cookie', applicantCookie)
        .send({
          tenthPercent: 85,
        });

      assert.equal(editAcademic.status, 200);
      // In-memory store: flat structure; check either flat or nested depending on the returned shape
      const appData = editAcademic.body.application;
      const tenthPct = appData.tenthPercent ?? appData.academic?.tenthPercent ?? appData.academic?.tenth?.percent;
      assert.equal(tenthPct, 85);

      // 3. Applicant resubmits application -> should lock and return status to Submitted
      const resubmit = await request(app)
        .post('/api/applications/me/submit')
        .set('Cookie', applicantCookie)
        .send({ declaration: true });

      assert.equal(resubmit.status, 200);
      assert.equal(resubmit.body.application.status, 'Submitted');
      assert.deepEqual(resubmit.body.application.flaggedSections, []);
    });

  });
});
