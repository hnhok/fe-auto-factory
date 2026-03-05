/**
 * OrderAuto Mock 镜像
 * [FACTORY-GENERATED] 基于 Smart Mocking v2.8
 */
import { defineMock } from 'vite-plugin-mock'

export default defineMock([
  {
    url: '/api/order-auto/list',
    method: 'get',
    response: () => {
      return {
        code: 0,
        data: Array(10).fill(null).map((_, i) => ({
          ...{
          "id": "@increment",
          "petId": "@increment",
          "quantity": "@integer(1, 100)",
          "shipDate": "@datetime",
          "status": "@ctitle(5)",
          "complete": "@boolean"
}
        })),
        message: 'ok'
      }
    }
  }
])
