import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        const { token, tenant } = useAuthStore.getState();
        
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        if (tenant?.id) {
          config.headers['X-Tenant-Id'] = tenant.id;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token过期或无效，清除认证信息
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        
        // 处理 429 速率限制错误
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || '60';
          const message = `请求过于频繁，请稍后再试（约 ${retryAfter} 秒后可重试）`;
          return Promise.reject(new Error(message));
        }
        
        const message = (error.response?.data as any)?.error || error.message || 'Request failed';
        return Promise.reject(new Error(message));
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

export const api = new ApiClient();

// API 方法
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
  changePassword: (data: any) => api.put('/auth/password', data),
};

export const warehouseApi = {
  list: (params?: any) => api.get('/warehouses', { params }),
  getById: (id: string) => api.get(`/warehouses/${id}`),
  create: (data: any) => api.post('/warehouses', data),
  update: (id: string, data: any) => api.put(`/warehouses/${id}`, data),
  delete: (id: string) => api.delete(`/warehouses/${id}`),
  listLocations: (warehouseId: string, params?: any) =>
    api.get(`/warehouses/${warehouseId}/locations`, { params }),
  createLocation: (warehouseId: string, data: any) =>
    api.post(`/warehouses/${warehouseId}/locations`, data),
  updateLocation: (id: string, data: any) => api.put(`/warehouses/locations/${id}`, data),
  deleteLocation: (id: string) => api.delete(`/warehouses/locations/${id}`),
};

export const productApi = {
  list: (params?: any) => api.get('/products', { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.put(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
  batchCreate: (data: any[]) => api.post('/products/batch', data),
};

export const inventoryApi = {
  list: (params?: any) => api.get('/inventory', { params }),
  getSummary: (params?: any) => api.get('/inventory/summary', { params }),
  getByProduct: (warehouseId: string, productId: string) =>
    api.get(`/inventory/${warehouseId}/products/${productId}`),
  adjust: (data: any) => api.post('/inventory/adjust', data),
  getAlerts: (params?: any) => api.get('/inventory/alerts', { params }),
};

export const inboundApi = {
  list: (params?: any) => api.get('/inbound', { params }),
  getById: (id: string) => api.get(`/inbound/${id}`),
  create: (data: any) => api.post('/inbound', data),
  update: (id: string, data: any) => api.put(`/inbound/${id}`, data),
  delete: (id: string) => api.delete(`/inbound/${id}`),
  approve: (id: string) => api.post(`/inbound/${id}/approve`),
  complete: (id: string, data: any) => api.post(`/inbound/${id}/complete`, data),
};

export const outboundApi = {
  list: (params?: any) => api.get('/outbound', { params }),
  getById: (id: string) => api.get(`/outbound/${id}`),
  create: (data: any) => api.post('/outbound', data),
  update: (id: string, data: any) => api.put(`/outbound/${id}`, data),
  delete: (id: string) => api.delete(`/outbound/${id}`),
  approve: (id: string) => api.post(`/outbound/${id}/approve`),
  complete: (id: string, data: any) => api.post(`/outbound/${id}/complete`, data),
};

