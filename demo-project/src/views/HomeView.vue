<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<template>
  <div class="h-screen w-screen bg-gray-50 flex flex-col items-center justify-center p-4">
    <div class="i-logos-vue text-6xl mb-4" />
    <h1 class="text-xl font-bold mb-8 text-gray-800">Vue 3 + Vant 4 + Vite</h1>
    
    <van-space direction="vertical" fill :size="20" class="w-full">
      <van-button type="primary" block @click="count++">
        Count is: {{ count }}
      </van-button>
      
      <van-cell-group inset>
        <van-cell title="UnoCSS" value="Configured" />
        <van-cell title="Pinia" value="Configured" />
        <van-cell title="Router" value="Configured" />
        <van-cell title="Mobile Adapter" value="Configured" />
      </van-cell-group>
    </van-space>
  </div>
</template>
