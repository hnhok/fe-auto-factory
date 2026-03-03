/**
 * [FACTORY-GENERATED] 基于 Swagger 自动生成的 TS 类型定义
 * 来源: dummy-swagger.json
 * ⚠️ 请勿手动修改
 */

export interface Order {
  id?: number;
  petId?: number;
  quantity?: number;
  shipDate?: string;
  /** Order Status */
  status?: string;
  complete?: boolean;
}

