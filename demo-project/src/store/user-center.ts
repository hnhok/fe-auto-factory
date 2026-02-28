/**
 * UserCenter Pinia Store
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserCenterStore = defineStore('user-center', () => {
  // ─── State ───────────────────────────────────────────
  const userCenterList = ref<any[]>([])
  const userCenterDetail = ref<any | null>(null)
  const total = ref(0)

  // ─── Actions ─────────────────────────────────────────
  function setUserCenterList(list: any[]) {
    userCenterList.value = list
  }

  function setUserCenterDetail(detail: any) {
    userCenterDetail.value = detail
  }

  function reset() {
    userCenterList.value = []
    userCenterDetail.value = null
    total.value = 0
  }

  // BUSINESS LOGIC: 在此添加更多 actions
  
  return {
    userCenterList,
    userCenterDetail,
    total,
    setUserCenterList,
    setUserCenterDetail,
    reset,
  }
}, {
  persist: false, // 调整是否需要持久化
})
