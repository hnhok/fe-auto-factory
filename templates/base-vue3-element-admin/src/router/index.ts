import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            component: Layout,
            children: [
                {
                    path: '',
                    name: 'home',
                    component: () => import('@/views/HomeView.vue'),
                    meta: { title: '项目首页' }
                },
                {
                    path: 'order-detail',
                    name: 'orderDetail',
                    component: () => import('@/views/OrderDetail/index.vue'),
                    meta: { title: '订单详情' }
                },
                {
                    path: 'user-profile',
                    name: 'userProfile',
                    component: () => import('@/views/UserProfile/index.vue'),
                    meta: { title: '个人配置' }
                }
            ]
        }
    ]
})

export default router
