import { NextResponse } from 'next/server'
import { checkWithdrawalOrderAction } from '@/src/lib/withdrawalActions'

export async function POST(request: Request) {
  const { merchantSerial } = await request.json();
  if (!merchantSerial) {
    return NextResponse.json({ success: false, error: '订单号缺失' }, { status: 400 });
  }
  const result = await checkWithdrawalOrderAction(merchantSerial);
  if (result.success) {
    return NextResponse.json({ success: true, state: result.state });
  } else {
    return NextResponse.json({ success: false, error: result.error || '检查失败' });
  }
}