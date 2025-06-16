import axios from 'axios';
import { SSHConnection, ConnectionFormData, ConnectionTestResult } from '../types/connection';
import { DirectoryListing, ImageListing, ThumbnailData } from '../types/directory';

// Use environment variable or default for test environment
const API_BASE_URL = process.env.NODE_ENV === 'test' 
  ? 'http://localhost:8000' 
  : (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Connection API
export const connectionApi = {
  getAll: async (): Promise<SSHConnection[]> => {
    const response = await api.get('/connections');
    return response.data.data;
  },

  getById: async (id: string): Promise<SSHConnection> => {
    const response = await api.get(`/connections/${id}`);
    return response.data.data;
  },

  create: async (data: ConnectionFormData): Promise<SSHConnection> => {
    const response = await api.post('/connections', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<ConnectionFormData>): Promise<SSHConnection> => {
    const response = await api.put(`/connections/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/connections/${id}`);
  },

  test: async (id: string): Promise<ConnectionTestResult> => {
    const response = await api.post(`/connections/${id}/test`);
    return response.data.data;
  },

  testDirect: async (data: ConnectionFormData): Promise<ConnectionTestResult> => {
    const response = await api.post('/connections/test-direct', data);
    return response.data.data;
  },

  connect: async (id: string): Promise<SSHConnection> => {
    const response = await api.post(`/connections/${id}/connect`);
    return response.data.data;
  },

  disconnect: async (id: string): Promise<SSHConnection> => {
    const response = await api.post(`/connections/${id}/disconnect`);
    return response.data.data;
  },
};

// Directory API
export const directoryApi = {
  list: async (connectionId: string, path: string): Promise<DirectoryListing> => {
    const response = await api.get('/directories', {
      params: { connectionId, path }
    });
    return response.data.data;
  },

  getImages: async (connectionId: string, path: string): Promise<ImageListing> => {
    const response = await api.get('/images', {
      params: { connectionId, path }
    });
    return response.data.data;
  },

  getThumbnail: async (connectionId: string, imagePath: string): Promise<ThumbnailData> => {
    const response = await api.get('/thumbnails', {
      params: { connectionId, imagePath }
    });
    return response.data.data;
  },

  getMetadata: async (connectionId: string, filePath: string): Promise<any> => {
    const response = await api.get('/metadata', {
      params: { connectionId, filePath }
    });
    return response.data.data;
  },
};

// Download API
export const downloadApi = {
  downloadSingle: async (connectionId: string, filePath: string): Promise<void> => {
    const response = await api.get('/download/single', {
      params: { connectionId, filePath },
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = filePath.split('/').pop() || 'download';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadMultiple: async (connectionId: string, filePaths: string[]): Promise<void> => {
    const response = await api.post('/download/multiple', {
      connectionId,
      filePaths
    }, {
      responseType: 'blob'
    });
    
    // Create download link for ZIP
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `images_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default api;