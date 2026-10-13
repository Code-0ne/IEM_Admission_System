import { z } from 'zod';

/**
 * Domain and Schema Validators enforcing storage & business rules strictly per product.md §6 & §8
 */

// 1. Password complexity: 8+ chars, 1 uppercase, 1 number, 1 special char
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// 2. User registration schema
export const userRegistrationSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100, 'Full name must be ≤ 100 characters'),
  email: z.string().trim().email('Invalid email address'),
  countryCode: z.string().trim().default('+91'),
  mobile: z.string().trim().regex(/^\d{10}$/, 'Mobile must be exactly 10 digits'),
  password: passwordSchema,
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Consent is required to proceed' }),
  }),
});

// 3. Document upload slot and constraints (max 5 MB, allowed MIME types)
export const ALLOWED_DOCUMENT_SLOTS = [
  'marksheet10',
  'marksheet12',
  'graduationMarksheet',
  'idProof',
  'photograph',
  'categoryCertificate',
];

export const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
export const MAX_DOCUMENT_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export const documentUploadSchema = z.object({
  slot: z.enum(ALLOWED_DOCUMENT_SLOTS, {
    errorMap: () => ({ message: 'Invalid document slot' }),
  }),
  mimeType: z.enum(ALLOWED_MIME_TYPES, {
    errorMap: () => ({ message: 'Only PDF, JPEG, and PNG files are allowed' }),
  }),
  fileSize: z
    .number()
    .int()
    .positive('File size must be positive')
    .max(MAX_DOCUMENT_FILE_SIZE, 'File size must not exceed 5 MB (5242880 bytes)'),
});

// 4. Percentage bounds (0 - 100)
export const percentageSchema = z
  .number()
  .min(0, 'Percentage cannot be less than 0')
  .max(100, 'Percentage cannot exceed 100');

// 5. Application workflow statuses
export const APPLICATION_STATUSES = [
  'Draft',
  'Submitted',
  'UnderReview',
  'CorrectionRequested',
  'Approved',
  'Rejected',
  'AdmissionConfirmed',
];

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

// 6. Application Number regex: UEM-<YEAR>-<5-DIGIT-SEQUENCE>
export const APPLICATION_NO_REGEX = /^UEM-\d{4}-\d{5}$/;

export function isValidApplicationNumber(appNo) {
  return typeof appNo === 'string' && APPLICATION_NO_REGEX.test(appNo);
}

// 7. Payment validation: non-negative amount, must equal sum of line items, offline requires reference
export const paymentItemSchema = z.object({
  label: z.string().min(1, 'Line item label is required'),
  amount: z.number().min(0, 'Item amount must be non-negative'),
});

export const paymentSchema = z
  .object({
    kind: z.enum(['application', 'admission']),
    amount: z.number().min(0, 'Total amount must be non-negative'),
    lineItems: z.array(paymentItemSchema).min(1, 'At least one line item is required'),
    method: z.enum(['online', 'NEFT', 'DD']),
    offlineReference: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    // Check amount === sum of items
    const calculatedSum = data.lineItems.reduce((acc, curr) => acc + curr.amount, 0);
    if (Math.abs(data.amount - calculatedSum) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total payment amount (${data.amount}) must equal the sum of line items (${calculatedSum})`,
        path: ['amount'],
      });
    }

    // Offline payments require reference
    if (['NEFT', 'DD'].includes(data.method)) {
      if (!data.offlineReference || data.offlineReference.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Offline payments (NEFT/DD) require a valid transaction reference (UTR or DD number)',
          path: ['offlineReference'],
        });
      }
    }
  });
