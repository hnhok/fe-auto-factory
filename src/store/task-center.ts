/**
 * TaskCenter Pinia Store
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTaskCenterStore = defineStore('task-center', () => {
  // ─── State ───────────────────────────────────────────
  const taskCenterList = ref<any[]>([])
  const taskCenterDetail = ref<any | null>(null)
  const total = ref(0)

  // ─── Actions ─────────────────────────────────────────
  function setTaskCenterList(list: any[]) {
    taskCenterList.value = list
  }

  function setTaskCenterDetail(detail: any) {
    taskCenterDetail.value = detail
  }

  function reset() {
    taskCenterList.value = []
    taskCenterDetail.value = null
    total.value = 0
  }

  // BUSINESS LOGIC: 在此添加更多 actions
  
  return {
    taskCenterList,
    taskCenterDetail,
    total,
    setTaskCenterList,
    setTaskCenterDetail,
    reset,
  }
}, {
  persist: false, // 调整是否需要持久化
})
