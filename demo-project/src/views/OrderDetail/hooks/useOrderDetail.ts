/**
 * useOrderDetail — 订单详情 页面 Composable
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ✏️  请在 // BUSINESS LOGIC 区块内填写核心业务逻辑
 */
import { ref, reactive, onMounted } from 'vue'
import { showToast } from 'vant'
import { getOrderDetail } from '@/api/order-detail'
// import { updateOrderStatus, cancelOrder } from '@/api/order-detail' // 取消注释后多个接口可用

export function useOrderDetail() {
  // ─── 状态定义 ────────────────────────────────────────
  const loading = ref(false)
  const error = ref<string | null>(null)
  const orderDetailData = reactive<Record<string, any>>({
    // TODO: 根据 API 响应结构补充类型
    list: [],
    total: 0,
  })

  // ─── 数据获取 ────────────────────────────────────────
  const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
      // BUSINESS LOGIC: 根据实际接口调整请求参数
      const res = await getOrderDetail({}) as any
      Object.assign(orderDetailData, res?.data ?? res)
    } catch (e: any) {
      error.value = e?.message || '数据加载失败'
      showToast({ type: 'fail', message: error.value ?? '未知错误' })
      console.error('[OrderDetail] fetchData error:', e)
    } finally {
      loading.value = false
    }
  }

  // 页面挂载时自动拉取数据
  onMounted(fetchData)

  // ─── 业务方法 ────────────────────────────────────────
  const refresh = () => fetchData()

  // BUSINESS LOGIC START ────────────────────────────────
  // TODO: 在此添加更多业务方法
  // 例如：const handleSubmit = async (form) => { ... }
  // BUSINESS LOGIC END ──────────────────────────────────

  return {
    orderDetailData,
    loading,
    error,
    refresh,
    // BUSINESS LOGIC: 在此暴露更多业务方法
  }
}
