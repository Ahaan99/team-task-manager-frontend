const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let jwtToken = localStorage.getItem('token') || '';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  if (jwtToken) {
    headers['Authorization'] = `Bearer ${jwtToken}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
};

const api = {
  setToken: (token) => {
    jwtToken = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  getToken: () => jwtToken,

  // Auth APIs
  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password })
    });
    return handleResponse(res);
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      api.setToken(data.token);
    }
    return data;
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Project APIs
  getProjects: async () => {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getProjectById: async (id) => {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createProject: async (name, description) => {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, description })
    });
    return handleResponse(res);
  },

  deleteProject: async (projectId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  addProjectMember: async (projectId, email, role = 'MEMBER') => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, role })
    });
    return handleResponse(res);
  },

  removeProjectMember: async (projectId, userId) => {
    const res = await fetch(`${API_BASE}/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Task APIs
  createTask: async (taskData) => {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });
    return handleResponse(res);
  },

  updateTask: async (taskId, taskData) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(taskData)
    });
    return handleResponse(res);
  },

  deleteTask: async (taskId) => {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Dashboard API
  getDashboardStats: async (projectId = '') => {
    const query = projectId ? `?projectId=${projectId}` : '';
    const res = await fetch(`${API_BASE}/dashboard${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // User search
  searchUsers: async (q = '') => {
    const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(q)}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

export default api;
