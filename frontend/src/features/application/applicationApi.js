import { http } from '../../api/http.js';

export const applicationApi = {
  /**
   * Fetch courses catalogue
   */
  async getCourses(level) {
    const url = level ? `/courses?level=${encodeURIComponent(level)}` : '/courses';
    return http.get(url);
  },

  /**
   * Fetch current applicant's application and attached documents (FR4, FR12)
   */
  async getMyApplication() {
    return http.get('/applications/me');
  },

  /**
   * Save application as draft with timestamp (FR7)
   */
  async saveDraft(data) {
    return http.put('/applications/me', data);
  },

  /**
   * Get preview and completeness evaluation (FR10)
   */
  async getPreview() {
    return http.get('/applications/me/preview');
  },

  /**
   * Submit application (FR11)
   */
  async submitApplication(declaration = true) {
    return http.post('/applications/me/submit', { declaration });
  },

  /**
   * Upload document to a slot (FR9, FR6.3, FR6.4)
   */
  async uploadDocument(slot, file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return http.post(`/applications/me/documents/${slot}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
  },

  /**
   * Delete uploaded document from slot
   */
  async deleteDocument(slot) {
    return http.delete(`/applications/me/documents/${slot}`);
  },

  /**
   * Document download / preview URL
   */
  getDocumentFileUrl(slot) {
    return `/api/applications/me/documents/${slot}/file`;
  },
};

export default applicationApi;
