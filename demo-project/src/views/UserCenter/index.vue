<template>
  <!-- [FACTORY-GENERATED] 页面骨架 · page_id: UserCenter -->
  <!-- ✏️  请在 <!-- CONTENT --> 区域内填写业务 UI -->
  <div class="user-center-page" data-page-id="UserCenter">
    <!-- 导航栏 -->
    <van-nav-bar
      title="普通H5用户中心"
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
      <!-- TODO: 渲染 userCenterData 数据 -->
      <!-- 例如:
      <DataTable :data="userCenterData.list" />
      -->
      <van-empty description="开发中..." />
    </div>
    <!-- CONTENT END ──────────────────────────────── -->
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserCenter } from './hooks/useUserCenter'

// [FACTORY-GENERATED] 自动注入的 Composable
const router = useRouter()
const {
  // userCenterData,  // ← 取消注释后可在 CONTENT 区域中使用
  loading,
  error,
  refresh,
  // BUSINESS LOGIC: 在此解构更多业务方法
} = useUserCenter()
</script>

<style scoped lang="less">
.user-center-page {
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

/* 布局专属样式 */
.dashboard-layout {
  display: flex;
  gap: 16px;
  .sidebar { width: 200px; background: white; padding: 16px; border-radius: 8px; }
  .main-area { flex: 1; background: white; padding: 16px; border-radius: 8px; }
}

.admin-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 46px);
  .admin-header { height: 60px; background: #fff; border-bottom: 1px solid #ebedf0; padding: 0 20px; display: flex; align-items: center; }
  .admin-body { display: flex; flex: 1; overflow: hidden; }
  .admin-sidebar { width: 240px; background: #fff; border-right: 1px solid #ebedf0; }
  .admin-main { flex: 1; padding: 20px; overflow-y: auto; }
}
</style>
