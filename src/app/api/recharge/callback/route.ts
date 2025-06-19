// src/app/api/recharge/callback/route.ts
import { NextResponse } from 'next/server';
import userService from '@/src/services/userService';
import { generateSign } from '@/src/lib/utils'; // 导入签名工具
import { GatewayOrderState, RechargeCallbackData } from '@/src/types/user'

export async function POST(request: Request) {
  try {
    const PAYMENT_SIGN_KEY = process.env.PAYMENT_SIGN_KEY;
    if (!PAYMENT_SIGN_KEY) {
      console.error('PAYMENT_SIGN_KEY is not defined in environment variables.');
      return NextResponse.json({ code: 500, msg: '服务器配置错误' }, { status: 500 });
    }

    const callbackData: RechargeCallbackData = await request.json();
    console.log('Received recharge callback:', callbackData);

    const {
      merchantSerial,
      amount,
      state, // 对方提供的状态
      sign, // 对方提供的签名
    } = callbackData;

    if (!merchantSerial || typeof state === 'undefined' || typeof amount === 'undefined') {
      console.warn('Callback missing required parameters:', callbackData);
      return NextResponse.json({ code: 400, msg: '参数缺失' }, { status: 400 });
    }

    // 验证签名
    const paramsToSign: Record<string, any> = { ...callbackData };
    delete paramsToSign.sign; // 签名时不包含 sign 字段

    const calculatedSign = generateSign(paramsToSign, PAYMENT_SIGN_KEY);

    if (calculatedSign !== sign) {
      console.warn(`Signature mismatch for merchantSerial: ${merchantSerial}. Received: ${sign}, Calculated: ${calculatedSign}`);
      return NextResponse.json({ code: 403, msg: '签名验证失败' }, { status: 403 });
    }

    // 调用统一的更新方法，它会处理状态映射和余额增加
    const updateSuccess = await userService.updateOurOrderStatusAndBalance(
      merchantSerial,
      state as GatewayOrderState, // 确保类型正确
      `来自网关回调`,
      amount // 传递网关返回的金额用于匹配
    );

    if (!updateSuccess) {
      console.error(`Failed to process order update for ${merchantSerial} via callback.`);
      return NextResponse.json({ code: 500, msg: '处理本地订单更新失败' }, { status: 500 });
    }

    // return NextResponse.json({ code: 200, msg: 'OK' });
    return new NextResponse('success')
  } catch (error: any) {
    console.error('Recharge callback API error:', error);
    return NextResponse.json({ code: 500, msg: error.message || '内部服务器错误' }, { status: 500 });
  }
}