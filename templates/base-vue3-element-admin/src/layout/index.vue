<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <div class="i-logos-vue text-2xl mr-2" />
        <span>V3 Admin</span>
      </div>
      <el-menu
        :default-active="activePath"
        class="el-menu-vertical"
        router
      >
        <el-menu-item index="/">
          <el-icon><div class="i-ep-home-filled" /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/order-detail">
          <el-icon><div class="i-ep-list" /></el-icon>
          <span>订单详情</span>
        </el-menu-item>
        <el-menu-item index="/user-profile">
          <el-icon><div class="i-ep-user" /></el-icon>
          <span>用户中心</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="breadcrumb">
          <span>{{ title }}</span>
        </div>
        <div class="user-info">
          <el-dropdown>
            <span class="el-dropdown-link">
              Admin <el-icon class="el-icon--right"><div class="i-ep-arrow-down" /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activePath = computed(() => route.path)
const title = computed(() => (route.meta.title as string) || '后台管理')
</script>

<style scoped lang="less">
.layout-container {
  height: 100vh;
  
  .aside {
    background-color: #304156;
    color: white;
    box-shadow: 2px 0 8px rgba(0,0,0,0.1);
    
    .logo {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 18px;
      background: #2b2f3a;
    }
    
    .el-menu-vertical {
      border-right: none;
      background-color: transparent;
      
      :deep(.el-menu-item) {
        color: #bfcbd9;
        
        &:hover, &.is-active {
          color: white;
          background-color: #263445;
        }
      }
    }
  }
}

.header {
  height: 60px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
}
</style>
