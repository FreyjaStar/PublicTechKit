import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/register/:sessionId',
      name: 'register',
      component: () => import('../views/Register.vue'),
    },
    {
      path: '/auth/:sessionId',
      name: 'auth',
      component: () => import('../views/Auth.vue'),
    },
  ],
});

export default router;
