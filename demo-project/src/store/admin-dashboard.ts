/**
 * AdminDashboard Pinia Store
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdminDashboardStore = defineStore('admin-dashboard', () => {
  // ─── State ───────────────────────────────────────────
  const adminDashboardList = ref<any[]>([])
  const adminDashboardDetail = ref<any | null>(null)
  const total = ref(0)

  // ─── Actions ─────────────────────────────────────────
  function setAdminDashboardList(list: any[]) {
    adminDashboardList.value = list
  }

  function setAdminDashboardDetail(detail: any) {
    adminDashboardDetail.value = detail
  }

  function reset() {
    adminDashboardList.value = []
    adminDashboardDetail.value = null
    total.value = 0
  }

  // BUSINESS LOGIC: 在此添加更多 actions
  
  return {
    adminDashboardList,
    adminDashboardDetail,
    total,
    setAdminDashboardList,
    setAdminDashboardDetail,
    reset,
  }
}, {
  persist: false, // 调整是否需要持久化
})
