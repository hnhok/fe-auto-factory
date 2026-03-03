/**
 * OrderManagement Mock 镜像
 * [FACTORY-GENERATED] 基于 Smart Mocking v2.8
 */
import { defineMock } from 'vite-plugin-mock'

export default defineMock([
  {
    url: '/api/order-management/list',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: Array(10).fill(null).map((_, i) => ({
          ...{
          "id": "@increment",
          "order_no": "@ctitle(5)",
          "customer_name": "@cname",
          "total_amount": "@float(1, 1000, 2, 2)",
          "status": "@ctitle(5)",
          "create_time": "@datetime"
}
        })),
        message: 'ok'
      }
    }
  }
])
