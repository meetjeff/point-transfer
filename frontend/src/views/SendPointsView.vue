<template>
  <div class="send-points-container">
    <h2>發送XX幣</h2>
    <!-- <p class="current-balance">目前餘額: {{ user ? user.balance : 0 }}</p> -->

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="!transactionData">
      <div class="quick-amount-buttons">
        <button
          v-for="(value, index) in quickAmounts"
          :key="index"
          class="quick-amount-btn"
          @click="selectQuickAmount(value)"
          :disabled="value > (user?.balance || 0)">
          {{ value }} 點
        </button>
      </div>

      <form @submit.prevent="handleGenerateQR" class="send-form">
        <div class="form-group">
          <label for="amount">XX幣金額</label>
          <input
            type="number"
            id="amount"
            v-model="amount"
            required
            min="1"
            step="1"
            placeholder="請輸入XX幣金額"
          />
        </div>

        <div class="form-group">
          <label for="note">備註（選填）</label>
          <textarea
            id="note"
            v-model="note"
            maxlength="100"
            placeholder="選填備註，限100字"
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="isLoading || !isAmountValid">
            {{ isLoading ? '處理中...' : '生成 QR Code' }}
          </button>
          <button type="button" class="btn btn-secondary" @click="handleCancel">
            取消
          </button>
        </div>
      </form>
    </div>

    <div v-else class="transaction-result">
      <QRCodeGenerator
        :qr-code-value="qrCodeContent"
        :transaction-id="transactionData.transactionId"
        :amount="transactionData.amount"
        :expiry-time="transactionData.expiresAt"
      />

      <div class="transaction-info">
        <p>請讓接收方掃描上方 QR Code</p>
        <p class="note" v-if="transactionData.note">備註: {{ transactionData.note }}</p>
        <p class="warning">此交易將在 {{ getExpiryMinutes }} 分鐘後失效</p>

        <p v-if="autoChecking" class="auto-checking">
          <span class="checking-indicator"></span>
          系統正在自動檢查交易狀態，完成後將自動跳轉至首頁
        </p>
      </div>

      <div class="transaction-actions">
        <button class="btn btn-secondary" @click="handleReset">
          重新開始
        </button>
        <button class="btn btn-danger" @click="handleCancelTransaction">
          取消交易
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import QRCodeGenerator from '../components/QRCodeGenerator.vue';
import { prepareTransaction, getTransaction } from '../services/api';

