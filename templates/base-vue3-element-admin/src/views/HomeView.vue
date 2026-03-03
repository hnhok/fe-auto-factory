<template>
  <el-card shadow="never" class="home-card">
    <template #header>
      <div class="card-header">
        <div class="i-logos-vue text-4xl mb-2" />
        <h2 class="text-xl font-bold">Vue 3 + Element Plus + Vite</h2>
      </div>
    </template>
    
    <div class="content text-center py-8">
      <el-statistic title="今日访问量" :value="count" />
      <div class="mt-8 space-x-4">
        <el-button type="primary" @click="count++">
          增加访客量: {{ count }}
        </el-button>
        <el-button @click="count = 0">重置</el-button>
      </div>
    </div>
    
    <el-descriptions title="项目信息" :column="2" border class="mt-8">
      <el-descriptions-item label="核心框架">Vue 3.5</el-descriptions-item>
      <el-descriptions-item label="组件库">Element Plus</el-descriptions-item>
      <el-descriptions-item label="工程化">Vite 6 / UnoCSS</el-descriptions-item>
      <el-descriptions-item label="状态管理">Pinia</el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<style scoped>
.home-card {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
