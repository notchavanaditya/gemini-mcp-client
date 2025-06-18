import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('auth_token');
      toast.error('Session expired. Please log in again.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

// Gemini API functions
export const geminiAPI = {
  chat: async (message, apiKey, context = []) => {
    const response = await api.post('/gemini/chat', {
      message,
      apiKey,
      context,
    });
    return response.data;
  },

  stream: async (message, apiKey, context = [], onChunk) => {
    const response = await fetch(`${API_BASE_URL}/gemini/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        apiKey,
        context,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                onChunk(parsed.text);
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  },

  validateKey: async (apiKey) => {
    const response = await api.post('/gemini/validate-key', { apiKey });
    return response.data;
  },

  getModels: async (apiKey) => {
    const response = await api.get('/gemini/models', {
      params: { apiKey },
    });
    return response.data;
  },
};

// MCP API functions
export const mcpAPI = {
  getExtensions: async (filters = {}) => {
    const response = await api.get('/mcp/extensions', { params: filters });
    return response.data;
  },

  getInstalledExtensions: async () => {
    const response = await api.get('/mcp/installed');
    return response.data;
  },

  installExtension: async (extensionId) => {
    const response = await api.post(`/mcp/install/${extensionId}`);
    return response.data;
  },

  uninstallExtension: async (extensionId) => {
    const response = await api.delete(`/mcp/uninstall/${extensionId}`);
    return response.data;
  },

  toggleExtension: async (extensionId, enabled) => {
    const response = await api.patch(`/mcp/toggle/${extensionId}`, { enabled });
    return response.data;
  },

  executeCommand: async (extensionId, command, parameters) => {
    const response = await api.post('/mcp/execute', {
      extensionId,
      command,
      parameters,
    });
    return response.data;
  },

  getCapabilities: async (extensionId) => {
    const response = await api.get(`/mcp/capabilities/${extensionId}`);
    return response.data;
  },

  updateSettings: async (extensionId, settings) => {
    const response = await api.patch(`/mcp/settings/${extensionId}`, { settings });
    return response.data;
  },
};

// File API functions
export const fileAPI = {
  listFiles: async (path = '/workspace') => {
    const response = await api.get('/files/list', { params: { path } });
    return response.data;
  },

  readFile: async (path) => {
    const response = await api.get('/files/read', { params: { path } });
    return response.data;
  },

  writeFile: async (path, content, createDirectories = false) => {
    const response = await api.post('/files/write', {
      path,
      content,
      createDirectories,
    });
    return response.data;
  },

  deleteFile: async (path, recursive = false) => {
    const response = await api.delete('/files/delete', {
      data: { path, recursive },
    });
    return response.data;
  },

  copyFile: async (from, to) => {
    const response = await api.post('/files/copy', { from, to });
    return response.data;
  },

  moveFile: async (from, to) => {
    const response = await api.post('/files/move', { from, to });
    return response.data;
  },

  createDirectory: async (path, recursive = false) => {
    const response = await api.post('/files/mkdir', { path, recursive });
    return response.data;
  },

  searchFiles: async (query, path = '/workspace', type = 'all') => {
    const response = await api.get('/files/search', {
      params: { query, path, type },
    });
    return response.data;
  },

  uploadFile: async (file, destination) => {
    const formData = new FormData();
    formData.append('file', file);
    if (destination) {
      formData.append('destination', destination);
    }

    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Extension marketplace API functions
export const extensionAPI = {
  getCategories: async () => {
    const response = await api.get('/extensions/categories');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/extensions/stats');
    return response.data;
  },

  getTrending: async () => {
    const response = await api.get('/extensions/trending');
    return response.data;
  },

  getReviews: async (extensionId) => {
    const response = await api.get(`/extensions/${extensionId}/reviews`);
    return response.data;
  },

  submitReview: async (extensionId, rating, comment) => {
    const response = await api.post(`/extensions/${extensionId}/reviews`, {
      rating,
      comment,
    });
    return response.data;
  },

  getDocs: async (extensionId) => {
    const response = await api.get(`/extensions/${extensionId}/docs`);
    return response.data;
  },

  getPermissions: async (extensionId) => {
    const response = await api.get(`/extensions/${extensionId}/permissions`);
    return response.data;
  },
};

export default api;