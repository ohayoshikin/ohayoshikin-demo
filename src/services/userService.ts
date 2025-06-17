// src/services/userService.ts
import { mongooseProxy, queryPage } from '../lib/mongoose';
import { UserModel, UserDocument } from '../models/UserModel';
import { UserTokenModel, UserTokenDocument } from '../models/UserTokenModel';
import { OrderModel, OrderDocument } from '../models/OrderModel';

import { Types } from 'mongoose';
import { randomBytes } from 'crypto';
import { GatewayOrderState, OrderListItem, OurOrderState, OurOrderStateMap, UserSessionData } from '../types/user'

// 内部函数：将 Gateway 状态映射到我方状态
function mapGatewayStateToOurState(gatewayState: GatewayOrderState): OurOrderState {
  switch (gatewayState) {
    case GatewayOrderState.SUCCESS:
      return OurOrderState.SUCCESS; // 对方完成 (2) -> 我方成功 (1)
    case GatewayOrderState.REJECTED:
      return OurOrderState.FAILED;     // 对方驳回 (3) -> 我方失败 (2)
    case GatewayOrderState.CREATED:
    case GatewayOrderState.PENDING:
    case GatewayOrderState.TIMEOUT:
    case GatewayOrderState.AMOUNT_MISMATCH:
    default:
      return OurOrderState.PENDING;   // 其他所有状态 -> 我方等待 (0)
  }
}

export class UserService {
  private async hashPassword(password: string): Promise<string> {
    return password; // 简化处理
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return password === hashedPassword; // 简化处理
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * 用户注册
   */
  async register(username: string, passwordPlain: string): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
    try {
      const existingUser = await UserModel.findOne({ username });
      if (existingUser) {
        return { success: false, error: '用户名已存在' };
      }

      const hashedPassword = await this.hashPassword(passwordPlain);
      const newUser = await UserModel.create({ username, password: hashedPassword, balance: 0 });
      return { success: true, user: newUser };
    } catch (error: any) {
      console.error('Registration error:', error);
      return { success: false, error: error.message || '注册失败' };
    }
  }

  /**
   * 用户登录
   */
  async login(username: string, passwordPlain: string): Promise<{ success: boolean; token?: string; error?: string }> {
    const user = await UserModel.findOne({ username });

    if (!user) {
      return { success: false, error: '用户不存在' };
    }

    const isPasswordValid = await this.verifyPassword(passwordPlain, user.password);
    if (!isPasswordValid) {
      return { success: false, error: '密码错误' };
    }

    const tokenValue = this.generateToken();
    const expireAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7天过期

    const userToken = await UserTokenModel.findOneAndUpdate(
      { userId: user._id },
      { token: tokenValue, expireAt, created: new Date() },
      { upsert: true, new: true }
    );

    return { success: true, token: userToken.token };
  }

  /**
   * 根据 token 获取用户信息
   */
  async getUserByToken(token: string): Promise<UserSessionData | null> {
    const userToken = await UserTokenModel.findOne({ token })
        .exec() as UserTokenDocument | null;

    if (!userToken || userToken.expireAt < new Date()) {
      return null;
    }

    const user = await UserModel.findById(userToken.userId)

    return {
      id: user._id.toString(),
      username: user.username,
      balance: user.balance,
    };
  }

  /**
   * 获取用户余额
   */
  async getUserBalance(userId: string): Promise<number | null> {
    const user: any = await UserModel.findById(userId).select('balance').lean();
    return user ? user.balance : null;
  }

