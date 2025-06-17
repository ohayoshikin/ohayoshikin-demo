// src/types/user.ts

// 我方内部订单状态枚举和映射
export enum OurOrderState {
  PENDING = 0, // 等待中 (对应对方的0,1,4,5)
  SUCCESS = 1, // 成功 (对应对方的2)
  FAILED = 2,  // 失败 (对应对方的3)
}

export const OurOrderStateMap: Record<OurOrderState, string> = {
  [OurOrderState.PENDING]: '等待中',
  [OurOrderState.SUCCESS]: '成功',
  [OurOrderState.FAILED]: '失败',
};

// 对方Gateway API定义的订单状态 (不变)
export enum GatewayOrderState {
  CREATED = 0,     // 新创建
  PENDING = 1,     // 处理中
  SUCCESS = 2,     // 完成
  REJECTED = 3,    // 驳回
  TIMEOUT = 4,     // 超时
  AMOUNT_MISMATCH = 5 // 已收款,但金额不匹配
}


// 定义登录后返回的用户信息接口 (不变)
export interface UserSessionData {
  id: string;
  username: string;
  balance?: number;
}

// 定义订单列表项的类型（用于前端展示）(不变)
export interface OrderListItem {
  _id: string;
  amount: number;
  time: string;
  state: string; // 使用 OurOrderStateMap 的值
  checkable: boolean; // 是否可检查
}

// 充值接口响应数据接口 (提交充值订单) (不变)
export interface CreateOrderResponseData {
  platformId: string;
  merchantSerial: string;
  amount: number;
  state: GatewayOrderState;
  url?: string;
}

// 查询订单接口响应数据接口 (不变)
export interface GetOrderResponseData {
  platformId: string;
  merchantSerial: string;
  amount: number;
  state: GatewayOrderState;
}

// 回调接口参数类型 (不变)
export interface RechargeCallbackData {
  platformId: string;
  username: string;
  merchantSerial: string;
  timestamp: number;
  amount: number;
  state: GatewayOrderState;
  sign: string;
}