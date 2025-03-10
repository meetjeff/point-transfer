import axios from 'axios';
import { mockUser } from './mockData';

const API_URL = import.meta.env.VITE_API_BACKEND || '/api';
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
  // 使用模擬數據
  if (USE_MOCK) {
    console.log('使用模擬用戶數據');
    // 修改：模擬真實 API 行為，每次都返回一個新的對象，並添加一些隨機變化
    // 這樣可以測試 UI 是否能正確響應數據變化
    const mockData = { ...mockUser };

    // 模擬餘額可能會有小的變化（僅用於測試）
    if (Math.random() > 0.5) {
      mockData.balance = Math.floor(mockData.balance * 100 + Math.random() * 10) / 100;
    }

    console.log('返回模擬用戶數據:', mockData);
    return mockData;
  }

  try {
    const token = localStorage.getItem('token');
    console.log('請求用戶數據，使用 token:', token?.substring(0, 10) + '...');

    // 添加時間戳防止緩存
    const timestamp = new Date().getTime();
    const requestUrl = `${API_URL}/users/me?_t=${timestamp}`;
    console.log('完整API請求URL:', requestUrl);

    console.log('發送API請求前...');
    const response = await axios.get(requestUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    console.log('API請求已返回，狀態碼:', response.status);

    console.log('獲取用戶數據響應:', response.status, response.statusText);
    console.log('用戶數據:', response.data);
    return response.data;
  } catch (error) {
    console.error('獲取用戶數據出錯:', error);
    if (error.response) {
      console.error('錯誤詳情:', {
        狀態: error.response.status,
        數據: error.response.data,
        頭信息: error.response.headers
      });
    }
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

// 直接獲取用戶餘額的新方法
export const getDirectUserBalance = async () => {
  // 使用模擬數據
  if (USE_MOCK) {
    console.log('使用模擬用戶餘額');
    // 隨機生成一些變化測試用
    const mockBalance = mockUser.balance + (Math.random() > 0.5 ? Math.random() * 10 : 0);
    return mockBalance;
  }

  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('缺少認證令牌');
    }

    const timestamp = Date.now();
    console.log(`直接獲取餘額：${timestamp}`);

    // 使用不同的 URL 參數避免緩存
    const response = await axios.get(`${API_URL}/users/me?direct=true&t=${timestamp}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    console.log('直接獲取的用戶餘額:', response.data.balance);
    return response.data.balance;
  } catch (error) {
    console.error('直接獲取餘額失敗:', error);
    throw error;
  }
};
