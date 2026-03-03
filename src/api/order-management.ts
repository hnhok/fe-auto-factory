/**
 * OrderManagement API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import request from '@/utils/request'
import { IOrder } from './types/order-management'

export function getOrderList(params?: any): Promise<IOrder[]> {
  return request({
    url: '/api/order-management/get-order-list',
    method: 'get',
    params
  })
}

export function updateOrderStatus(params?: any): Promise<any> {
  return request({
    url: '/api/order-management/update-order-status',
    method: 'get',
    params
  })
}
