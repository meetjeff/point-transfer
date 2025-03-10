<template>
  <div class="public-transaction-container">
    <h2>交易詳情</h2>

    <div v-if="error" class="error-message">
      {{ error }}

      <div v-if="isUserNotRegistered" class="register-prompt">
        <p>您似乎還未註冊。註冊後即可接收XX幣。</p>
        <button class="btn btn-primary" @click="redirectToRegister">
          立即註冊
        </button>
      </div>
    </div>

    <div v-if="success" class="success-message">
      <h3>交易成功！</h3>
      <p>您已成功接收 {{ transaction.amount }} 點</p>
      <p>從: {{ transaction.senderName }}</p>

      <div class="success-actions">
        <button class="btn btn-primary" @click="$router.push('/login')">
          登入系統
        </button>
      </div>
    </div>

    <div v-else-if="transaction" class="transaction-details">
      <div class="transaction-info">
        <p><strong>發送方:</strong> {{ transaction.senderName }}</p>
        <p><strong>發送方ID:</strong> {{ transaction.senderId }}</p>
        <p><strong>金額:</strong> {{ transaction.amount }} 點</p>
        <p v-if="transaction.note"><strong>備註:</strong> {{ transaction.note }}</p>
        <p><strong>交易ID:</strong> {{ transaction.transactionId }}</p>
        <p v-if="transaction.expiresAt">
          <strong>有效期至:</strong> <LocalTime :datetime="transaction.expiresAt" format="full" checkExpiry />
        </p>
      </div>

      <form @submit.prevent="confirmTransaction" class="confirm-form">
        <div class="form-group">
          <label for="user-email">您的Email</label>
          <input
            type="email"
            id="user-email"
            v-model="receiverEmail"
            required
            placeholder="請輸入您的Email"
          />
          <small class="help-text">請輸入您在系統中的Email以接收XX幣</small>
        </div>

        <div class="confirm-actions">
          <button type="submit" class="btn btn-primary" :disabled="isLoading || !receiverEmail">
            {{ isLoading ? '處理中...' : '確認接收' }}
          </button>
        </div>
      </form>
    </div>

    <div v-else class="loading-state">
      <p>加載中...</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { confirmPublicTransaction, getPublicTransaction } from '../services/api';
import LocalTime from '../components/LocalTime.vue';

export default {
  name: 'PublicTransactionView',
  components: {
    LocalTime
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const transaction = ref(null);
    const receiverEmail = ref('');
    const error = ref('');
    const isLoading = ref(false);
    const success = ref(false);
    const isUserNotRegistered = ref(false);

    onMounted(async () => {
      const transactionId = route.params.id;
      if (!transactionId) {
        error.value = '找不到交易資料 (缺少交易ID)';
        return;
      }

      // 如果有email參數，自動填充
      if (route.query.email) {
        receiverEmail.value = route.query.email;
      }

      try {
        // 從API獲取交易詳情
        isLoading.value = true;
        console.log('通過API獲取交易詳情:', transactionId);
        transaction.value = await getPublicTransaction(transactionId);
        console.log('API獲取交易詳情成功:', transaction.value);
        isLoading.value = false;
      } catch (err) {
        isLoading.value = false;
        console.error('通過API獲取交易詳情失敗:', err);

        // 顯示更詳細的錯誤信息
        const errorDetail = err.response?.data?.detail || '';
        const errorStatus = err.response?.status;
        console.error('詳細錯誤信息:', { message: err.message, detail: errorDetail, status: errorStatus });

        // 如果API獲取失敗，嘗試從URL參數中解析
        if (route.query.data) {
          try {
            const decodedData = decodeURIComponent(route.query.data);
            console.log('嘗試從URL解析交易數據:', decodedData);
            transaction.value = JSON.parse(decodedData);

            // 驗證交易數據是否合法
            if (!transaction.value.transactionId) {
              error.value = '交易資料不完整 (缺少交易ID)';
            } else if (transaction.value.transactionId !== transactionId) {
              console.warn('URL中的交易ID與數據中的不符');
              // 優先使用URL中的交易ID
              transaction.value.transactionId = transactionId;
            }
          } catch (parseErr) {
            error.value = '解析交易資料失敗: ' + (parseErr.message || '未知錯誤');
            console.error('解析URL交易數據錯誤:', parseErr);
          }
        } else {
          error.value = '獲取交易詳情失敗: ' + (err.message || '未知錯誤');
        }
      }
    });

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString();
    };

    const confirmTransaction = async () => {
      if (!transaction.value) {
        error.value = '交易資料不存在';
        return;
      }

      if (!receiverEmail.value) {
        error.value = '請輸入您的Email';
        return;
      }

      error.value = '';
      isUserNotRegistered.value = false;
      isLoading.value = true;

      try {
        console.log('確認交易:', {
          transactionId: transaction.value.transactionId,
          receiverEmail: receiverEmail.value
        });

        const result = await confirmPublicTransaction(
          transaction.value.transactionId,
          receiverEmail.value
        );

        console.log('交易確認結果:', result);
        transaction.value = result;
        success.value = true;

        // 顯示成功信息5秒後自動跳轉到登入頁面
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      } catch (err) {
        console.error('交易確認錯誤:', err, '錯誤響應:', err.response);

        // 特別檢查錯誤是否與用戶未註冊有關
        const errorMessage = err.message || '';
        const errorDetail = err.response?.data?.detail || '';
        const errorStatus = err.response?.status;

        console.log('錯誤詳情:', { message: errorMessage, detail: errorDetail, status: errorStatus });

        // 檢查各種可能的錯誤模式
        if (
          errorStatus === 404 ||
          errorDetail === 'user_not_found' ||
          errorDetail.includes('用戶不存在') ||
          errorDetail.includes('user_not_found') ||
          errorMessage.includes('用戶不存在') ||
          errorMessage.includes('user_not_found')
        ) {
          isUserNotRegistered.value = true;
          error.value = '您使用的信箱尚未註冊。';
        } else {
          error.value = errorMessage || '確認交易失敗';
        }
      } finally {
        isLoading.value = false;
      }
    };

    const redirectToRegister = () => {
      // 將交易信息作為參數傳遞給註冊頁面
      router.push({
        path: '/register',
        query: {
          transaction: transaction.value.transactionId,
          data: JSON.stringify(transaction.value)
        }
      });
    };

    return {
      transaction,
      receiverEmail,
      error,
      isLoading,
      success,
      isUserNotRegistered,
      formatDate,
      confirmTransaction,
      redirectToRegister
    };
  }
}
</script>

<style scoped>
.public-transaction-container {
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

.register-prompt {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dc3545;
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

.transaction-info {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.transaction-info p {
  margin-bottom: 0.75rem;
}

.confirm-form {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
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

.help-text {
  display: block;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.confirm-actions {
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

.loading-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}
</style>
