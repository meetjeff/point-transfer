<template>
  <div class="login-container">
    <h2>登錄賬號</h2>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>

    <form @submit.prevent="handleLogin" class="login-form">
      <div class="form-group">
        <label for="email">電子郵件</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
          placeholder="your@email.com"
        />
      </div>

      <div class="form-group">
        <label for="password">密碼</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
          placeholder="您的密碼"
        />
      </div>

      <button type="submit" class="btn btn-primary" :disabled="isLoading">
        {{ isLoading ? '登入中...' : '登入' }}
      </button>
    </form>

    <div class="login-footer">
      <p>還沒有賬號？ <a href="#" @click.prevent="goToRegister">註冊</a></p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'LoginView',
  setup() {
    const store = useStore();
    const router = useRouter();

    const email = ref('');
    const password = ref('');
    const error = ref('');
    const isLoading = ref(false);

    const handleLogin = async () => {
      error.value = '';
      isLoading.value = true;

      try {
        await store.dispatch('login', {
          email: email.value,
          password: password.value
        });

        router.push('/');
      } catch (err) {
        error.value = err.message || '登入失敗，請檢查您的憑證';
      } finally {
        isLoading.value = false;
      }
    };

    const goToRegister = () => {
      router.push('/register');
    };

    onMounted(() => {
      // 自動填充測試憑據
      email.value = 'test@example.com';
      password.value = 'password';
    });

    return {
      email,
      password,
      error,
      isLoading,
      handleLogin,
      goToRegister
    };
  }
}
</script>

<style scoped>
.login-container {
  max-width: 480px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.error-message {
  background-color: #f8d7da;
  color: #721c24;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.login-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1rem;
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

.btn {
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
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

.login-footer {
  margin-top: 1.5rem;
  text-align: center;
  color: #666;
}

.login-footer a {
  color: #3498db;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}
</style>
