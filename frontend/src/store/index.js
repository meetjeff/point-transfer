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
      state.user = user;
      state.isAuthenticated = !!user;
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
    async fetchCurrentUser({ commit }) {
      try {
        const user = await getCurrentUser();
        commit('SET_USER', user);
        return user;
      } catch (error) {
        localStorage.removeItem('token');
        commit('SET_USER', null);
        throw error;
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
