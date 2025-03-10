import { createStore } from 'vuex'
import { login, logout, getCurrentUser } from '../services/auth'
import { getTransactions } from '../services/api'

export default createStore({
  state: {
    user: null,
    isAuthenticated: false,
    transactions: []
  },
  getters: {
    currentUser: state => state.user,
    isAuthenticated: state => state.isAuthenticated,
    transactions: state => state.transactions
  },
  mutations: {
    SET_USER(state, user) {
      if (user) {
        console.log('設置新用戶數據:', JSON.stringify(user));
        state.user = { ...user };
      } else {
        state.user = null;
      }
      state.isAuthenticated = !!user;
      console.log('用戶狀態已更新:', user ? `用戶: ${user.name}, 餘額: ${user.balance}` : '未登錄');
    },
    SET_TRANSACTIONS(state, transactions) {
      state.transactions = transactions;
    }
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await login(credentials);
        localStorage.setItem('token', response.token);
        commit('SET_USER', response.user);
        return response;
      } catch (error) {
        throw error;
      }
    },
    async logout({ commit }) {
      await logout();
      localStorage.removeItem('token');
      commit('SET_USER', null);
    },
    async fetchCurrentUser({ commit, state }) {
      console.log('--- fetchCurrentUser 開始執行 ---');
      console.log('當前餘額:', state.user?.balance || '無');

      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('獲取用戶信息失敗: 沒有登錄token');
        commit('SET_USER', null);
        return null;
      }

      try {
        console.log('正在獲取最新用戶資訊...');

        // 添加時間戳作為查詢參數避免緩存
        const timestamp = Date.now();
        console.log(`${timestamp}: 正在請求用戶數據...`);

        const user = await getCurrentUser();

        console.log(`${timestamp}: 請求完成，獲取的餘額:`, user.balance);
        console.log('比較：前一個餘額 =', state.user?.balance, '新餘額 =', user.balance);

        // 強制使用新對象以確保響應式更新
        commit('SET_USER', JSON.parse(JSON.stringify(user)));
        return user;
      } catch (error) {
        console.error('獲取用戶資訊失敗:', error);

        // 只有在認證錯誤的情況下才清除token
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          console.warn('認證失敗，清除token');
          localStorage.removeItem('token');
          commit('SET_USER', null);
        }

        throw error;
      } finally {
        console.log('--- fetchCurrentUser 執行完畢 ---');
      }
    },
    async fetchTransactions({ commit }) {
      try {
        const transactions = await getTransactions();
        commit('SET_TRANSACTIONS', transactions);
        return transactions;
      } catch (error) {
        throw error;
      }
    }
  },
  modules: {}
})
