import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/MainLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard'
        },
        {
          path: 'dashboard',
          component: () => import('@/views/Dashboard.vue')
        },
        {
          path: 'products',
          component: () => import('@/views/Products.vue')
        },
        {
          path: 'orders',
          component: () => import('@/views/Orders.vue')
        }
      ]
    },
    // 管理员路由
    {
      path: '/admin',
      component: () => import('@/views/admin/AdminDashboard.vue'),
      children: [
        {
          path: '',
          redirect: '/admin/dashboard'
        },
        {
          path: 'dashboard',
          component: () => import('@/views/admin/Dashboard.vue')
        },
        {
          path: 'shops',
          component: () => import('@/views/admin/Shops.vue')
        },
        {
          path: 'users',
          component: () => import('@/views/admin/Users.vue')
        },
        {
          path: 'settings',
          component: () => import('@/views/admin/SystemSettings.vue')
        }
      ]
    },
    {
      path: '/db-test',
      name: 'DBTest',
      component: () => import('@/views/DBTest.vue')
    }
  ]
})

export default router 