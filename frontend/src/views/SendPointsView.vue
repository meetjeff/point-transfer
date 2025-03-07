<template>
  <div class="send-points-container">
    <h2>發送點數</h2>
    <p class="current-balance">目前餘額: {{ user ? user.balance : 0 }}</p>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-if="!transactionData">
      <form @submit.prevent="handleGenerateQR" class="send-form">
        <div class="form-group">
          <label for="amount">點數金額</label>
          <input
            type="number"
            id="amount"
            v-model="amount"
            required
            min="1"
            step="1"
            placeholder="請輸入點數金額"
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
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import QRCodeGenerator from '../components/QRCodeGenerator.vue';
import { prepareTransaction } from '../services/api';

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

    const handleGenerateQR = async () => {
      if (!isAmountValid.value) {
        error.value = '請輸入有效的點數金額（必須大於0且不超過您的餘額）';
        return;
      }

      error.value = '';
      isLoading.value = true;

      try {
        // 只包含後端API需要的字段
        const transactionRequest = {
          amount: parseFloat(amount.value),
          note: note.value
          // 不需要發送者信息，後端會從token中獲取
        };

        // 發送到服務商獲取簽名交易
        const signedTransaction = await prepareTransaction(transactionRequest);

        // 設置交易數據和QR碼內容
        transactionData.value = signedTransaction;
        qrCodeContent.value = JSON.stringify(signedTransaction);
        console.log('準備發送交易數據:', JSON.stringify(transactionRequest, null, 2));

      } catch (err) {
        error.value = err.message || '生成交易失敗，請稍後再試';
      } finally {
        isLoading.value = false;
      }
    };

    const handleReset = () => {
      transactionData.value = null;
      qrCodeContent.value = '';
      amount.value = '';
      note.value = '';
      error.value = '';
    };

    const handleCancel = () => {
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
      handleGenerateQR,
      handleReset,
      handleCancel,
      handleCancelTransaction
    };
  }
}
</script>

<style scoped>
.send-points-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 1rem;
  color: #333;
}

.current-balance {
  font-size: 1.125rem;
  margin-bottom: 1.5rem;
  color: #2c3e50;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.send-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  color: #333;
}

input, textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 1rem;
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
  margin: 1.5rem 0;
}

.note {
  margin: 0.5rem 0;
  color: #2c3e50;
}

.warning {
  color: #e74c3c;
  font-weight: bold;
}

.transaction-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

@media (max-width: 768px) {
  .form-actions, .transaction-actions {
    flex-direction: column;
  }

  .btn {
    margin-bottom: 0.5rem;
  }
}
</style>
