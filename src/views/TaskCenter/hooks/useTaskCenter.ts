/**
 * useTaskCenter — 任务中心 页面 Composable
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ✏️  请在 // BUSINESS LOGIC 区块内填写核心业务逻辑
 */
import { ref, reactive, onMounted } from 'vue'
import { showToast } from 'vant'
import { getTaskList } from '@/api/task-center'
// import { updateTaskStatus } from '@/api/task-center' // 取消注释后可用

export function useTaskCenter() {
  // ─── 状态定义 ────────────────────────────────────────
  const loading = ref(false)
  const searchText = ref('')
  const error = ref<string | null>(null)

  // 原始列表数据
  const rawList = ref<any[]>([])

  // 过滤后的计算数据
  const taskCenterData = reactive<Record<string, any>>({
    list: [],
    total: 0,
  })

  // ─── 数据获取 ────────────────────────────────────────
  const fetchData = async () => {
    loading.value = true
    error.value = null
    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const mockTasks = [
        { id: 1, title: '编写项目文档', status: '进行中', priority: '高' },
        { id: 2, title: '代码重构建议', status: '待开始', priority: '中' },
        { id: 3, title: 'UI组件库调研', status: '已完成', priority: '低' },
      ]

      rawList.value = mockTasks
      updateFilteredList()
    } catch (e: any) {
      error.value = e?.message || '加载失败'
    } finally {
      loading.value = false
    }
  }

  // ─── 搜索过滤逻辑 ─────────────────────────────────────
  const updateFilteredList = () => {
    const filtered = rawList.value.filter(task =>
      task.title.toLowerCase().includes(searchText.value.toLowerCase())
    )
    taskCenterData.list = filtered
    taskCenterData.total = filtered.length
  }

  const handleSearch = () => {
    console.log('[Track] task-search-confirm:', searchText.value)
    updateFilteredList()
  }

  onMounted(fetchData)

  return {
    taskCenterData,
    searchText,
    loading,
    error,
    refresh: fetchData,
    handleSearch,
  }
}
