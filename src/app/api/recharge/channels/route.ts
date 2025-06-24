// src/app/api/recharge/channels/route.ts
import { generateSign } from '@/src/lib/utils'
import { NextResponse } from 'next/server'

export async function POST() {
  const PAYMENT_API = process.env.PAYMENT_API
  const PAYMENT_SIGN_KEY = process.env.PAYMENT_SIGN_KEY
  const PAYMENT_USERNAME = process.env.PAYMENT_USERNAME

  if (!PAYMENT_API || !PAYMENT_SIGN_KEY || !PAYMENT_USERNAME) {
    return NextResponse.json({ code: 500, msg: '支付配置缺失' }, { status: 500 })
  }

  const payload = {
    username: PAYMENT_USERNAME,
    timestamp: Date.now(),
  }

  const sign = generateSign(payload, PAYMENT_SIGN_KEY)

  try {
    const res = await fetch(`${PAYMENT_API}/deposit/channels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, sign }),
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    console.error('获取支付通道失败:', e)
    return NextResponse.json({ code: 500, msg: '获取支付通道失败' }, { status: 500 })
  }
}