// src/app/api/recharge/check-order/route.ts
import { NextResponse } from 'next/server';
import { checkRechargeOrderAction } from '@/src/lib/actions'; // 导入 Server Action

export async function POST(request: Request) {
  try {
    const { merchantSerial } = await request.json();

    if (!merchantSerial) {
      return NextResponse.json({ success: false, error: '订单号缺失' }, { status: 400 });
    }

    const result = await checkRechargeOrderAction(merchantSerial);

    if (result.success) {
      // 返回我方订单的最终状态
      return NextResponse.json({ success: true, state: result.state, msg: '订单状态检查成功' });
    } else {
      return NextResponse.json({ success: false, error: result.error || '检查订单失败' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Check Order API route error:', error);
    return NextResponse.json({ success: false, error: error.message || '内部服务器错误' }, { status: 500 });
  }
}