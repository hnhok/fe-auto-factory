/**
 * Test Pinia Store
 * [FACTORY-GENERATED] 支持 Features & State
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTestStore = defineStore('test', () => {
  const testList = ref<any[]>([])
  const testDetail = ref<any | null>(null)


  function setTestList(list: any[]) { testList.value = list }
  function reset() {
    testList.value = []
    testDetail.value = null
    
  }

  return { 
    testList, testDetail, 
    
    
    setTestList, reset 
  }
})
