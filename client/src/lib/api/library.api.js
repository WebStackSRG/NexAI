import { apiClient } from './client.js';

export const libraryApi = {
  /**
   * Fetches paginated library items, optionally filtered by tag, type, or tab.
   * @param {{ tag?: string, tab?: 'all' | 'notes_links' | 'documents' | 'files' | 'interviews', type?: string, page?: number, limit?: number }} [params]
   */
  getItems(params = {}) {
    return apiClient.get('/library', { params });
  },

  /**
   * Retrieves a single library item by ID.
   * @param {string} id
   */
  getItemById(id) {
    return apiClient.get(`/library/${id}`);
  },

  /**
   * Semantically searches the library by meaning and text keywords.
   * @param {string} q
   * @param {string} [type]
   */
  searchItems(q, type) {
    return apiClient.get('/library/search', { params: { q, ...(type ? { type } : {}) } });
  },

  /**
   * Generates AI-suggested title, summary, and tags for a link, note, or file without saving.
   * @param {{ type: 'link' | 'note' | 'file', url?: string, content?: string, fileName?: string }} payload
   */
  suggestItem(payload) {
    return apiClient.post('/library/suggest', payload);
  },

  /**
   * Generates a structured AI document draft (resumes, specs, reports, notes) with Gemini JSON mode.
   * @param {{ prompt: string, category?: string }} payload
   */
  generateDocumentDraft(payload) {
    return apiClient.post('/library/documents/generate', payload);
  },

  /**
   * Downloads a server-generated styled PDF for a library document.
   * @param {string} id
   * @param {string} [filename]
   */
  async exportDocumentPdf(id, filename = 'document.pdf') {
    const response = await apiClient.get(`/library/documents/${id}/export.pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  },

  /**
   * Saves a confirmed polymorphic library item and generates vector embedding.
   * @param {Object} payload
   */
  createItem(payload) {
    return apiClient.post('/library', payload);
  },

  /**
   * Updates an existing library item.
   * @param {string} id
   * @param {Object} payload
   */
  updateItem(id, payload) {
    return apiClient.patch(`/library/${id}`, payload);
  },

  /**
   * Deletes a library item.
   * @param {string} id
   */
  deleteItem(id) {
    return apiClient.delete(`/library/${id}`);
  },
};
