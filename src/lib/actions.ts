// src/app/lib/actions.ts
'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import userService from '../services/userService'
import { CreateOrderResponseData, GatewayOrderState, GetOrderResponseData, OrderListItem, OurOrderState, UserSessionData } from '../types/user'
import { callGatewayApi } from './utils'

const SESSION_COOKIE_NAME = 'session_token';

// 登录 Server Action (不变)
export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const result = await userService.login(username, password);

  if (!result.success) {
    return { error: result.error || '登录失败' };
  }

  (await cookies()).set(SESSION_COOKIE_NAME, result.token!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7天
    path: '/',
    sameSite: 'lax',
  });

  redirect('/dashboard');
}

// 登出 Server Action (不变)
export async function logoutAction() {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await userService.logout(token);
  }
  (await cookies()).delete(SESSION_COOKIE_NAME);
  redirect('/login');
}

// 获取当前用户信息的 Server Action (供 Server Components 调用) (不变)
export async function getCurrentUserAction(): Promise<UserSessionData | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return userService.getUserByToken(token);
}

// 刷新余额 Server Action (不变)
export async function refreshBalanceAction(): Promise<{ balance?: number; error?: string }> {
  const userSession = await getCurrentUserAction();
  if (!userSession) {
    return { error: '用户未登录' };
  }
  const balance = await userService.getUserBalance(userSession.id);
  if (balance === null) {
    return { error: '获取余额失败' };
  }
  return { balance };
}

// 获取用户订单列表 Server Action (不变，因为 userService.getUserOrders 内部已更新)
export async function getUserOrdersAction(page: PageParams): Promise<PageResult<OrderListItem>> {
  const userSession = await getCurrentUserAction();
  if (!userSession) {
    return { success: false, data: [], total: 0, current: page.current, pageSize: page.pageSize };
  }
  return userService.getUserOrders(userSession.id, page);
}

// 充值 Server Action (供 src/app/api/recharge/create-order/route.ts 调用)
export async function rechargeAction(
  amount: number,
  channelCode: string,
): Promise<{ success: boolean; url?: string; merchantSerial?: string; error?: string }> {
  const userSession = await getCurrentUserAction();
  if (!userSession) {
    return { success: false, error: '用户未登录或会话已过期' };
  }

  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = headersList.get('x-forwarded-proto') || 'http'

  const notifyUrl = `${protocol}://${host}/api/recharge/callback`
  if (!notifyUrl) {
    return { success: false, error: '回调URL未配置' };
  }

  // 1. 在自己系统创建充值订单数据并保存，状态为等待 (OurOrderState.PENDING)
  const createOurOrderResult = await userService.createOrder(
    userSession.id,
    amount,
    channelCode,
    notifyUrl
  );

  if (!createOurOrderResult.success || !createOurOrderResult.order) {
    return { success: false, error: createOurOrderResult.error || '创建本地订单失败' };
  }

  const merchantSerial = createOurOrderResult.order._id.toHexString();

  try {
    // 2. 调用对方充值接口将充值数据提交到对方系统中
    const gatewayResponse = await callGatewayApi<CreateOrderResponseData>('/deposit/create', {
      amount,
      channelCode,
      merchantSerial: merchantSerial, // 传入我们自己的订单ID
      notifyUrl: notifyUrl,
    });

    // 3. 对调用结果进行处理
    if (gatewayResponse.code !== 200 || !gatewayResponse.data?.url) {
      // 3.1 如果接口报错或者接口返回的code不是200
      // 3.1.1 更新订单状态为我方失败 (OurOrderState.FAILED)
      await userService.updateOurOrderStatusAndBalance(
        merchantSerial,
        GatewayOrderState.REJECTED, // 假设这种情况下对方是驳回状态，或者可以定义一个专门的网关提交失败状态
        gatewayResponse.msg || '网关返回非200或无URL',
        amount // 传递金额用于日志或后续检查
      );
      return { success: false, error: gatewayResponse.msg || '提交充值订单到网关失败' };
    }

    // 3.2 如果接口返回正常并包含url字段，我方订单状态保持为等待 (OurOrderState.PENDING)
    // 实际状态更新将由回调或主动查询触发
    // 这里不需要显式更新为PENDING，因为创建时就是PENDING
    // await userService.updateOurOrderStatusAndBalance(
    //   merchantSerial,
    //   GatewayOrderState.CREATED, // 假设此时对方是CREATED状态
    //   '已提交到网关，等待用户操作',
    //   amount
    // );

    return { success: true, url: gatewayResponse.data.url, merchantSerial: merchantSerial };

  } catch (error: any) {
    // 处理网络错误或其他异常
    // 设置为我方失败状态
    await userService.updateOurOrderStatusAndBalance(
      merchantSerial,
      GatewayOrderState.REJECTED, // 视为驳回状态
      `网关请求异常: ${error.message}`,
      amount
    );
    return { success: false, error: error.message || '提交充值请求时发生网络错误' };
  }
}

// 查询订单状态 Server Action (供 OrderList 中的“检查”按钮调用)
export async function checkRechargeOrderAction(merchantSerial: string): Promise<{ success: boolean; state?: OurOrderState; error?: string }> {
  const userSession = await getCurrentUserAction();
  if (!userSession) {
    return { success: false, error: '用户未登录或会话已过期' };
  }

  try {
    const gatewayResponse = await callGatewayApi<GetOrderResponseData>('/deposit/get', {
      merchantSerial: merchantSerial,
    });

    if (gatewayResponse.code !== 200 || !gatewayResponse.data) {
      return { success: false, error: gatewayResponse.msg || '查询订单失败' };
    }

    const remoteState = gatewayResponse.data.state;
    const remoteAmount = gatewayResponse.data.amount;

    // 调用统一的更新方法，会处理状态映射和余额增加
    const updateSuccess = await userService.updateOurOrderStatusAndBalance(
      merchantSerial,
      remoteState,
      `通过主动查询更新状态`,
      remoteAmount
    );

    if (!updateSuccess) {
      console.warn(`Failed to update local order ${merchantSerial} after remote check.`);
      return { success: false, error: '更新本地订单失败' };
    }

    // 查询更新后的我方订单状态并返回
    const updatedOrder = await userService.getOrderById(merchantSerial);
    return { success: true, state: updatedOrder?.state };

  } catch (error: any) {
    console.error(`Error checking order ${merchantSerial}:`, error);
    return { success: false, error: error.message || '查询订单状态时发生网络错误' };
  }
}

// 注册 Server Action (不变)
export async function registerAction(formData: FormData) {
  console.log('regsiter action...:', formData)

  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const result = await userService.register(username, password);

  if (!result.success || !result.user) {
    return { error: result.error || '注册失败' };
  }

  // 注册成功后为用户生成一些测试订单
  // await userService.seedUserOrders(result.user._id.toString());

  const loginResult = await userService.login(username, password);
  if (loginResult.success) {
    (await cookies()).set(SESSION_COOKIE_NAME, loginResult.token!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
      sameSite: 'lax',
    });
    redirect('/dashboard');
  } else {
    return { error: loginResult.error || '注册成功，但自动登录失败。' };
  }
}