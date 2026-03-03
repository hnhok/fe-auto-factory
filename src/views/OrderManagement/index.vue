<template>
  <div class="order-management-page" data-page-id="OrderManagement">
    <van-nav-bar :title="'订单管理'" left-arrow @click-left="router.back()" />
    
    <div class="content">
      
      <div v-for="item in state.list" :key="item.id" class="list-item">
          <p>ID: {{ item.id }}</p>
            <p>ORDER_NO: {{ item.order_no }}</p>
            <p>CUSTOMER_NAME: {{ item.customer_name }}</p>
            <p>TOTAL_AMOUNT: {{ item.total_amount }}</p>
            <p>STATUS: {{ item.status }}</p>
            <p>CREATE_TIME: {{ item.create_time }}</p>
      </div>

      <!-- [FACTORY-CUSTOM-START] -->
      <!-- 这里可以编写您的自定义业务 UI (保留区) -->
      <!-- [FACTORY-CUSTOM-END] -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useOrderManagement } from './hooks/useOrderManagement'

const router = useRouter()
const refreshing = ref(false)
const { loading, error, state, refresh, loadMore } = useOrderManagement()

// [FACTORY-SCRIPT-START]
// 在此处编写您的自定义业务逻辑 (保留区)
// [FACTORY-SCRIPT-END]

const onRefresh = async () => {
  await refresh()
  refreshing.value = false
}

const onLoad = () => {
  loadMore()
}
</script>

<style scoped>
.content { padding: 16px; }
.list-item { 
  background: #fff; 
  padding: 12px; 
  margin-bottom: 12px; 
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
</style>
