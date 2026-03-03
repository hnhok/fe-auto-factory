/**
 * UserCenter Pinia Store
 * [FACTORY-GENERATED] 支持 Features & State
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserCenterStore = defineStore('user-center', () => {
  const userCenterList = ref<any[]>([])
  const userCenterDetail = ref<any | null>(null)
  const userInfo = ref<any>()

  function setUserCenterList(list: any[]) { userCenterList.value = list }
  function reset() {
    userCenterList.value = []
    userCenterDetail.value = null
    
  }

  return { 
    userCenterList, userCenterDetail, 
    
    userInfo
    setUserCenterList, reset 
  }
})
