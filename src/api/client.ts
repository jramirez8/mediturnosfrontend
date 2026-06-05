import axios from 'axios';
import { storage } from './storage';

export const API_BASE_URL = 'https://mediturnosbackend-production.up.railway.app';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('access_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === 'ECONNABORTED') {
      error.message = 'El servidor tardó demasiado en responder.';
    }
    if (!error?.response && error?.message === 'Network Error') {
      error.message = 'No pudimos conectarnos con el servicio. Revisá tu conexión e intentá nuevamente.';
    }
    return Promise.reject(error);
  }
);
