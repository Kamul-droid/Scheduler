import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

