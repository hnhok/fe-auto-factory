/**
 * UserProfile API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ⚠️  若后端提供 Swagger，请使用 factory sync --swagger 重新生成规范类型
 */
import request from '@/utils/request'

/** 获取UserProfile */
export const getUserProfile = (params?: Record<string, any>) =>
  request.get(`/api/user-profile/user-profile`, { params })

/** 更新UserInfo */
export const updateUserInfo = (data: Record<string, any>) =>
  request.post(`/api/user-profile/user-info`, { data })
