// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    UPDATE_DETAILS: '/auth/updatedetails',
    UPDATE_PASSWORD: '/auth/updatepassword'
  },
  USERS: {
    GET_ALL: '/users',
    GET_STATS: '/users/stats',
    GET_SINGLE: '/users',
    UPDATE: '/users',
    TOGGLE_STATUS: '/users',
    DELETE: '/users'
  },
  STORES: {
    GET_ALL: '/stores',
    GET_BY_ID: '/stores',
    CREATE: '/stores',
    UPDATE: '/stores',
    DELETE: '/stores',
    RADIUS: '/stores/radius'
  },
  HEALTH: '/health'
};

// HTTP methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
};

// Request headers
export const getHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
};

export default API_BASE_URL;