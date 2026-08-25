import axios from 'axios';

const baseURL = import.meta.env.PROD 
  ? '/api' 
  : (import.meta.env.VITE_API_URL || 'http://localhost:4000/api');

const headersConfig: Record<string, string> = {
  'Content-Type': 'application/json',
};

if (baseURL.includes('ngrok')) {
  headersConfig['ngrok-skip-browser-warning'] = 'true';
}

export const api = axios.create({
  baseURL,
  headers: headersConfig,
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Sesión expirada o no autorizada');
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.debug('Backend local no disponible - Operando en modo local');
    } else {
      console.warn('Respuesta API backend:', error.response?.data?.message || error.response?.data?.error || error.message);
    }
    return Promise.reject(error);
  },
);

export function useAuthApi() {
  return api;
}
