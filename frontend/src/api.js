import axios from 'axios';

const API_BASE = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE,
});

// Attach the token automatically to every request, if one exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getDeployments = () => api.get('/deployments');
export const deployApp = (repoUrl, appName) => api.post('/deploy', { repoUrl, appName });
export const deleteDeployment = (id) => api.delete(`/deployments/${id}`);

export const signup = (email, password) => api.post('/auth/signup', { email, password });
export const login = (email, password) => api.post('/auth/login', { email, password });