<template>
  <nav class="navbar">
    <div class="navbar-brand">
      <router-link to="/" class="navbar-logo">點數交易系統</router-link>
    </div>

    <div class="navbar-menu" v-if="isAuthenticated">
      <span class="balance" v-if="user">點數餘額: {{ user.balance }}</span>
      <div class="navbar-links">
        <router-link to="/" class="navbar-item">首頁</router-link>
        <router-link to="/send" class="navbar-item">發送點數</router-link>
        <router-link to="/receive" class="navbar-item">接收點數</router-link>
        <button @click="handleLogout" class="logout-btn">登出</button>
      </div>
    </div>

    <div class="navbar-menu" v-else>
      <div class="navbar-links">
        <router-link to="/login" class="navbar-item">登入</router-link>
      </div>
    </div>
  </nav>
</template>

<script>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'NavBar',
  setup() {
    const store = useStore();
    const router = useRouter();

    const user = computed(() => store.getters.currentUser);
    const isAuthenticated = computed(() => store.getters.isAuthenticated);

    const handleLogout = async () => {
      try {
        await store.dispatch('logout');
        router.push('/login');
      } catch (error) {
        console.error('登出失敗', error);
      }
    };

    return {
      user,
      isAuthenticated,
      handleLogout
    };
  }
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #3498db;
  color: white;
  padding: 1rem;
}

.navbar-logo {
  font-size: 1.25rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
}

.navbar-menu {
  display: flex;
  align-items: center;
}

.balance {
  margin-right: 1.5rem;
  font-weight: bold;
}

.navbar-links {
  display: flex;
  align-items: center;
}

.navbar-item {
  color: white;
  text-decoration: none;
  margin-left: 1rem;
}

.navbar-item:hover {
  text-decoration: underline;
}

.logout-btn {
  margin-left: 1rem;
  background: none;
  border: 1px solid white;
  color: white;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