export default {
  name: 'SendPointsView',
  components: {
    QRCodeGenerator
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    const amount = ref('');
    const note = ref('');
    const error = ref('');
    const isLoading = ref(false);
    const transactionData = ref(null);
    const qrCodeContent = ref('');
    const autoChecking = ref(false);
    let transactionCheckInterval = null;

    // 從環境變數中獲取預設金額
    const quickAmounts = ref([
      parseInt(import.meta.env.VITE_QUICK_AMOUNT_1 || '10'),
      parseInt(import.meta.env.VITE_QUICK_AMOUNT_2 || '50'),
      parseInt(import.meta.env.VITE_QUICK_AMOUNT_3 || '100')
    ]);

    const user = computed(() => store.getters.currentUser);

    const isAmountValid = computed(() => {
      const amountValue = parseFloat(amount.value);
      return amountValue > 0 && amountValue <= (user.value?.balance || 0);
    });

    const getExpiryMinutes = computed(() => {
      if (!transactionData.value || !transactionData.value.expiresAt) return 5;

      const now = new Date();
      const expiryTime = new Date(transactionData.value.expiresAt);
      const diffMs = expiryTime - now;
      return Math.ceil(diffMs / (1000 * 60));
    });

    // 定期檢查交易狀態的函數
    const startTransactionStatusCheck = (transactionId) => {
      if (!transactionId) return;

      // 清除現有的計時器
      if (transactionCheckInterval) {
        clearInterval(transactionCheckInterval);
      }

      autoChecking.value = true;
      console.log(`開始檢查交易 ${transactionId} 的狀態...`);

      // 設置一個定期檢查交易狀態的計時器，每3秒檢查一次
      transactionCheckInterval = setInterval(async () => {
        try {
          // 獲取最新的交易狀態
          const updatedTransaction = await getTransaction(transactionId);
          console.log(`交易 ${transactionId} 當前狀態: ${updatedTransaction.status}`);

          // 如果交易已完成
          if (updatedTransaction.status === 'completed') {
            console.log(`交易 ${transactionId} 已完成，準備跳轉到首頁`);

            // 停止定期檢查
            clearInterval(transactionCheckInterval);
            transactionCheckInterval = null;
            autoChecking.value = false;

            // 重新獲取用戶資料以更新餘額
            await store.dispatch('fetchCurrentUser');

            // 顯示成功信息3秒後自動跳轉到首頁
            setTimeout(() => {
              router.push('/');
            }, 3000);
          }
        } catch (err) {
          console.error(`檢查交易 ${transactionId} 狀態出錯:`, err);
          // 出錯時不停止檢查，繼續嘗試
        }
      }, 3000); // 每3秒檢查一次
    };

    const handleGenerateQR = async () => {
      if (!isAmountValid.value) {
        error.value = '請輸入有效的XX幣金額（必須大於0且不超過您的餘額）';
        return;
      }

      error.value = '';
      isLoading.value = true;

      try {
        const transactionRequest = {
          amount: parseFloat(amount.value),
          note: note.value
        };

        // 發送到服務商獲取簽名交易
        const signedTransaction = await prepareTransaction(transactionRequest);

        // 設置交易數據和QR碼內容
        transactionData.value = signedTransaction;
        qrCodeContent.value = JSON.stringify(signedTransaction);
        console.log('準備發送交易數據:', JSON.stringify(transactionRequest, null, 2));

        // 開始檢查交易狀態
        startTransactionStatusCheck(signedTransaction.transactionId);

      } catch (err) {
        error.value = err.message || '生成交易失敗，請稍後再試';
      } finally {
        isLoading.value = false;
      }
    };

    const handleReset = () => {
      // 清除計時器
      if (transactionCheckInterval) {
        clearInterval(transactionCheckInterval);
        transactionCheckInterval = null;
      }
      autoChecking.value = false;

      transactionData.value = null;
      qrCodeContent.value = '';
      amount.value = '';
      note.value = '';
      error.value = '';
    };

    const handleCancel = () => {
      // 清除計時器
      if (transactionCheckInterval) {
        clearInterval(transactionCheckInterval);
        transactionCheckInterval = null;
      }
      autoChecking.value = false;

      router.push('/');
    };

    const handleCancelTransaction = async () => {
      // 實際應用中應該調用API取消交易
      const confirm = window.confirm('確定要取消此交易嗎？');
      if (confirm) {
        try {
          // 這裡可以加入取消交易的API調用
          // await cancelTransaction(transactionData.value.transactionId);
          alert('交易已取消');
          handleReset();
        } catch (err) {
          error.value = '取消交易失敗: ' + err.message;
        }
      }
    };

    // 選擇快捷金額並直接生成QR碼
    const selectQuickAmount = async (value) => {
      if (value > (user.value?.balance || 0)) {
        error.value = '選擇的金額超過您的餘額';
        return;
      }

      amount.value = value.toString();
      await handleGenerateQR();
    };

    // 組件卸載時清除計時器
    onUnmounted(() => {
      if (transactionCheckInterval) {
        clearInterval(transactionCheckInterval);
        transactionCheckInterval = null;
      }
    });

    return {
      user,
      amount,
      note,
      error,
      isLoading,
      transactionData,
      qrCodeContent,
      isAmountValid,
      getExpiryMinutes,
      autoChecking,
      handleGenerateQR,
      handleReset,
      handleCancel,
      handleCancelTransaction,
      quickAmounts,
      selectQuickAmount
    };
  }
}
</script>

<style scoped>
.send-points-container {
  max-width: 600px;
  margin: 1.5rem auto;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.quick-amount-buttons {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 1rem;
}

.quick-amount-btn {
  flex: 1;
  padding: 0.6rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.quick-amount-btn:hover {
  background-color: #2980b9;
}

.quick-amount-btn:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

h2 {
  margin-bottom: 0.7rem;
  color: #333;
}

.current-balance {
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.6rem;
  border-radius: 4px;
  margin-bottom: 0.8rem;
}

.send-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.3rem;
  font-weight: bold;
  color: #333;
}

input, textarea {
  width: 100%;
  padding: 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

textarea {
  min-height: 80px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 0.8rem;
}

.btn {
  padding: 0.6rem 1.2rem;
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

.btn-danger {
  background-color: #e74c3c;
  color: white;
}

.btn-danger:hover {
  background-color: #c0392b;
}

.transaction-result {
  text-align: center;
}

.transaction-info {
  margin: 1rem 0;
}

.note {
  margin: 0.4rem 0;
  color: #2c3e50;
}

.warning {
  color: #e74c3c;
  font-weight: bold;
  margin: 0.4rem 0;
}

.transaction-actions {
  display: flex;
  gap: 0.8rem;
  margin-top: 1rem;
}

.auto-checking {
  margin-top: 0.8rem;
  padding: 0.4rem;
  background-color: #e8f4fd;
  color: #3498db;
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
}

.checking-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #3498db;
  margin-right: 0.5rem;
  animation: pulse 1.5s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
}

@media (max-width: 768px) {
  .form-actions, .transaction-actions {
    flex-direction: column;
  }

  .btn {
    margin-bottom: 0.4rem;
  }
}
</style>
