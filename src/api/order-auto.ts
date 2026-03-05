/**
 * OrderAuto API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import request from '@/utils/request'
import { IOrder } from './types/order-auto'

export function getOrderList(params?: any): Promise<IOrder[]> {
  return request({
    url: '/api/order-auto/get-order-list',
    method: 'get',
    params
  })
}

export function queryOrderDetail(params?: any): Promise<any> {
  return request({
    url: '/api/order-auto/query-order-detail',
    method: 'get',
    params
  })
}
