<template>
  <!-- [FACTORY-GENERATED] 页面骨架 · page_id: UserProfile -->
  <div class="user-profile-page" data-page-id="UserProfile">
    <el-page-header @back="router.back()">
      <template #content>
        <span class="text-large font-600 mr-3"> 用户中心 </span>
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
          <!-- TODO: 渲染 userProfileData 数据 -->
          <el-empty description="用户中心内容开发中..." />
        </el-card>
      </div>
      <!-- CONTENT END ──────────────────────────────── -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useUserProfile } from './hooks/useUserProfile'

const router = useRouter()
const {
  // userProfileData,
  loading,
  error,
  refresh,
} = useUserProfile()
</script>

<style scoped lang="less">
.user-profile-page {
  padding: 4px;
}
</style>
