import axios, { AxiosError } from 'axios';

const API_URL = '/api/proxy';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes (for video uploads)
});

// Request interceptor - rely on HttpOnly cookies handled by server proxy
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('session_token');
      } catch {}
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Helper function for file uploads
export const uploadFile = async (
  endpoint: string,
  file: File,
  additionalData?: Record<string, unknown>
) => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.keys(additionalData).forEach((key) => {
      const val = additionalData[key];
      if (val instanceof Blob) {
        formData.append(key, val);
      } else {
        formData.append(key, typeof val === 'string' ? val : String(val));
      }
    });
  }

  return apiClient.post(endpoint, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default apiClient;
