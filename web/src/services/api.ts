import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
apiClient.interceptors.request.use(
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

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } else if (error.response?.status === 429) {
      // Rate limited — attach a friendly message
      error.message = 'Too many requests. Please slow down and try again in a moment.';
    } else if (!error.response && error.code === 'ERR_NETWORK') {
      // Offline / server unreachable
      error.message = 'Unable to connect to the server. Check your internet connection.';
    } else if (error.response?.status >= 500) {
      error.message = 'Server error. Please try again later.';
    }
    return Promise.reject(error);
  }
);

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroup: string;
  equipment?: string;
  difficulty?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  fullName?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Auth API
export const authApi = {
  register: async (data: { email: string; password: string; username: string; fullName?: string }) => {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/register', data);
    return response.data.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await apiClient.post<{ data: AuthResponse }>('/auth/login', data);
    return response.data.data;
  },
};

// Exercise API
export const exerciseApi = {
  getAll: async () => {
    const response = await apiClient.get<{ data: Exercise[] }>('/exercises');
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<{ data: Exercise }>(`/exercises/${id}`);
    return response.data.data;
  },

  getByMuscleGroup: async (muscleGroup: string) => {
    const response = await apiClient.get<{ data: Exercise[] }>(`/exercises/muscle/${muscleGroup}`);
    return response.data.data;
  },
};

// Workout API
export const workoutApi = {
  startSession: async (data: { notes?: string }) => {
    const response = await apiClient.post<{ data: WorkoutSession }>('/workouts/sessions/start', data);
    return response.data.data;
  },

  getSessions: async () => {
    const response = await apiClient.get<{ data: WorkoutSession[] }>('/workouts/sessions');
    return response.data.data;
  },

  getSession: async (id: string) => {
    const response = await apiClient.get<{ data: WorkoutSession }>(`/workouts/sessions/${id}`);
    return response.data.data;
  },

  endSession: async (id: string) => {
    const response = await apiClient.patch<{ data: { session: WorkoutSession; stats: any } }>(
      `/workouts/sessions/${id}/end`
    );
    return response.data.data;
  },
};

export default apiClient;
