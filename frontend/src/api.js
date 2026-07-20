import axios from 'axios';

const API_BASE = 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_BASE,
});

export const getDeployments = () => api.get('/deployments');
export const deployApp = (repoUrl, appName) => api.post('/deploy', { repoUrl, appName });
export const deleteDeployment = (id) => api.delete(`/deployments/${id}`);