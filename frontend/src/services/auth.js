import axios from 'axios';
import { mockUser } from './mockData';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !API_URL;

// 設置請求攔截器，添加認證token
axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 創建用於身份驗證的實例
const authAPI = axios.create({
  baseURL: API_URL + '/auth',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
});

export const login = async ({ email, password }) => {
  // 使用模擬數據
  if (USE_MOCK) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          token: 'mock-token-123456',
          user: mockUser
        });
      }, 500); // 模擬網絡延遲
    });
  }

  // 真實API調用
  try {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await authAPI.post('/login', params);
    // 存儲 token 和處理登入成功邏輯
    const token = response.data.access_token;
    localStorage.setItem('token', token);
    const userData = await getCurrentUser();

    return {
      token: token,
      user: userData
    };
  } catch (error) {
    // 更友好的錯誤處理
    if (error.response) {
      // 服務器返回錯誤狀態碼
      console.error('登入失敗:', error.response.data);
    } else if (error.request) {
      // 請求發送但沒有收到響應
      console.error('無法連接到服務器');
    } else {
      // 請求設置出錯
      console.error('請求錯誤:', error.message);
    }
    throw new Error(error.response?.data?.detail || '登入失敗');
  }
};

export const logout = async () => {
  // 如果需要向服務端發送登出請求，可以在這裡實現
  try {
    // 可選: await axios.post(`${API_URL}/auth/logout`);
    return true;
  } catch (error) {
    console.error('登出錯誤', error);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const token = localStorage.getItem('token');
    console.log('Fetching user with token:', token?.substring(0, 10) + '...');
    const response = await axios.get(`${API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('User data:', response.data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || '獲取用戶信息失敗');
  }
};

export const register = async ({ name, email, password }) => {
  // 使用模擬數據
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: '註冊成功',
          userId: 'mock-user-id-' + Date.now(),
          name,
          email
        });
      }, 800); // 模擬網絡延遲
    });
  }

  // 真實API調用
  try {
    const response = await axios.post(`${API_URL}/auth/register`, {
      name,
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || '註冊失敗');
  }
};
