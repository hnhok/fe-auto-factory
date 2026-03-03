/**
 * AdminDashboard Pinia Store
 * [FACTORY-GENERATED] 支持 Features & State
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAdminDashboardStore = defineStore('admin-dashboard', () => {
  const adminDashboardList = ref<any[]>([])
  const adminDashboardDetail = ref<any | null>(null)
  const stats = ref<any>()

  function setAdminDashboardList(list: any[]) { adminDashboardList.value = list }
  function reset() {
    adminDashboardList.value = []
    adminDashboardDetail.value = null
    
  }

  return { 
    adminDashboardList, adminDashboardDetail, 
    
    stats
    setAdminDashboardList, reset 
  }
})
