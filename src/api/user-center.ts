/**
 * UserCenter API Service
 * [FACTORY-GENERATED] 基于 Schema 自动生成
 */
import request from '@/utils/request'

export function getUserProfile(params?: any): Promise<any> {
  return request({
    url: '/api/user-center/get-user-profile',
    method: 'get',
    params
  })
}
