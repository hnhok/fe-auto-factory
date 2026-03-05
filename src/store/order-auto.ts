/**
 * OrderAuto Pinia Store
 * [FACTORY-GENERATED] 支持 Features & State
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { IOrder } from '@/api/types/order-auto'

export const useOrderAutoStore = defineStore('order-auto', () => {
  const orderAutoList = ref<IOrder[]>([])
  const orderAutoDetail = ref<IOrder | null>(null)
  const keyword = ref<string>()

  function setOrderAutoList(list: IOrder[]) { orderAutoList.value = list }
  function reset() {
    orderAutoList.value = []
    orderAutoDetail.value = null
    
  }

  return { 
    orderAutoList, orderAutoDetail, 
    
    keyword
    setOrderAutoList, reset 
  }
})
