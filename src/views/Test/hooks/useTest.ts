/**
* useTest — Composable [Vant H5]
    * [FACTORY-GENERATED] 支持 Features & State & 增量保护
    */
    import { ref, reactive, onMounted } from 'vue'
    import { showToast } from 'vant'
    
        

                        export function useTest() {
                            const loading = ref(false)
                            const error = ref<string | null>(null)
                                const state = reactive({
                                    list: [] as any[]
                                    })

                                    // [FACTORY-HOOK-CUSTOM-START]
                                    // 在此处编写您的自定义 Hook 逻辑 (保留区)\n  const myCustomFunc = () => {}
                                        // [FACTORY-HOOK-CUSTOM-END]

                                        const refresh = async () => {
                                        state.page = 1
                                        state.finished = false
                                        state.list = []
                                        await fetchData()
                                        }

                                        const loadMore = async () => {
                                        if (state.finished) return
                                        state.page++
                                        await fetchData()
                                        }

                                        const fetchData = async () => {
                                        loading.value = true
                                        try {
                                        
                                                    // NO-API
                                                    state.finished = true
                                                    
                                                        } catch (e: any) {
                                                        error.value = e.message
                                                        showToast(e.message)
                                                        } finally {
                                                        loading.value = false
                                                        }
                                                        }

                                                        onMounted(() => {
                                                        if (!false) fetchData()
                                                            })

                                                            return { loading, error, state, refresh, loadMore }
                                                            }