  /**
   * 增加用户余额 (直接增加，不包含幂等性检查，幂等性由调用方控制)
   */
  async increaseUserBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const user = await UserModel.findByIdAndUpdate(
        userId,
        { $inc: { balance: amount } },
        { new: true }
      );
      return !!user;
    } catch (error) {
      console.error(`Error increasing balance for user ${userId}:`, error);
      return false;
    }
  }

  /**
   * 创建充值订单 (我方系统)
   */
  async createOrder(
    userId: string,
    amount: number,
    channelCode: string,
    notifyUrl: string
  ): Promise<{ success: boolean; order?: OrderDocument; error?: string }> {
    try {
      const newOrder = await OrderModel.create({
        userId: new Types.ObjectId(userId),
        amount,
        channelCode,
        notifyUrl,
        time: Date.now(),
        state: OurOrderState.PENDING, // 初始我方状态为等待 (0)
        isBalanceAdded: false, // 初始设置为未加余额
      });
      return { success: true, order: newOrder };
    } catch (error: any) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message || '创建订单失败' };
    }
  }

  /**
   * 根据订单ID (_id) 获取订单 (用于回调和检查)
   */
  async getOrderById(orderId: string): Promise<OrderDocument | null> {
    try {
      // lean() 返回纯 JS 对象，如果需要修改并保存，需要移除 .lean()
      return OrderModel.findById(orderId);
    } catch (error) {
      console.error(`Error getting order by ID ${orderId}:`, error);
      return null;
    }
  }

  /**
   * 更新我方订单状态并处理余额增加
   * @param merchantSerial 我方订单ID (_id)
   * @param gatewayState 第三方网关返回的状态
   * @param notifyInfo 附加信息
   * @param gatewayAmount 第三方返回的金额 (用于幂等性检查和金额匹配)
   * @returns boolean 表示操作是否成功
   */
  async updateOurOrderStatusAndBalance(
    merchantSerial: string,
    gatewayState: GatewayOrderState,
    notifyInfo: string = '',
    gatewayAmount?: number
  ): Promise<boolean> {
    try {
      const order = await OrderModel.findById(merchantSerial);
      if (!order) {
        console.warn(`Order with merchantSerial ${merchantSerial} not found.`);
        return false;
      }

      const ourNewState = mapGatewayStateToOurState(gatewayState);

      // 如果我方订单已经是成功 (1) 或失败 (2)，则不再处理状态和余额
      if (order.state === OurOrderState.SUCCESS || order.state === OurOrderState.FAILED) {
        console.log(`Order ${merchantSerial} is already in final state ${OurOrderStateMap[order.state as OurOrderState]}, skipping update and balance addition.`);
        return true; // 视为成功处理，避免重复操作
      }

      // 如果我方新状态是“成功” (1)
      if (ourNewState === OurOrderState.SUCCESS) {
        // 1. 验证金额是否匹配
        if (gatewayAmount !== undefined && order.amount !== gatewayAmount) {
          console.error(`Order ${merchantSerial} amount mismatch! Expected ${order.amount}, got ${gatewayAmount}. Setting to FAILED.`);
          // 金额不匹配，将我方订单状态设为失败
          order.state = OurOrderState.FAILED;
          order.notifyInfo = `金额不匹配: 期望 ${order.amount}, 实际 ${gatewayAmount}. ${notifyInfo}`;
        } else if (!order.isBalanceAdded) { // 2. 检查是否已加余额 (幂等性)
          const increaseSuccess = await this.increaseUserBalance(order.userId.toString(), order.amount);
          if (increaseSuccess) {
            order.isBalanceAdded = true; // 标记已加余额
            order.state = OurOrderState.SUCCESS; // 设置为成功状态
            order.notifyInfo = `余额已增加. ${notifyInfo}`;
          } else {
            console.error(`Failed to increase balance for user ${order.userId} for order ${merchantSerial}. Setting to FAILED.`);
            order.state = OurOrderState.FAILED; // 加余额失败，设为失败状态
            order.notifyInfo = `增加余额失败. ${notifyInfo}`;
          }
        } else {
          console.log(`Order ${merchantSerial} already had balance added. Setting state to SUCCESS.`);
          order.state = OurOrderState.SUCCESS; // 余额已加，直接设为成功
          order.notifyInfo = `余额已添加，状态更新为成功. ${notifyInfo}`;
        }
      } else {
        // 如果我方新状态是“等待”或“失败”
        order.state = ourNewState;
        order.notifyInfo = notifyInfo;
      }

      await order.save(); // 保存更新后的订单
      return true;

    } catch (error) {
      console.error(`Error updating order status for ${merchantSerial}:`, error);
      return false;
    }
  }


  /**
   * 获取用户的充值订单列表
   */
  async getUserOrders(
    userId: string,
    page: PageParams
  ): Promise<PageResult<OrderListItem>> {
    const filter = { userId: new Types.ObjectId(userId) };

    const result = await queryPage<OrderDocument>({
      model: OrderModel,
      page: page,
      filter: filter,
      sort: { time: -1 }, // 按时间倒序
    });

    const formattedData: OrderListItem[] = result.data ? result.data.map(order => ({
      _id: order._id!.toHexString(),
      amount: order.amount,
      time: new Date(order.time).toLocaleString('zh-CN', {
        month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
      }),
      state: OurOrderStateMap[order.state as OurOrderState] || '未知状态',
      // 只有处于“等待”状态的订单才可检查
      checkable: order.state === OurOrderState.PENDING,
    })) : [];

    return {
      ...result,
      data: formattedData,
    };
  }

  /**
   * 登出：删除 token
   */
  async logout(token: string): Promise<void> {
    await UserTokenModel.deleteOne({ token });
  }

  /**
   * 仅用于演示：为特定用户创建一些测试订单
   */
  async seedUserOrders(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    // 清理该用户之前的测试订单
    await OrderModel.deleteMany({ userId: userObjectId });

    await OrderModel.create([
      { userId: userObjectId, amount: 100, time: Date.now() - 5 * 60 * 1000, state: OurOrderState.SUCCESS, channelCode: 'WX', isBalanceAdded: true },
      { userId: userObjectId, amount: 250, time: Date.now() - 10 * 60 * 1000, state: OurOrderState.PENDING, channelCode: 'ZFB' },
      { userId: userObjectId, amount: 50, time: Date.now() - 15 * 60 * 1000, state: OurOrderState.SUCCESS, channelCode: 'WX', isBalanceAdded: true },
      { userId: userObjectId, amount: 300, time: Date.now() - 20 * 60 * 1000, state: OurOrderState.FAILED, channelCode: 'ZFB' },
      { userId: userObjectId, amount: 120, time: Date.now() - 25 * 60 * 1000, state: OurOrderState.SUCCESS, channelCode: 'WX', isBalanceAdded: true },
      { userId: userObjectId, amount: 80, time: Date.now() - 30 * 60 * 1000, state: OurOrderState.PENDING, channelCode: 'ZFB' },
      { userId: userObjectId, amount: 150, time: Date.now() - 35 * 60 * 1000, state: OurOrderState.SUCCESS, channelCode: 'WX', isBalanceAdded: true },
      { userId: userObjectId, amount: 400, time: Date.now() - 40 * 60 * 1000, state: OurOrderState.SUCCESS, channelCode: 'ZFB', isBalanceAdded: true },
      { userId: userObjectId, amount: 70, time: Date.now() - 45 * 60 * 1000, state: OurOrderState.FAILED, channelCode: 'WX' },
      { userId: userObjectId, amount: 200, time: Date.now() - 50 * 60 * 1000, state: OurOrderState.PENDING, channelCode: 'ZFB' },
      { userId: userObjectId, amount: 180, time: Date.now() - 55 * 60 * 1000, state: OurOrderState.SUCCESS, channelCode: 'WX', isBalanceAdded: true },
    ]);
    console.log(`为用户 ${userId} 创建了测试订单`);
  }
}

export default mongooseProxy(new UserService());