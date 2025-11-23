import axios from 'axios';

// Use relative URLs to leverage Vite proxy (handles CORS automatically)
// In production, use VITE_API_URL if set, otherwise use relative paths
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: API_BASE_URL, // Empty string = relative URLs (uses Vite proxy)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
      return Promise.reject(error.response.data || error.message);
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Something else happened
      console.error('Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// Employees API
export const employeesApi = {
  getAll: () => api.get('/employees').then((res) => res.data),
  getById: (id: string) => api.get(`/employees/${id}`).then((res) => res.data),
  create: (data: any) => api.post('/employees', data).then((res) => res.data),
  update: (id: string, data: any) => api.patch(`/employees/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/employees/${id}`).then(() => ({ id })),
};

// Schedules API
export const schedulesApi = {
  getAll: () => api.get('/schedules').then((res) => res.data),
  getById: (id: string) => api.get(`/schedules/${id}`).then((res) => res.data),
  create: (data: any) => api.post('/schedules', data).then((res) => res.data),
  update: (id: string, data: any) => api.patch(`/schedules/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/schedules/${id}`).then(() => ({ id })),
};

// Constraints API
export const constraintsApi = {
  getAll: () => api.get('/constraints').then((res) => res.data),
  getActive: () => api.get('/constraints/active').then((res) => res.data),
  getById: (id: string) => api.get(`/constraints/${id}`).then((res) => res.data),
  create: (data: any) => api.post('/constraints', data).then((res) => res.data),
  update: (id: string, data: any) => api.patch(`/constraints/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/constraints/${id}`).then(() => ({ id })),
};

// Shifts API
export const shiftsApi = {
  getAll: () => api.get('/shifts').then((res) => res.data),
  getById: (id: string) => api.get(`/shifts/${id}`).then((res) => res.data),
  create: (data: any) => api.post('/shifts', data).then((res) => res.data),
  update: (id: string, data: any) => api.patch(`/shifts/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/shifts/${id}`).then(() => ({ id })),
};

// Departments API
export const departmentsApi = {
  getAll: () => api.get('/departments').then((res) => res.data),
  getById: (id: string) => api.get(`/departments/${id}`).then((res) => res.data),
  create: (data: any) => api.post('/departments', data).then((res) => res.data),
  update: (id: string, data: any) => api.patch(`/departments/${id}`, data).then((res) => res.data),
  delete: (id: string) => api.delete(`/departments/${id}`).then(() => ({ id })),
};

// Optimization API
export const optimizationApi = {
  optimize: async (data: any) => {
    const response = await api.post('/optimization', data);
    return response.data;
  },
  
  getStatus: async (optimizationId: string) => {
    const response = await api.get(`/optimization/${optimizationId}`);
    return response.data;
  },
};
