import { NextResponse } from 'next/server'
import { withdrawalAction } from '@/src/lib/withdrawalActions'

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, type, targetAccount, targetOwner } = body;
    const result = await withdrawalAction(amount, type, targetAccount, targetOwner);
    if (result.success) {
      return NextResponse.json({ code: 200, msg: '取款申请成功' });
    } else {
      return NextResponse.json({ code: 400, msg: result.error || '失败' });
    }
  } catch (error: any) {
    return NextResponse.json({ code: 500, msg: error.message || '未知错误' });
  }
}