import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach authentication headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campusslot_token');
  const userStr = localStorage.getItem('campusslot_user');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.id) config.headers['x-user-id'] = user.id;
      if (user.role) config.headers['x-user-role'] = user.role;
      if (user.email) config.headers['x-user-email'] = user.email;
      if (user.name) config.headers['x-user-name'] = user.name;
    } catch {
      // ignore JSON parse error
    }
  }

  return config;
});

export default api;
