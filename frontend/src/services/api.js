import axios from 'axios';
import { mockTransactions, generateTransactionId, mockUser } from './mockData';

const API_URL = import.meta.env.VITE_API_BACKEND || '/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'; // 啟用模擬模式

// 內存存儲模擬交易
let transactions = [...mockTransactions];

// 調試函數 - 在控制台中顯示所有模擬交易
export const logAllTransactions = () => {
  console.log('當前模擬交易列表:', transactions);
};

export const getTransactions = async () => {
  if (USE_MOCK) {
    console.log('使用模擬交易數據');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(transactions);
      }, 500);
    });
  }

  try {
    const response = await axios.get(`${API_URL}/transactions/`); // 添加末尾斜杠
    return response.data;
  } catch (error) {
    console.error('獲取交易記錄失敗:', error);
    if (error.response) {
      console.error('API錯誤響應:', {
        狀態: error.response.status,
        數據: error.response.data,
        頭信息: error.response.headers
      });
    } else if (error.request) {
      console.error('未收到響應:', error.request);
    } else {
      console.error('請求設置錯誤:', error.message);
    }
    throw new Error(error.response?.data?.detail || '獲取交易記錄失敗');
  }
};

export const prepareTransaction = async (transactionData) => {
  if (USE_MOCK) {
    console.log('準備模擬交易');

    // 創建模擬交易
    const transaction = {
      transactionId: generateTransactionId(),
      amount: transactionData.amount,
      senderId: transactionData.senderId,
      senderName: transactionData.senderName,
      note: transactionData.note,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60000).toISOString()
    };

    // 存儲到模擬交易列表
    transactions.push(transaction);

    // 將交易保存到sessionStorage
    try {
      const storedTransactions = JSON.parse(sessionStorage.getItem('mockTransactions') || '[]');
      storedTransactions.push(transaction);
      sessionStorage.setItem('mockTransactions', JSON.stringify(storedTransactions));
    } catch (err) {
      console.error('保存交易到sessionStorage失敗:', err);
    }

    console.log('已創建新交易:', transaction);
    logAllTransactions(); // 顯示所有交易

    setTimeout(() => {
      resolve(transaction);
    }, 700);
  }

  try {
    // 根據後端API要求重新構建數據
    const apiData = {
      amount: transactionData.amount,
      note: transactionData.note || ""
    };

    // 如果有指定接收者，則添加
    if (transactionData.receiverEmail) {
      apiData.receiver_email = transactionData.receiverEmail;
    }

    console.log('準備發送交易請求:', apiData);

    const response = await axios.post(`${API_URL}/transactions/prepare`, apiData);
    return response.data;
  } catch (error) {
    console.error('準備交易失敗:', error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || '準備交易失敗');
  }
};

export const confirmTransaction = async (transactionId, receiverEmail) => {
  if (!transactionId) {
    throw new Error('缺少交易ID');
  }

  if (!receiverEmail) {
    throw new Error('缺少接收者Email');
  }

  if (USE_MOCK) {
    console.log('確認模擬交易', { transactionId, receiverEmail });
    return new Promise((resolve, reject) => {
      // 查找並更新交易
      const transaction = transactions.find(t => t.transactionId === transactionId);

      if (!transaction) {
        console.error('交易不存在:', {
          transactionId,
          可用交易IDs: transactions.map(t => t.transactionId)
        });
        reject(new Error('交易不存在'));
        return;
      }

      if (transaction.status !== 'pending') {
        reject(new Error('交易已處理'));
        return;
      }

      // 更新交易狀態
      transaction.status = 'completed';
      transaction.receiverEmail = receiverEmail; // 改用email
      transaction.receiverId = 'user-' + Math.random().toString(36).substr(2, 5); // 自動生成ID
      transaction.receiverName = '接收者' + receiverEmail.split('@')[0]; // 從email生成名稱

      setTimeout(() => {
        resolve(transaction);
      }, 800);
    });
  }

  try {
    console.log('發送確認交易請求:', { transactionId, receiverEmail });
    const response = await axios.post(`${API_URL}/transactions/${transactionId}/confirm`, {});
    return response.data;
  } catch (error) {
    console.error('確認交易API錯誤:', error);

    // 更詳細地記錄錯誤信息
    if (error.response) {
      console.error('API錯誤響應:', {
        狀態: error.response.status,
        數據: error.response.data,
        頭信息: error.response.headers
      });
    }

    // 透傳錯誤，讓調用方處理
    throw error;
  }
};

export const confirmPublicTransaction = async (transactionId, email, name) => {
  if (USE_MOCK) {
    console.log('確認公共模擬交易', { transactionId, email, name });
    return new Promise((resolve, reject) => {
      // 查找並更新交易
      const transaction = transactions.find(t => t.transactionId === transactionId);

      if (!transaction) {
        console.error('交易不存在:', {
          transactionId,
          可用交易IDs: transactions.map(t => t.transactionId)
        });
        reject(new Error('交易不存在'));
        return;
      }

      if (transaction.status !== 'pending') {
        reject(new Error('交易已處理'));
        return;
      }

      // 更新交易狀態
      transaction.status = 'completed';
      transaction.receiverId = 'public-user';
      transaction.receiverEmail = email;
      transaction.receiverName = name || '未命名用戶';

      setTimeout(() => {
        resolve(transaction);
      }, 800);
    });
  }

  try {
    const response = await axios.post(`${API_URL}/transactions/public/${transactionId}/confirm`, {
      email: email,
      name: name || '未命名用戶'
    });
    return response.data;
  } catch (error) {
    console.error('確認公共交易API錯誤:', error);
    throw new Error(error.response?.data?.detail || '領取失敗');
  }
};
