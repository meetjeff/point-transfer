<template>
  <div class="receive-points-container">
    <h2>接收XX幣</h2>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="success" class="success-message">
      <h3>交易成功！</h3>
      <p>您已成功接收 {{ confirmedTransaction.amount }} 點</p>
      <p>從: {{ confirmedTransaction.senderName }}</p>

      <div class="success-actions">
        <button class="btn btn-primary" @click="goToDashboard">
          返回首頁
        </button>
        <button class="btn btn-secondary" @click="resetReceiver">
          接收更多XX幣
        </button>
      </div>
    </div>

    <div v-else-if="scannedTransaction" class="transaction-details">
      <h3>交易詳情</h3>

      <div class="transaction-info">
        <p><strong>發送方:</strong> {{ scannedTransaction.senderName }}</p>
        <p><strong>金額:</strong> {{ scannedTransaction.amount }} 點</p>
        <p v-if="scannedTransaction.note"><strong>備註:</strong> {{ scannedTransaction.note }}</p>
        <p><strong>交易ID:</strong> {{ scannedTransaction.transactionId }}</p>
        <p v-if="scannedTransaction.expiresAt">
          <strong>有效期至:</strong> {{ formatDate(scannedTransaction.expiresAt) }}
        </p>
      </div>

      <div class="confirm-actions">
        <button class="btn btn-primary" @click="confirmTransaction" :disabled="isLoading">
          {{ isLoading ? '處理中...' : '確認接收' }}
        </button>
        <button class="btn btn-secondary" @click="resetReceiver" :disabled="isLoading">
          取消
        </button>
      </div>
    </div>

    <div v-else class="scanner-section">
      <p class="instructions">請掃描發送方的 QR Code以接收XX幣</p>

      <QRCodeScanner :on-scan="handleScan" />

      <p class="note">或者</p>

      <div class="manual-entry">
        <button class="btn btn-secondary" @click="showManualEntry = !showManualEntry">
          {{ showManualEntry ? '隱藏' : '手動輸入交易資料' }}
        </button>

        <form v-if="showManualEntry" @submit.prevent="handleManualEntry" class="manual-form">
          <div class="form-group">
            <label for="transaction-id">交易 ID</label>
            <input
              type="text"
              id="transaction-id"
              v-model="manualTransactionId"
              required
              placeholder="輸入交易 ID"
            />
          </div>

          <button type="submit" class="btn btn-primary" :disabled="!manualTransactionId">
            檢查交易
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import QRCodeScanner from '../components/QRCodeScanner.vue';
import { confirmTransaction } from '../services/api';

export default {
  name: 'ReceivePointsView',
  components: {
    QRCodeScanner
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const error = ref('');
    const isLoading = ref(false);
    const scannedTransaction = ref(null);
    const confirmedTransaction = ref(null);
    const success = ref(false);
    const showManualEntry = ref(false);
    const manualTransactionId = ref('');

    const user = computed(() => store.getters.currentUser);

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    const handleScan = (data) => {
      try {
        // 解析掃描到的QR碼數據
        const transaction = JSON.parse(data);

        // 基本驗證
        if (!transaction.transactionId || !transaction.amount || !transaction.senderId) {
          throw new Error('無效的交易數據');
        }

        // 檢查交易是否過期
        if (!transaction.transactionId || !transaction.amount || !transaction.senderId) {
          throw new Error('無效的交易數據');
        }

        if (transaction.senderId === user.value.userId) {
          throw new Error('不能接收自己發送的XX幣');
        }

        scannedTransaction.value = transaction;
      } catch (err) {
        error.value = err.message || '無效的QR碼';
      }
    };

    const handleManualEntry = async () => {
      if (!manualTransactionId.value) return;

      error.value = '';
      isLoading.value = true;

      try {
        // 這裡應該有一個API來獲取交易詳情
        // const transaction = await getTransactionDetails(manualTransactionId.value);

        // 模擬API響應
        setTimeout(() => {
          // 假設API返回的交易數據
          const mockTransaction = {
            transactionId: manualTransactionId.value,
            amount: 100,
            senderId: 'mockSenderId',
            senderName: '發送方用戶',
            timestamp: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60000).toISOString() // 30分鐘後過期
          };

          scannedTransaction.value = mockTransaction;
          isLoading.value = false;
        }, 1000);
      } catch (err) {
        error.value = err.message || '獲取交易資料失敗';
        isLoading.value = false;
      }
    };

    const confirmTransaction = async () => {
      if (!scannedTransaction.value) return;

      error.value = '';
      isLoading.value = true;

      try {
        const result = await confirmTransaction(
          scannedTransaction.value.transactionId,
          user.value.email
        );

        confirmedTransaction.value = result || scannedTransaction.value;
        success.value = true;

        // 重新獲取用戶資料
        await store.dispatch('fetchCurrentUser');
      } catch (err) {
        console.error('交易確認錯誤:', err);

        // 添加特定錯誤處理邏輯
        if (err.response) {
          // 處理API返回的錯誤
          const status = err.response.status;
          const errorDetail = err.response.data?.detail || '';

          // 檢查用戶不存在的錯誤
          if (status === 404 || errorDetail === 'user_not_found' ||
              errorDetail.includes('用戶不存在') || errorDetail.includes('user not found')) {
            error.value = '您似乎還未註冊。註冊後即可接收XX幣。';
            return;
          }
        }

        // 如果不是特定錯誤，顯示通用錯誤訊息
        error.value = err.message || '確認交易失敗';
      } finally {
        isLoading.value = false;
      }
    };

    const resetReceiver = () => {
      scannedTransaction.value = null;
      confirmedTransaction.value = null;
      success.value = false;
      error.value = '';
      showManualEntry.value = false;
      manualTransactionId.value = '';
    };

    const goToDashboard = () => {
      router.push('/');
    };

    return {
      user,
      error,
      isLoading,
      scannedTransaction,
      confirmedTransaction,
      success,
      showManualEntry,
      manualTransactionId,
      formatDate,
      handleScan,
      handleManualEntry,
      confirmTransaction,
      resetReceiver,
      goToDashboard
    };
  }
}
</script>

<style scoped>
.receive-points-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2, h3 {
  margin-bottom: 1.5rem;
  color: #333;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.success-message {
  background-color: #d4edda;
  color: #155724;
  padding: 1.5rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  text-align: center;
}

.success-message h3 {
  color: #155724;
}

.instructions {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.transaction-details {
  margin-top: 1.5rem;
}

.transaction-info {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.transaction-info p {
  margin-bottom: 0.75rem;
}

.confirm-actions, .success-actions {
  display: flex;
  gap: 1rem;
}

.note {
  text-align: center;
  margin: 1.5rem 0;
  color: #7f8c8d;
}

.manual-entry {
  text-align: center;
  margin-top: 1rem;
}

.manual-form {
  margin-top: 1.5rem;
  padding: 1.5rem;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  flex: 1;
}

.btn-primary {
  background-color: #3498db;
  color: white;
}

.btn-primary:hover {
  background-color: #2980b9;
}

.btn-primary:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background-color: #7f8c8d;
}

@media (max-width: 768px) {
  .confirm-actions, .success-actions {
    flex-direction: column;
  }

  .btn {
    margin-bottom: 0.5rem;
  }
}
</style>
