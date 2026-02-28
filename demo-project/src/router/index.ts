import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'home',
            component: () => import('@/views/HomeView.vue')
        },
        {
            path: '/order-detail',
            name: 'orderDetail',
            component: () => import('@/views/OrderDetail/index.vue')
        },
        {
            path: '/user-profile',
            name: 'userProfile',
            component: () => import('@/views/UserProfile/index.vue')
        },
        {
            path: '/user-center',
            name: 'userCenter',
            component: () => import('@/views/UserCenter/index.vue')
        },
        {
            path: '/admin-dashboard',
            name: 'adminDashboard',
            component: () => import('@/views/AdminDashboard/index.vue')
        }
    ]
})

export default router
