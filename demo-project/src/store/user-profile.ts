/**
 * UserProfile Pinia Store
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserProfileStore = defineStore('user-profile', () => {
  // ─── State ───────────────────────────────────────────
  const userProfileList = ref<any[]>([])
  const userProfileDetail = ref<any | null>(null)
  const total = ref(0)

  // ─── Actions ─────────────────────────────────────────
  function setUserProfileList(list: any[]) {
    userProfileList.value = list
  }

  function setUserProfileDetail(detail: any) {
    userProfileDetail.value = detail
  }

  function reset() {
    userProfileList.value = []
    userProfileDetail.value = null
    total.value = 0
  }

  // BUSINESS LOGIC: 在此添加更多 actions
  
  return {
    userProfileList,
    userProfileDetail,
    total,
    setUserProfileList,
    setUserProfileDetail,
    reset,
  }
}, {
  persist: false, // 调整是否需要持久化
})
