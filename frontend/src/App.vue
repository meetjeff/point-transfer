<template>
  <NavBar />
  <main class="container">
    <router-view />
  </main>
</template>

<script>
import { onMounted } from 'vue';
import { useStore } from 'vuex';
import NavBar from './components/NavBar.vue';

export default {
  name: 'App',
  components: {
    NavBar
  },
  setup() {
    const store = useStore();

    onMounted(() => {
      // 檢查本地存儲中是否有token，如果有則嘗試獲取用戶信息
      const token = localStorage.getItem('token');
      if (token) {
        store.dispatch('fetchCurrentUser');
      }
    });
  }
}
</script>

<style>
/* 全局樣式可以在這裡添加 */
</style>
