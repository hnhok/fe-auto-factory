<template>
  <div class="order-auto-page" data-page-id="OrderAuto">
    <van-nav-bar :title="'[机器生成] Order 页面'" left-arrow @click-left="router.back()" />

    <!-- 骨架屏：首次加载时显示 -->
    <template v-if="loading && !state.list.length">
      <van-skeleton v-for="i in 3" :key="i" class="skeleton-item" :row="3" />
    </template>

    <!-- 错误态 -->
    <div v-else-if="error" class="state-wrapper">
      <van-empty image="error" :description="error">
        <van-button round type="primary" class="retry-btn" data-track-id="order-auto-error-retry" @click="refresh">
          重新加载
        </van-button>
      </van-empty>
    </div>

    <!-- 正常内容区 -->
    <template v-else>
      

          

                

                      <!-- 空态：列表为空且加载完成时 -->
                      <van-empty v-if="!loading && !state.list.length" description="暂无数据" />

                      <!-- 列表内容 -->
                      <template v-else>
                        <div v-for="item in state.list" :key="item.id" class="list-item">
                          <p>ID: {{ item.id }}</p>
            <p>PETID: {{ item.petId }}</p>
            <p>QUANTITY: {{ item.quantity }}</p>
            <p>SHIPDATE: {{ item.shipDate }}</p>
            <p>STATUS: {{ item.status }}</p>
            <p>COMPLETE: {{ item.complete }}</p>
                        </div>
                      </template>

                      

                    

              <!-- 自定义 UI 保留区 -->
              <!-- [FACTORY-CUSTOM-START] -->
              <!-- 在此编写自定义 UI -->
                <!-- [FACTORY-CUSTOM-END] -->
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useOrderAuto } from './hooks/useOrderAuto'

  const router = useRouter()
  const refreshing = ref(false)
    
const { loading, error, state, refresh, loadMore } = use OrderAuto ()

    





// [FACTORY-SCRIPT-START]

  // [FACTORY-SCRIPT-END]
</script>

<style scoped>
  .order-auto-page {
    min-height: 100vh;
    background: #f5f5f5;
  }

  .skeleton-item {
    margin: 12px 16px;
    padding: 16px;
    background: #fff;
    border-radius: 8px;
  }

  .state-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 60vh;
  }

  .retry-btn {
    width: 120px;
    margin-top: 8px;
  }

  .list-item {
    background: #fff;
    padding: 12px 16px;
    margin: 0 12px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    transition: box-shadow 0.2s;
  }

  .list-item:active {
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }
</style>