<template>
  <!-- [FACTORY-GENERATED] 页面骨架 · page_id: OrderDetail -->
  <!-- ✏️  请在 <!-- CONTENT --> 区域内填写业务 UI -->
  <div class="order-detail-page" data-page-id="OrderDetail">
    <!-- 导航栏 -->
    <van-nav-bar
      title="订单详情"
      left-arrow
      @click-left="router.back()"
    />

    <!-- 全局 Loading 状态 -->
    <div v-if="loading" class="page-loading">
      <van-loading type="spinner" size="36" />
    </div>

    <!-- 全局错误状态 -->
    <van-empty
      v-else-if="error"
      image="error"
      :description="error"
    >
      <van-button type="primary" size="small" @click="refresh">重试</van-button>
    </van-empty>

    <!-- CONTENT START: 在此填写业务 UI ─────────────── -->
    <div v-else class="page-content">
      <!-- TODO: 渲染 orderDetailData 数据 -->
      <!-- 例如:
      <DataTable :data="orderDetailData.list" />
      -->
      <van-empty description="开发中..." />
    </div>
    <!-- CONTENT END ──────────────────────────────── -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useOrderDetail } from './hooks/useOrderDetail'

// [FACTORY-GENERATED] 自动注入的 Composable
const router = useRouter()
const {
  // orderDetailData,  // ← 取消注释后可在 CONTENT 区域中使用
  loading,
  error,
  refresh,
  // BUSINESS LOGIC: 在此解构更多业务方法
} = useOrderDetail()
</script>

<style scoped lang="less">
.order-detail-page {
  min-height: 100vh;
  background: #f7f8fa;

  .page-loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 120px 0;
  }

  .page-content {
    padding: 12px 16px;
  }
}
</style>
