<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2>歡迎，{{ user ? user.name : '用戶' }}</h2>
      <p class="balance">XX幣餘額: <span>{{ directBalance !== null ? directBalance : (user ? user.balance : 0) }}</span>
        <button @click="refreshUserData" class="refresh-btn" title="刷新餘額">
          <i class="refresh-icon">↻</i>
        </button>
      </p>
      <p class="last-update" v-if="lastUpdateTime">最後更新: {{ lastUpdateTime }}</p>

      <div class="action-buttons">
        <router-link to="/send" class="btn btn-primary">發送XX幣</router-link>
        <router-link to="/receive" class="btn btn-secondary">接收XX幣</router-link>
      </div>
    </div>

    <div class="dashboard-content">
      <h3>最近交易記錄</h3>

      <div v-if="isLoading" class="loading">
        載入中...
      </div>

      <div v-else-if="transactions.length === 0" class="no-transactions">
        沒有交易記錄
      </div>

      <table v-else class="transactions-table">
        <thead>
          <tr>
            <th>日期</th>
            <th>類型</th>
            <th>金額</th>
            <th>交易對象</th>
            <th>狀態</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="transaction in transactions" :key="transaction.transactionId">
            <td><LocalTime :datetime="transaction.createdAt" format="full" /></td>
            <td>{{ transaction.senderId === userId ? '發送' : '接收' }}</td>
            <td :class="transaction.senderId === userId ? 'negative' : 'positive'">
              {{ transaction.senderId === userId ? '-' : '+' }}{{ transaction.amount }}
            </td>
            <td>
              {{ transaction.senderId === userId
                ? (transaction.receiverName || '等待接收中')
                : transaction.senderName }}
            </td>
            <td>{{ translateStatus(transaction.status) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import LocalTime from '../components/LocalTime.vue';
import { getDirectUserBalance } from '../services/auth';

export default {
  name: 'DashboardView',
  components: {
    LocalTime
  },
  setup() {
    const store = useStore();
    const isLoading = ref(true);
    let refreshInterval = null;
    const lastUpdateTime = ref('');
    const directBalance = ref(null);

    const user = computed(() => store.getters.currentUser);
    const transactions = computed(() => store.getters.transactions);
    const userId = computed(() => user.value?.userId || '');

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    const updateTimestamp = () => {
      const now = new Date();
      lastUpdateTime.value = now.toLocaleTimeString();
    };

    const translateStatus = (status) => {
      const statusMap = {
        'pending': '等待中',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    };

    const fetchDirectBalance = async () => {
      try {
        console.log('獲取最新餘額');
        const balance = await getDirectUserBalance();
        directBalance.value = balance;
        updateTimestamp();
        console.log('餘額已更新：', balance);
      } catch (error) {
        console.error('獲取餘額失敗:', error);
      }
    };

    onMounted(async () => {
      isLoading.value = true;

      try {
        await fetchDirectBalance();

        console.log('開始獲取交易記錄...');
        await store.dispatch('fetchTransactions');
        console.log('交易記錄獲取成功！');
      } catch (error) {
        console.error('獲取資料失敗:', error);
      } finally {
        isLoading.value = false;
      }

      refreshInterval = setInterval(async () => {
        await fetchDirectBalance();
      }, 30000);
    });

    onUnmounted(() => {
      if (refreshInterval) {
        console.log('清除餘額更新定時器');
        clearInterval(refreshInterval);
        refreshInterval = null;
      }
    });

    return {
      user,
      directBalance,
      transactions,
      userId,
      isLoading,
      formatDate,
      translateStatus,
      refreshUserData: fetchDirectBalance,
      lastUpdateTime
    };
  }
}
</script>

<style scoped>
.dashboard-container {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
  margin: 2rem auto;
  max-width: 900px;
}

.dashboard-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}

h2 {
  margin-bottom: 1rem;
  color: #333;
}

.balance {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.balance span {
  font-weight: bold;
  color: #27ae60;
}

.last-update {
  font-size: 0.8rem;
  color: #7f8c8d;
  margin-top: -1rem;
  margin-bottom: 1rem;
}

.refresh-btn {
  background: none;
  border: none;
  color: #3498db;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.2rem 0.5rem;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background-color: #eef7fc;
  transform: rotate(30deg);
}

.refresh-icon {
  font-style: normal;
  font-size: 1.2rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.dashboard-content h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.loading, .no-transactions {
  text-align: center;
  color: #666;
  padding: 2rem 0;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th,
.transactions-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.transactions-table th {
  font-weight: bold;
  background-color: #f9f9f9;
}

.positive {
  color: #27ae60;
}

.negative {
  color: #e74c3c;
}

@media (max-width: 768px) {
  .action-buttons {
    flex-direction: column;
  }

  .transactions-table {
    display: block;
    overflow-x: auto;
  }
}
</style>
