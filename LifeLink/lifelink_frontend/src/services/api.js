import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

const API = axios.create({
  baseURL: API_BASE_URL, // Django REST API base URL
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API.defaults.baseURL}token/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API calls
export const authAPI = {
  register: (userData) => API.post("register/", userData),
  login: (credentials) => API.post("login/", credentials),
  logout: (refreshToken) => API.post("logout/", { refresh: refreshToken }),
  getProfile: () => {
    const token = localStorage.getItem('access_token');
    return API.get("profile/", {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  },
  
  updateProfile: (userData) => API.patch("profile/", userData),
  getDashboard: () => API.get("dashboard/"),
};

// Donor API calls
export const donorAPI = {
  getDonors: (params = {}) => API.get("donors/", { params }),
  getDonor: (id) => API.get(`donors/${id}/`),
  createDonor: (donorData) => API.post("donors/", donorData),
  updateDonor: (id, donorData) => API.patch(`donors/${id}/`, donorData),
  getAvailableDonors: (params = {}) => API.get("donors/available_donors/", { params }),
};

//Recipeint api calls
export const recipientAPI = {
  getRecipients: () => API.get('recipients/'),
  createRecipient: (data) => API.post('recipients/', data),
  updateRecipient: (id, data) => API.put(`recipients/${id}/`, data),
};


// Blood Request API calls
export const bloodRequestAPI = {
  getBloodRequests: (params = {}) => API.get("blood-requests/", { params }),
  getBloodRequest: (id) => API.get(`blood-requests/${id}/`),
  createBloodRequest: (requestData) => API.post("blood-requests/", requestData),
  updateBloodRequest: (id, requestData) => API.patch(`blood-requests/${id}/`, requestData),
  deleteBloodRequest: (id) => API.delete(`blood-requests/${id}/`),
  findMatches: (id) => API.post(`blood-requests/${id}/find_matches/`),
  confirmDonor: (id, data) => API.post(`blood-requests/${id}/confirm_donor/`, data),
};

// Matching API calls
export const matchingAPI = {
  getMatches: (params = {}) => API.get("matches/", { params }),
  getMatch: (id) => API.get(`matches/${id}/`),
  acceptMatch: (id) => API.post(`matches/${id}/accept_match/`),
  rejectMatch: (id, notes = "") => API.post(`matches/${id}/reject_match/`, { notes }),
};

// Donation History API calls
export const donationHistoryAPI = {
  getDonationHistory: (params = {}) => API.get("donation-history/", { params }),
  getDonationRecord: (id) => API.get(`donation-history/${id}/`),
  createDonationRecord: (donationData) => API.post("donation-history/", donationData),
};

// Notification API calls
export const notificationAPI = {
  getNotifications: (params = {}) => API.get("notifications/", { params }),
  getNotification: (id) => API.get(`notifications/${id}/`),
  markAsRead: (id) => API.post(`notifications/${id}/mark_read/`),
  markAllAsRead: () => API.post("notifications/mark_all_read/"),
};

// Utility functions
export const setAuthTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const clearAuthTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export const getAuthTokens = () => ({
  access: localStorage.getItem('access_token'),
  refresh: localStorage.getItem('refresh_token'),
});

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};


// Password reset & forgot password API calls
export const passwordAPI = {
  // Send reset email (Forgot Password)
  forgotPassword: (email) => {
    return API.post("password-reset/", { email });
  },

  // Reset password using uid & token
  resetPassword: ({ uid, token, new_password }) => {
    return API.post("password-reset/confirm/", { uid, token, new_password });
  },
};

// Analytics API calls
export const analyticsAPI = {
  getAnalytics: (timeRange = '30d') => API.get("analytics/", { params: { time_range: timeRange } }),
  getPredictiveAnalytics: () => API.get("analytics/predictive/"),
};