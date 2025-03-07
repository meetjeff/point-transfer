<template>
  <div class="register-container">
    <h2>用戶註冊</h2>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <form @submit.prevent="handleRegister" class="register-form">
      <div class="form-group">
        <label for="name">姓名</label>
        <input
          type="text"
          id="name"
          v-model="name"
          required
          placeholder="請輸入您的姓名"
        />
      </div>

      <div class="form-group">
        <label for="email">電子郵件</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          placeholder="請輸入您的電子郵件"
        />
      </div>

      <div class="form-group">
        <label for="password">密碼</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          placeholder="請設置密碼 (至少6位)"
          minlength="6"
        />
      </div>

      <div class="form-group">
        <label for="confirm-password">確認密碼</label>
        <input
          type="password"
          id="confirm-password"
          v-model="confirmPassword"
          required
          placeholder="請再次輸入密碼"
          minlength="6"
        />
      </div>

      <div v-if="redirectTransactionId" class="redirect-info">
        <p>註冊後您將能夠領取之前的交易XX幣</p>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isLoading || !isFormValid">
          {{ isLoading ? '處理中...' : '註冊' }}
        </button>
        <button type="button" class="btn btn-secondary" @click="redirectToLogin">
          已有帳號？登入
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { register } from '../services/auth';

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter();
    const route = useRoute();

    const name = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const error = ref('');
    const isLoading = ref(false);

    // 獲取URL參數中的交易ID，用於註冊後重定向
    const redirectTransactionId = computed(() => route.query.transaction);
    const redirectTransactionData = computed(() => route.query.data);

    const isFormValid = computed(() => {
      return (
        name.value &&
        email.value &&
        password.value.length >= 6 &&
        password.value === confirmPassword.value
      );
    });

    const handleRegister = async () => {
      if (!isFormValid.value) {
        if (password.value !== confirmPassword.value) {
          error.value = '兩次輸入的密碼不一致';
        } else if (password.value.length < 6) {
          error.value = '密碼至少需要6位';
        } else {
          error.value = '請填寫所有必填欄位';
        }
        return;
      }

      error.value = '';
      isLoading.value = true;

      try {
        // 呼叫註冊API
        const userData = await register({
          name: name.value,
          email: email.value,
          password: password.value
        });

        // 註冊成功後重定向
        if (redirectTransactionId.value && redirectTransactionData.value) {
          // 重定向回交易頁面，傳遞用戶email
          router.push(`/transaction/${redirectTransactionId.value}?data=${redirectTransactionData.value}&email=${userData.email}`);
        } else {
          // 重定向到登入頁面
          router.push('/login');
        }
      } catch (err) {
        error.value = err.message || '註冊失敗，請稍後再試';
      } finally {
        isLoading.value = false;
      }
    };

    const redirectToLogin = () => {
      router.push('/login');
    };

    return {
      name,
      email,
      password,
      confirmPassword,
      error,
      isLoading,
      isFormValid,
      redirectTransactionId,
      handleRegister,
      redirectToLogin
    };
  }
}
</script>

<style scoped>
.register-container {
  max-width: 500px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
}

.register-form {
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

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
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

.redirect-info {
  background-color: #e8f4fd;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;
  color: #31708f;
}
</style>
