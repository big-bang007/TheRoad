/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import axios from 'axios';

const api = axios.create({
  baseURL: 'https://hyggee.ir', // Explicit hardcoded URL to prevent CORS/Vite ghosts
});

// ==========================================
// 🛡️ THE INTERCEPTOR 
// Automatically attaches the login token to every request
// ==========================================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // If we have a token, tape it to the outgoing request header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ==========================================
// 📡 SERVICES
// ==========================================
export const authService = {
  register: (phoneNumber) => api.post('/api/v1/auth/register', { phone_number: phoneNumber }),
  requestOTP: (phoneNumber) => api.post('/api/v1/auth/request-otp', { phone_number: phoneNumber }),
  verifyOTP: (phoneNumber, code) => api.post('/api/v1/auth/verify-otp', { phone_number: phoneNumber, code: code }),
  
  // 🟢 FIX: Added the missing recovery mapping link to hit the correct Python endpoint
  resendCode: (phoneNumber) => api.post('/api/v1/auth/resend-code', { phone_number: phoneNumber })
};

export const userService = {
  updateProfile: (name) => api.put('/api/v1/auth/profile', { name: name }),
  getProfile: () => api.get('/api/v1/auth/profile') 
};

export const lessonService = {
  getAllLessons: async () => api.get('/api/v1/lessons'),
  
  createLesson: async (formData) => api.post('/api/v1/lessons', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  deleteLesson: async (lessonId) => api.delete(`/api/v1/lessons/${lessonId}`),
  
  updateLesson: async (lessonId, formData) => api.put(`/api/v1/lessons/${lessonId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  
  // 🟢 FIX: Upgraded to protect from 422 errors by default-assigning the required answers list
  submitLesson: async (lessonId, submissionData) => {
    const synchronizedPayload = {
      answers: [], // Default to safe empty array to prevent strict Pydantic missing-field crashes
      ...submissionData
    };
    return api.post(`/api/v1/lessons/${lessonId}/submit`, synchronizedPayload);
  }
};

export const adminService = {
  getAllUsers: () => api.get('/api/v1/auth/users'),
  promoteUser: (userId) => api.put(`/api/v1/admin/promote/${userId}`) 
};