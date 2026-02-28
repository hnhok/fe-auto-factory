<template>
  <!-- [FACTORY-GENERATED] 页面骨架 · page_id: TaskCenter -->
  <!-- ✏️  请在 <!-- CONTENT --> 区域内填写业务 UI -->
  <div class="task-center-page" data-page-id="TaskCenter">
    <!-- 导航栏 -->
    <van-nav-bar
      title="任务中心"
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
      <!-- 搜索栏 -->
      <van-search
        v-model="searchText"
        placeholder="请输入任务关键字"
        data-track-id="task-search-confirm"
        @search="handleSearch"
        @clear="handleSearch"
      />

      <van-tabs v-model:active="activeTab">
        <van-tab title="全部任务">
          <van-list v-if="taskCenterData.list.length > 0">
            <van-cell
              v-for="task in taskCenterData.list"
              :key="task.id"
              :title="task.title"
              :label="`优先级: ${task.priority}`"
              data-track-id="task-item-click"
            >
              <template #value>
                <van-tag :type="getStatusType(task.status)">{{ task.status }}</van-tag>
              </template>
            </van-cell>
          </van-list>
          <van-empty v-else description="没找到相关任务" />
        </van-tab>
      </van-tabs>
    </div>
    <!-- CONTENT END ──────────────────────────────── -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskCenter } from './hooks/useTaskCenter'

const router = useRouter()
const activeTab = ref(0)
const {
  taskCenterData,
  searchText,
  loading,
  error,
  handleSearch,
} = useTaskCenter()

const getStatusType = (status: string) => {
  switch (status) {
    case '进行中': return 'primary'
    case '已完成': return 'success'
    case '待开始': return 'warning'
    default: return 'default'
  }
}
</script>

<style scoped lang="less">
.task-center-page {
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
