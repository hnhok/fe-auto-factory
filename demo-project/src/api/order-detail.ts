/**
 * OrderDetail API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 * ⚠️  若后端提供 Swagger，请使用 factory sync --swagger 重新生成规范类型
 */
import request from '@/utils/request'

/** 获取OrderDetail */
export const getOrderDetail = (params?: Record<string, any>) =>
  request.get(`/api/order-detail/order-detail`, { params })

/** 更新OrderStatus */
export const updateOrderStatus = (data: Record<string, any>) =>
  request.post(`/api/order-detail/order-status`, { data })

/** cancelOrder */
export const cancelOrder = (data: Record<string, any>) =>
  request.post(`/api/order-detail/cancel-order`, { data })
