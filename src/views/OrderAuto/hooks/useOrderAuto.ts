/**
* useOrderAuto — Composable [Vant H5]
    * [FACTORY-GENERATED] 支持 Features & State & 增量保护
    */
    import { ref, reactive, onMounted } from 'vue'
    import { showToast } from 'vant'
    import type { IOrder } from '@/api/types/order-auto'

        import { getOrderList } from '@/api/order-auto'

                        export function useOrderAuto() {
                            const loading = ref(false)
                            const error = ref<string | null>(null)
                                const state = reactive({
                                list: [] as any[],
                                page: 1,
                                pageSize: 10,
                                total: 0,
                                finished: false,
                                    list: [] as IOrder[],
     keyword: undefined as string
  })

  // [FACTORY-HOOK-CUSTOM-START]
   // 在此处编写您的自定义 Hook 逻辑 (保留区)
 // const myCustomFunc=()=> {}
                                    // [FACTORY-HOOK-CUSTOM-END]

                                    const fetchData = async () => {
                                    if (loading.value) return
                                    loading.value = true
                                    error.value = null
                                    try {
                                    
                                        const res = await getOrderList({ page: state.page, pageSize: state.pageSize
                                            }) as any
                                            const newList: any[] = res?.data?.list ?? res?.data ?? res ?? []
                                            const total: number = res?.data?.total ?? newList.length
                                            state.list = state.page === 1 ? newList : [...state.list, ...newList]
                                            state.total = total
                                            state.finished = state.list.length >= total || newList.length <
                                                state.pageSize 
                                                    } catch (e: any) {
                                                    error.value = e?.message ?? '请求失败，请稍后重试'
                                                    showToast({ message: error.value, type: 'fail' })
                                                    } finally {
                                                    loading.value = false
                                                    }
                                                    }

                                                    const refresh = async () => {
                                                    state.page = 1
                                                    state.finished = false
                                                    state.list = []
                                                    await fetchData()
                                                    }

                                                    const loadMore = async () => {
                                                    if (state.finished || loading.value) return
                                                    state.page++
                                                    await fetchData()
                                                    }

                                                    onMounted(() => {
                                                    
                                                            fetchData()
                                                            
                                                                })

                                                                return { loading, error, state, refresh, loadMore,
                                                                fetchData }
                                                                }