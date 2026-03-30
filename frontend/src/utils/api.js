import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// إضافة معرف المستخدم إلى كل طلب إذا كان مسجلاً
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('pos_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          config.headers['X-User-Id'] = user.id;
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// معالجة الأخطاء
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;