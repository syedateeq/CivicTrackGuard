import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '').replace(/\/api$/, '') + '/api',
  timeout: 30000,
});

// Request: inject JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response: handle 401 (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
