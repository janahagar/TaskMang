import axios from "axios";

const API_BASE_URL = "https://ec4rjesbcg.execute-api.eu-north-1.amazonaws.com/prod";

// Create a custom axios instance with proper configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem("authToken");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

function getToken() {
  return localStorage.getItem("authToken");
}

export async function createTask(taskData) {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");
  return apiClient.post('/tasks', taskData);
}

export async function getTasks(filters = {}) {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");
  
  // Only add query parameters if filters are provided
  const hasFilters = Object.keys(filters).length > 0;
  let url = '/tasks';
  
  if (hasFilters) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.dueDateFrom) params.append('dueDateFrom', filters.dueDateFrom);
    if (filters.dueDateTo) params.append('dueDateTo', filters.dueDateTo);
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return axios.get(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
}

export async function searchTasks(searchTerm) {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");
  
  return apiClient.get('/tasks/search', {
    params: { q: searchTerm }
  });
}

export async function getTasksByStatus(status) {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");
  
  return apiClient.get(`/tasks/status/${status}`);
}

export async function updateTask(taskId, taskData) {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");
  return apiClient.put(`/tasks/${taskId}`, taskData);
}

export async function deleteTask(taskId) {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");
  return apiClient.delete(`/tasks/${taskId}`);
}

export async function generateUploadUrl(fileName, fileType) {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");

  return apiClient.post('/upload-url', { fileName, fileType });
}

// Analytics and insights for better database utilization
export async function getTaskAnalytics() {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");
  
  return apiClient.get('/analytics/tasks');
}

export async function getRecentTasks(limit = 5) {
  const token = getToken();
  if (!token) throw new Error("User not authenticated");
  
  return apiClient.get('/tasks/recent', {
    params: { limit }
  });
}

// Similarly add updateTask, deleteTask with PUT and DELETE methods
