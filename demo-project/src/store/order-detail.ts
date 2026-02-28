/**
 * OrderDetail Pinia Store
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOrderDetailStore = defineStore('order-detail', () => {
  // ─── State ───────────────────────────────────────────
  const orderDetailList = ref<any[]>([])
  const orderDetailDetail = ref<any | null>(null)
  const total = ref(0)

  // ─── Actions ─────────────────────────────────────────
  function setOrderDetailList(list: any[]) {
    orderDetailList.value = list
  }

  function setOrderDetailDetail(detail: any) {
    orderDetailDetail.value = detail
  }

  function reset() {
    orderDetailList.value = []
    orderDetailDetail.value = null
    total.value = 0
  }

  // BUSINESS LOGIC: 在此添加更多 actions
  
  return {
    orderDetailList,
    orderDetailDetail,
    total,
    setOrderDetailList,
    setOrderDetailDetail,
    reset,
  }
}, {
  persist: false, // 调整是否需要持久化
})
