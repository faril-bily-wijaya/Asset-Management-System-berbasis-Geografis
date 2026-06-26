import axios from 'axios';

// API Base URL - dapat dikonfigurasi via environment variable
// Default ke /api untuk production (same-origin deployment di port 8080)
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 30000
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ============ Locations API ============
export const locationsAPI = {
    // Get all locations with filters
    getAll: (params = {}) => api.get('/locations', { params }),

    // Get locations for map view (includes devices)
    getMapData: () => api.get('/locations/map-data'),

    // Get single location
    getById: (id) => api.get(`/locations/${id}`),

    // Create new location
    create: (data) => api.post('/locations', data),

    // Update location
    update: (id, data) => api.put(`/locations/${id}`, data),

    // Delete location
    delete: (id) => api.delete(`/locations/${id}`),

    // Get regions stats
    getRegions: () => api.get('/locations/stats/regions')
};

// ============ Devices API ============
export const devicesAPI = {
    // Get all devices with pagination and filters
    getAll: (params = {}) => api.get('/devices', { params }),

    // Get single device
    getById: (id) => api.get(`/devices/${id}`),

    // Create new device
    // Supports both ID-based (brand_id, model_id, room_id) or text-based (brand_name, model_name, room_name)
    create: (data) => api.post('/devices', data),

    // Update device
    update: (id, data) => api.put(`/devices/${id}`, data),

    // Delete device
    delete: (id) => api.delete(`/devices/${id}`),

    // Bulk delete devices
    bulkDelete: (ids) => api.post('/devices/bulk-delete', { ids }),

    // Upload CSV
    uploadCSV: (formData) => api.post('/devices/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Get stats summary
    getStats: () => api.get('/devices/stats/summary')
};

// ============ Hierarchy API ============
export const hierarchyAPI = {
    // Get all custom hierarchy (regionals, districts, clusters, stos)
    getAll: () => api.get('/locations/hierarchy'),

    // Create hierarchy item
    create: (data) => api.post('/locations/hierarchy', data),

    // Update hierarchy item
    update: (id, data) => api.put(`/locations/hierarchy/${id}`, data),

    // Delete hierarchy item
    delete: (id) => api.delete(`/locations/hierarchy/${id}`),

    // Bulk delete hierarchy items
    bulkDelete: (ids) => api.post('/locations/hierarchy/bulk-delete', { ids })
};

// ============ Masters API ============
export const mastersAPI = {
    // Get all brands
    getBrands: () => api.get('/masters/brands'),

    // Get all models
    getModels: (params = {}) => api.get('/masters/models', { params }),

    // Get all rooms
    getRooms: () => api.get('/masters/rooms')
};

// ============ Users API ============
export const usersAPI = {
    // Get all users
    getAll: () => api.get('/users'),

    // Update user role
    updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),

    // Delete user
    delete: (id) => api.delete(`/users/${id}`)
};

// ============ Auth API ============
export const authAPI = {
    // Login
    login: (credentials) => api.post('/auth/login', credentials),

    // Register
    register: (data) => api.post('/auth/register', data),

    // Get current user
    me: () => api.get('/auth/me'),

    // Update Profile
    updateProfile: (data) => api.put('/auth/profile', data),

    // Logout
    logout: () => api.post('/auth/logout')
};

// Default export
export default api;
