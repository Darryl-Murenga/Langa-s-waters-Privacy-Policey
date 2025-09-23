import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'accept': '*/*',
  },
});

// Department interfaces
export interface Department {
  id?: number;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  suffixNumber: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DepartmentResponse {
  success: boolean;
  message: string;
  data: Department;
  timestamp: string;
}

export interface DepartmentListResponse {
  success: boolean;
  message: string;
  data: {
    content: Department[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
  timestamp: string;
}

// Asset interfaces
export interface Asset {
  id?: number;
  code: string;
  name: string;
  serialNumber: string;
  department: string;
  aggregateRepairCost?: number;
}

export interface AssetResponse {
  success: boolean;
  message: string;
  data: Asset;
  timestamp: string;
}

export interface AssetListResponse {
  success: boolean;
  message: string;
  data: Asset[];
  timestamp: string;
}

// Department API functions
export const departmentApi = {
  // Create a new department
  create: async (department: Omit<Department, 'id' | 'isActive' | 'createdAt' | 'updatedAt'>): Promise<DepartmentResponse> => {
    const response = await api.post('/departments', department);
    return response.data;
  },

  // Get all departments with pagination
  getAll: async (page: number = 0, size: number = 20, sortBy: string = 'sortOrder', sortDirection: string = 'asc'): Promise<DepartmentListResponse> => {
    const response = await api.get(`/departments?page=${page}&size=${size}&sortBy=${sortBy}&sortDirection=${sortDirection}`);
    return response.data;
  },

  // Get department by code
  getByCode: async (code: string): Promise<DepartmentResponse> => {
    const response = await api.get(`/departments/code/${code}`);
    return response.data;
  },
};

// Asset API functions
export const assetApi = {
  // Create a new asset
  create: async (asset: Omit<Asset, 'id' | 'aggregateRepairCost'>): Promise<AssetResponse> => {
    const response = await api.post('/assets', asset);
    return response.data;
  },

  // Get all assets
  getAll: async (): Promise<AssetListResponse> => {
    const response = await api.get('/assets/all');
    return response.data;
  },

  // Get asset by code
  getByCode: async (code: string): Promise<AssetResponse> => {
    const response = await api.get(`/assets/code/${code}`);
    return response.data;
  },
};

export default api;