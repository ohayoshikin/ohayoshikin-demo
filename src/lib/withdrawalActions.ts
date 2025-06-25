'use server';

import { cookies, headers } from 'next/headers';
import withdrawalService from '../services/withdrawalService'
import userService from '../services/userService'
import { WithdrawalOrderListItem } from '../types/withdrawal'

const SESSION_COOKIE_NAME = 'session_token';

// 获取用户取款订单列表（分页）
export async function getUserWithdrawalOrdersAction(page: PageParams): Promise<PageResult<WithdrawalOrderListItem>> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { success: false, data: [], total: 0, current: page.current, pageSize: page.pageSize };
  const user = await userService.getUserByToken(token);
  if (!user) return { success: false, data: [], total: 0, current: page.current, pageSize: page.pageSize };
  return withdrawalService.getUserWithdrawalOrders(user.id, page);
}

// 提交取款申请
export async function withdrawalAction(
  amount: number,
  type: string,
  targetAccount: string,
  targetOwner: string
): Promise<{ success: boolean; error?: string }> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { success: false, error: '未登录' };
  const user = await userService.getUserByToken(token);
  if (!user) return { success: false, error: '未登录' };

  const headersList = headers();
  const host = (await headersList).get('host') || undefined;
  const protocol = (await headersList).get('x-forwarded-proto') || 'http';

  try {
    await withdrawalService.createWithdrawalOrder(user.id, amount, type, targetAccount, targetOwner, { headers: { host, 'x-forwarded-proto': protocol } });
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || '申请失败' };
  }
}

// 检查单个取款订单
export async function checkWithdrawalOrderAction(merchantSerial: string): Promise<{ success: boolean; state?: number; error?: string }> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return { success: false, error: '未登录' };
  const user = await userService.getUserByToken(token);
  if (!user) return { success: false, error: '未登录' };

  try {
    const result = await withdrawalService.checkAndUpdateWithdrawalOrder(merchantSerial);
    return { success: true, state: result.state };
  } catch (e: any) {
    return { success: false, error: e.message || '检查失败' };
  }
}