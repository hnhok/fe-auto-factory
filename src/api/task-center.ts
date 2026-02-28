/**
 * TaskCenter API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ⚠️  若后端提供 Swagger，请使用 factory sync --swagger 重新生成规范类型
 */
import request from '@/utils/request'

/** 获取TaskList */
export const getTaskList = (params?: Record<string, any>) =>
  request.get(`/api/task-center/task-list`, { params })

/** 更新TaskStatus */
export const updateTaskStatus = (data: Record<string, any>) =>
  request.post(`/api/task-center/task-status`, { data })
