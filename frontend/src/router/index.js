import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import SendPointsView from '../views/SendPointsView.vue'
import ReceivePointsView from '../views/ReceivePointsView.vue'
import PublicTransactionView from '../views/PublicTransactionView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView
  },
  {
    path: '/send',
    name: 'send',
    component: SendPointsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/receive',
    name: 'receive',
    component: ReceivePointsView,
    meta: { requiresAuth: true }
  },
  {
    path: '/transaction/:id',
    name: 'public-transaction',
    component: PublicTransactionView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 導航守衛
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token');

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'login' });
  } else {
    next();
  }
})

export default router
