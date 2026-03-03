<template>
  <!-- [FACTORY-GENERATED] 页面骨架 · page_id: OrderDetail -->
  <div class="order-detail-page" data-page-id="OrderDetail">
    <el-page-header @back="router.back()">
      <template #content>
        <span class="text-large font-600 mr-3"> 订单详情 </span>
      </template>
    </el-page-header>

    <div v-loading="loading" class="mt-6">
      <!-- 全局错误状态 -->
      <el-empty
        v-if="error"
        :description="error"
      >
        <el-button type="primary" @click="refresh">重试</el-button>
      </el-empty>

      <!-- CONTENT START: 在此填写业务 UI ─────────────── -->
      <div v-else class="page-content">
        <el-card shadow="never">
          <!-- TODO: 渲染 orderDetailData 数据 -->
          <el-empty description="订单详情内容开发中..." />
        </el-card>
      </div>
      <!-- CONTENT END ──────────────────────────────── -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useOrderDetail } from './hooks/useOrderDetail'

const router = useRouter()
const {
  // orderDetailData,
  loading,
  error,
  refresh,
} = useOrderDetail()
</script>

<style scoped lang="less">
.order-detail-page {
  padding: 4px;
}
</style>
