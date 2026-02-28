/**
 * AdminDashboard API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ⚠️  若后端提供 Swagger，请使用 factory sync --swagger 重新生成规范类型
 */
import request from '@/utils/request'

/** 获取SystemStats */
export const getSystemStats = (params?: Record<string, any>) =>
  request.get(`/api/admin-dashboard/system-stats`, { params })
