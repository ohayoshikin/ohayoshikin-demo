import { NextResponse } from 'next/server'
import { generateSign } from '@/src/lib/utils'
import withdrawalService from '@/src/services/withdrawalService'

export async function POST(request: Request) {
  const PAYMENT_SIGN_KEY = process.env.PAYMENT_SIGN_KEY;
  if (!PAYMENT_SIGN_KEY) {
    return NextResponse.json({ code: 500, msg: '服务器配置错误' }, { status: 500 });
  }
  const callbackData = await request.json();
  const { merchantSerial, amount, state, sign } = callbackData;

  if (!merchantSerial || typeof state === 'undefined' || typeof amount === 'undefined') {
    return NextResponse.json({ code: 400, msg: '参数缺失' }, { status: 400 });
  }

  const paramsToSign: Record<string, any> = { ...callbackData };
  delete paramsToSign.sign;
  const calculatedSign = generateSign(paramsToSign, PAYMENT_SIGN_KEY);

  if (calculatedSign !== sign) {
    return NextResponse.json({ code: 403, msg: '签名验证失败' }, { status: 403 });
  }

  await withdrawalService.updateWithdrawalOrderFromCallback(callbackData);
  return new NextResponse('success');
}