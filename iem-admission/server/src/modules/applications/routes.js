import express from 'express';
import multer from 'multer';
import { applicationService } from './service.js';
import { authenticate } from '../../middleware/auth.js';
import { requireAdmin } from '../../middleware/rbac.js';
import { BadRequestError } from '../../errors.js';
import { MAX_DOCUMENT_FILE_SIZE } from '../../db/validators.js';

export const applicationsRouter = express.Router();
export const adminApplicationsRouter = express.Router();

// Configure multer with in-memory storage and 5MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_DOCUMENT_FILE_SIZE,
  },
});

/**
 * Middleware to handle Multer upload errors gracefully with specific reasons (FR6.4)
 */
function handleUpload(fieldName) {
  const multerMiddleware = upload.single(fieldName);
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new BadRequestError('File exceeds 5MB limit. Please upload a file smaller than 5 MB.')
          );
        }
        return next(new BadRequestError(`Upload failed: ${err.message}`));
      }
      next();
    });
  };
}

/* ==========================================================================
   Applicant Routes (/api/applications)
   ========================================================================== */

/**
 * GET /api/applications/me
 * Retrieve the current applicant's application and attached documents
 */
applicationsRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const application = await applicationService.getOrCreateApplication(req.user);
    res.status(200).json({
      success: true,
      application,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/applications/me
 * Save application form as draft (FR7)
 */
applicationsRouter.put('/me', authenticate, async (req, res, next) => {
  try {
    const updated = await applicationService.saveDraft(req.user, req.body);
    res.status(200).json({
      success: true,
      message: 'Draft saved successfully with timestamp.',
      application: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/applications/me/preview
 * Read-only summary in form order + completeness evaluation (FR10)
 */
applicationsRouter.get('/me/preview', authenticate, async (req, res, next) => {
  try {
    const previewData = await applicationService.getPreview(req.user);
    res.status(200).json({
      success: true,
      ...previewData,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/applications/me/submit
 * Final submission & locking of application (FR11)
 */
applicationsRouter.post('/me/submit', authenticate, async (req, res, next) => {
  try {
    const { declaration } = req.body;
    const result = await applicationService.submitApplication(req.user, { declaration });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/applications/me/documents/:slot
 * Upload document to labelled slot (FR9, FR6.3, FR6.4)
 */
applicationsRouter.post(
  '/me/documents/:slot',
  authenticate,
  handleUpload('file'),
  async (req, res, next) => {
    try {
      const { slot } = req.params;
      const file = req.file;
      const result = await applicationService.uploadDocument(req.user, slot, file);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/applications/me/documents/:slot
 * Retrieve document metadata
 */
applicationsRouter.get('/me/documents/:slot', authenticate, async (req, res, next) => {
  try {
    const { slot } = req.params;
    const app = await applicationService.getOrCreateApplication(req.user);
    const doc = app.documents?.[slot];
    if (!doc) {
      throw new BadRequestError(`No document found in slot '${slot}'`);
    }
    res.status(200).json({
      success: true,
      document: doc,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/applications/me/documents/:slot/file
 * Stream/download the uploaded document file
 */
applicationsRouter.get('/me/documents/:slot/file', authenticate, async (req, res, next) => {
  try {
    const { slot } = req.params;
    const fileResult = await applicationService.getDocumentFile(req.user, slot);

    res.setHeader('Content-Type', fileResult.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileResult.filename)}"`
    );
    if (fileResult.size) {
      res.setHeader('Content-Length', fileResult.size);
    }

    if (fileResult.stream) {
      fileResult.stream.pipe(res);
    } else if (fileResult.buffer) {
      res.send(fileResult.buffer);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/applications/me/documents/:slot
 * Remove uploaded document
 */
applicationsRouter.delete('/me/documents/:slot', authenticate, async (req, res, next) => {
  try {
    const { slot } = req.params;
    const result = await applicationService.deleteDocument(req.user, slot);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/* ==========================================================================
   Admin Routes (/api/admin/applications)
   ========================================================================== */

/**
 * GET /api/admin/applications
 * List and filter applications (FR17)
 */
adminApplicationsRouter.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, course, search, page, limit } = req.query;
    const result = await applicationService.listApplications({
      status,
      course,
      search,
      page: page ? Number.parseInt(page, 10) : 1,
      limit: limit ? Number.parseInt(limit, 10) : 20,
    });
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/applications/:id
 * Consolidated review view (FR6.1)
 */
adminApplicationsRouter.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const application = await applicationService.getApplicationById(id);
    res.status(200).json({
      success: true,
      application,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/admin/applications/:id/documents/:slot/file
 * View an applicant's document binary file
 */
adminApplicationsRouter.get('/:id/documents/:slot/file', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id, slot } = req.params;
    const fileResult = await applicationService.getDocumentFile(req.user, slot, id);

    res.setHeader('Content-Type', fileResult.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileResult.filename)}"`
    );
    if (fileResult.size) {
      res.setHeader('Content-Length', fileResult.size);
    }

    if (fileResult.stream) {
      fileResult.stream.pipe(res);
    } else if (fileResult.buffer) {
      res.send(fileResult.buffer);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/admin/applications/:id/documents/:slot
 * Verify or flag a document with an optional comment (FR6.2)
 */
adminApplicationsRouter.patch('/:id/documents/:slot', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id, slot } = req.params;
    const { status, comment } = req.body;
    const updated = await applicationService.verifyOrFlagDocument(req.user, id, slot, {
      status,
      comment,
    });
    res.status(200).json({
      success: true,
      message: `Document slot '${slot}' marked as '${status}'.`,
      document: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/applications/:id/decision
 * Approve or Reject application (FR18)
 */
adminApplicationsRouter.post('/:id/decision', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;
    const result = await applicationService.recordDecision(req.user, id, { decision, reason });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/applications/:id/request-correction
 * Request correction on specific sections (FR12)
 */
adminApplicationsRouter.post('/:id/request-correction', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { flaggedSections, comment } = req.body;
    const result = await applicationService.requestCorrection(req.user, id, {
      flaggedSections,
      comment,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default applicationsRouter;
