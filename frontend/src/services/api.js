import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2050/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Servicios de Cambios
export const changesService = {
  getAll: async (page = 1, limit = 20, filtro = '') => {
    const response = await api.get('/changes', {
      params: { page, limit, filtro },
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/changes/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/changes', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/changes/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/changes/${id}`);
    return response.data;
  },

  searchByTitulo: async (titulo) => {
    const response = await api.get('/changes/search/titulo', {
      params: { titulo },
    });
    return response.data;
  },

  searchBySAVF: async (savf) => {
    const response = await api.get('/changes/search/savf', {
      params: { savf },
    });
    return response.data;
  },
};

// Servicios de Evidencias
export const evidenciasService = {
  upload: async (changeId, files, uploadedBy = 'usuario') => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('evidencias', file);
    });
    formData.append('change_id', changeId);
    formData.append('uploaded_by', uploadedBy);

    const response = await api.post('/evidencias/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getByChangeId: async (changeId) => {
    const response = await api.get(`/evidencias/${changeId}`);
    return response.data;
  },
};

// Servicios de IBM i
export const ibmiService = {
  getJobs: async () => {
    const response = await api.get('/ibmi/jobs');
    return response.data;
  },

  getJobById: async (id) => {
    const response = await api.get(`/ibmi/jobs/${id}`);
    return response.data;
  },

  getHealth: async () => {
    const response = await api.get('/ibmi/health');
    return response.data;
  },
};

export default api;
