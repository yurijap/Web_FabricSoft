import axios from 'axios';
import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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
      console.warn('Sesion expirada o no autorizada');
    }
    console.error('Error en API:', error.response?.data || error.message);
    return Promise.reject(error);
  },
);

export const useAuthApi = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const authRef = useRef({ getToken, isLoaded, isSignedIn });

  authRef.current = { getToken, isLoaded, isSignedIn };

  const instanceRef = useRef(
    (() => {
      const instance = axios.create({
        baseURL,
        headers: headersConfig,
        timeout: 30000,
      });

      instance.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            console.warn('Sesion expirada o no autorizada');
          }
          console.error('Error en API:', error.response?.data || error.message);
          return Promise.reject(error);
        },
      );

      return instance;
    })(),
  );

  useEffect(() => {
    const interceptorId = instanceRef.current.interceptors.request.use(async (config) => {
      const {
        getToken: currentGetToken,
        isLoaded: authLoaded,
        isSignedIn: signedIn,
      } = authRef.current;

      if (!authLoaded || !signedIn) {
        throw new axios.CanceledError('Clerk auth is not ready for this request.');
      }

      const token = await currentGetToken();

      if (!token) {
        throw new axios.CanceledError('Clerk did not return a session token.');
      }

      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    return () => {
      instanceRef.current.interceptors.request.eject(interceptorId);
    };
  }, []);

  return instanceRef.current;
};
