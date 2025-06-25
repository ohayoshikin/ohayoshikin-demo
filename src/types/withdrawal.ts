export enum WithdrawalOrderState {
  PENDING = 0,
  SUCCESS = 1,
  FAILED = 2,
}

export const WithdrawalOrderStateMap: Record<WithdrawalOrderState, string> = {
  [WithdrawalOrderState.PENDING]: '等待中',
  [WithdrawalOrderState.SUCCESS]: '成功',
  [WithdrawalOrderState.FAILED]: '失败',
};

export interface WithdrawalOrderListItem {
  _id: string;
  amount: number;
  type: string;
  targetAccount: string;
  targetOwner?: string;
  time: string;
  state: string;
  checkable: boolean;
}

// 充值接口响应数据接口 (提交充值订单) (不变)
export interface CreateWithdrawalOrderResponseData {
  platformId: string;
  merchantSerial: string;
  amount: number;
  state: WithdrawalOrderState;
  url?: string;
}

// 查询订单接口响应数据接口 (不变)
export interface GetWithdrawalOrderResponseData {
  platformId: string;
  merchantSerial: string;
  amount: number;
  state: WithdrawalOrderState;
}

// 回调接口参数类型 (不变)
export interface WithdrawalCallbackData {
  platformId: string;
  username: string;
  merchantSerial: string;
  timestamp: number;
  amount: number;
  state: WithdrawalOrderState;
  sign: string;
}
