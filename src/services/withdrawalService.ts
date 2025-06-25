import { Types } from 'mongoose';
import { WithdrawalOrderModel, WithdrawalOrderState, WithdrawalOrderStateMap } from '../models/WithdrawalOrderModel';
import { UserModel } from '../models/UserModel';
import { callGatewayApi } from '../lib/utils';
import { WithdrawalOrderListItem} from '../types/withdrawal';
import { mongooseProxy } from '../lib/mongoose'

export interface GatewayCreateWithdrawalParams {
  amount: number;
  type: string;
  merchantSerial: string;
  targetOwner?: string;
  targetAccount: string;
  notifyUrl: string;
}
export interface GatewayCreateWithdrawalResult {
  code: number;
  msg: string;
  data?: Record<string, any>;
}
export interface GatewayGetWithdrawalParams {
  merchantSerial: string;
}
export interface GatewayGetWithdrawalResult {
  code: number;
  msg: string;
  data?: { state: number };
}

export class WithdrawalService {

  async createWithdrawalOrder(
    userId: string,
    amount: number,
    type: string,
    targetAccount: string,
    targetOwner: string | undefined,
    req: { headers: { host?: string; 'x-forwarded-proto'?: string } }
  ) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('用户不存在');
    if (user.balance < amount) throw new Error('余额不足');

    user.balance -= amount;
    await user.save();

    const notifyUrl =
      `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/withdrawal/callback`;

    const order = await WithdrawalOrderModel.create({
      userId,
      amount,
      type,
      targetOwner,
      targetAccount,
      notifyUrl,
      time: Date.now(),
      state: WithdrawalOrderState.PENDING,
    });

    const merchantSerial = order._id.toString();
    const params: GatewayCreateWithdrawalParams = {
      amount,
      type,
      merchantSerial,
      targetOwner,
      targetAccount,
      notifyUrl,
    };

    const resp: GatewayCreateWithdrawalResult = await callGatewayApi('/withdrawal/create', params);
    if (!resp || resp.code !== 200) {
      order.state = 2
      user.balance += amount
      throw new Error(resp?.msg || '远程创建订单失败');
    }
    return order;
  }

  async getUserWithdrawalOrders(userId: string, page: PageParams): Promise<PageResult<WithdrawalOrderListItem>> {
    const cond = { userId: new Types.ObjectId(userId) };
    const total = await WithdrawalOrderModel.countDocuments(cond);
    const orders = await WithdrawalOrderModel.find(cond).sort({ time: -1 })
      .skip((page.current - 1) * page.pageSize)
      .limit(page.pageSize);

    return {
      success: true,
      data: orders.map(o => ({
        _id: o._id!.toString(),
        amount: o.amount,
        type: o.type,
        targetAccount: o.targetAccount,
        targetOwner: o.targetOwner,
        time: new Date(o.time).toLocaleString(),
        state: WithdrawalOrderStateMap[o.state as WithdrawalOrderState],
        checkable: o.state === WithdrawalOrderState.PENDING,
      })),
      total,
      current: page.current,
      pageSize: page.pageSize,
    };
  }

  async checkAndUpdateWithdrawalOrder(orderId: string) {
    const order = await WithdrawalOrderModel.findById(orderId);
    if (!order) throw new Error('订单不存在');
    if (order.state !== WithdrawalOrderState.PENDING) return order;

    const params: GatewayGetWithdrawalParams = { merchantSerial: order._id.toString() };
    const resp: GatewayGetWithdrawalResult = await callGatewayApi('/withdrawal/get', params);
    if (resp?.code !== 200) throw new Error(resp?.msg || '远程查询失败');
    const remoteState = resp.data?.state;

    if (remoteState === 1) {
      order.state = WithdrawalOrderState.SUCCESS;
      await order.save();
    } else if (remoteState === 2 || remoteState === 3) {
      order.state = WithdrawalOrderState.FAILED;
      const user = await UserModel.findById(order.userId);
      if (user) {
        user.balance += order.amount;
        await user.save();
      }
      await order.save();
    }
    return order;
  }

  async updateWithdrawalOrderFromCallback({
    merchantSerial, state, ...rest
  }: { merchantSerial: string, state: number, [k: string]: any }) {
    const order = await WithdrawalOrderModel.findById(merchantSerial);
    if (!order) throw new Error('订单不存在');
    if (order.state !== WithdrawalOrderState.PENDING) return;
    if (state === 1) {
      order.state = WithdrawalOrderState.SUCCESS;
    } else if (state === 2 || state === 3) {
      order.state = WithdrawalOrderState.FAILED;
      const user = await UserModel.findById(order.userId);
      if (user) {
        user.balance += order.amount;
        await user.save();
      }
    }
    order.notifyInfo = JSON.stringify(rest);
    await order.save();
  }
}

export default mongooseProxy(new WithdrawalService());