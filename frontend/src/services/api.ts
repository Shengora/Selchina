import axios from 'axios';
import WebApp from '@twa-dev/sdk';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const initData = WebApp.initData || 'MOCK_123456789'; // For local testing
  if (initData) {
    config.headers.Authorization = `Bearer \${initData}`;
  }
  return config;
});
