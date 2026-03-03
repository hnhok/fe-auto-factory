/**
 * AdminDashboard API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import request from '@/utils/request'

export function getSystemStats(params?: any): Promise<any> {
  return request({
    url: '/api/admin-dashboard/get-system-stats',
    method: 'get',
    params
  })
}
