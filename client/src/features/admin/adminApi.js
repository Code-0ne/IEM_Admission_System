import { http } from '../../api/http.js';

export const adminApi = {
  /** GET /api/admin/applications — list with optional status/course/search/page filters */
  async listApplications({ status, course, search, page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (course) params.set('course', course);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('limit', String(limit));
    return http.get(`/admin/applications?${params}`);
  },

  /** GET /api/admin/applications/:id */
  async getApplication(id) {
    return http.get(`/admin/applications/${id}`);
  },

  /** PATCH /api/admin/applications/:id/documents/:slot */
  async verifyDocument(id, slot, { status, comment }) {
    return http.patch(`/admin/applications/${id}/documents/${slot}`, { status, comment });
  },

  /** POST /api/admin/applications/:id/decision */
  async recordDecision(id, { decision, reason }) {
    return http.post(`/admin/applications/${id}/decision`, { decision, reason });
  },

  /** POST /api/admin/applications/:id/request-correction */
  async requestCorrection(id, { flaggedSections, comment }) {
    return http.post(`/admin/applications/${id}/request-correction`, { flaggedSections, comment });
  },

  /** GET /api/admin/applications/dashboard */
  async getDashboardStats() {
    return http.get('/admin/applications/dashboard');
  },

  /** GET /api/admin/applications/export?status=&course= */
  getExportUrl({ status, course } = {}) {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (course) params.set('course', course);
    return `/api/admin/applications/export?${params}`;
  },

  /** GET /api/admin/applications/:id/documents/:slot/file */
  getDocumentStreamUrl(id, slot) {
    return `/api/admin/applications/${id}/documents/${slot}/file`;
  },
};

export default adminApi;
