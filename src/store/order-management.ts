/**
 * OrderManagement Pinia Store
 * [FACTORY-GENERATED] 支持 Features & State
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IOrder } from '@/api/types/order-management'

export const useOrderManagementStore = defineStore('order-management', () => {
  const orderManagementList = ref<IOrder[]>([])
  const orderManagementDetail = ref<IOrder | null>(null)


  function setOrderManagementList(list: IOrder[]) { orderManagementList.value = list }
  function reset() {
    orderManagementList.value = []
    orderManagementDetail.value = null
    
  }

  return { 
    orderManagementList, orderManagementDetail, 
    
    
    setOrderManagementList, reset 
  }
})
