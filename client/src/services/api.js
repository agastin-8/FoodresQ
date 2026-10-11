import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('foodlink_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('foodlink_token');
      localStorage.removeItem('foodlink_user');
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ────────────────────────────────────────────────────────
export const authApi = {
  login: async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    if (res.data.token) {
      localStorage.setItem('foodlink_token', res.data.token);
      localStorage.setItem('foodlink_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.token) {
      localStorage.setItem('foodlink_token', res.data.token);
      localStorage.setItem('foodlink_user', JSON.stringify(res.data.user));
    }
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('foodlink_token');
    localStorage.removeItem('foodlink_user');
  },
};

// ─── Listings API ────────────────────────────────────────────────────
export const listingsApi = {
  getAll: async (params) => {
    const res = await api.get('/listings', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/listings/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/listings', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/listings/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/listings/${id}`);
    return res.data;
  },
};

// ─── Donations API ───────────────────────────────────────────────────
export const donationsApi = {
  getAll: async (params) => {
    const res = await api.get('/donations', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/donations/${id}`);
    return res.data;
  },
  claim: async (listingId, data) => {
    const res = await api.post(`/donations/claim/${listingId}`, data);
    return res.data;
  },
  updateStatus: async (id, { status, note, scheduledPickupTime, cancelReason, lat, lng, locationName }) => {
    const res = await api.patch(`/donations/${id}/status`, {
      status,
      note,
      scheduledPickupTime,
      cancelReason,
      lat,
      lng,
      locationName,
    });
    return res.data;
  },
  assignVolunteer: async (id, volunteerData) => {
    const res = await api.patch(`/donations/${id}/volunteer`, volunteerData);
    return res.data;
  },
};

// ─── Tracking API ────────────────────────────────────────────────────
export const trackingApi = {
  sendLocation: async ({ donationId, tripId, lat, lng, accuracy, heading, speed }) => {
    const res = await api.post('/tracking/location', {
      donationId,
      tripId,
      lat,
      lng,
      accuracy,
      heading,
      speed,
    });
    return res.data;
  },
  stopTracking: async (donationId) => {
    const res = await api.post('/tracking/stop', { donationId });
    return res.data;
  },
  getLocation: async (donationId) => {
    const res = await api.get(`/tracking/${donationId}/location`);
    return res.data;
  },
  getTrail: async (donationId) => {
    const res = await api.get(`/tracking/${donationId}/trail`);
    return res.data;
  },
};

// ─── Collection Trips API ────────────────────────────────────────────
export const tripsApi = {
  getAll: async () => {
    const res = await api.get('/trips');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/trips/${id}`);
    return res.data;
  },
  updateStop: async (tripId, stopId, status) => {
    const res = await api.patch(`/trips/${tripId}/stops/${stopId}`, { status });
    return res.data;
  },
  confirmDelivery: async (tripId) => {
    const res = await api.post(`/trips/${tripId}/confirm-delivery`);
    return res.data;
  },
};

// ─── Users & Notifications API ───────────────────────────────────────
export const usersApi = {
  getNGOs: async () => {
    const res = await api.get('/users/ngos');
    return res.data;
  },
  getNotifications: async () => {
    const res = await api.get('/users/notifications');
    return res.data;
  },
  markRead: async (id) => {
    const res = await api.patch(`/users/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await api.patch('/users/notifications/read-all');
    return res.data;
  },
};

export default api;
