<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2>歡迎，{{ user ? user.name : '用戶' }}</h2>
      <p class="balance">XX幣餘額: <span>{{ user ? user.balance : 0 }}</span></p>

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
            <td>{{ formatDate(transaction.createdAt) }}</td>
            <td>{{ transaction.senderId === userId ? '發送' : '接收' }}</td>
            <td :class="transaction.senderId === userId ? 'negative' : 'positive'">
              {{ transaction.sender === userId ? '-' : '+' }}{{ transaction.amount }}
            </td>
            <td>
              {{ transaction.sender === userId
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
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'DashboardView',
  setup() {
    const store = useStore();
    const isLoading = ref(true);

    const user = computed(() => store.getters.currentUser);
    const transactions = computed(() => store.getters.transactions);
    const userId = computed(() => user.value?.userId || '');

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    const translateStatus = (status) => {
      const statusMap = {
        'pending': '等待中',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      return statusMap[status] || status;
    };

    onMounted(async () => {
      try {
        await store.dispatch('fetchTransactions');
      } catch (error) {
        console.error('獲取交易記錄失敗', error);
      } finally {
        isLoading.value = false;
      }
    });

    return {
      user,
      transactions,
      userId,
      isLoading,
      formatDate,
      translateStatus
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
}

.balance span {
  font-weight: bold;
  color: #27ae60;
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
