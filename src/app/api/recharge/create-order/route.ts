// src/app/api/recharge/create-order/route.ts
import { NextResponse } from 'next/server';
import { rechargeAction } from '@/src/lib/actions'; // 导入 Server Action

function response (
  {
    status,
    title,
    message,
  }: {
    status: number
    title: string
    message: string
  }
) {
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8f8f8; }
            .container { text-align: center; padding: 20px; border: 1px solid #ffcc00; background-color: #fff8dc; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            h1 { color: #cc0000; }
            p { color: #333; margin-bottom: 20px; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="#" onclick="window.close();">关闭此页面</a>
        </div>
    </body>
    </html>
  `, {
    status,
    headers: { 'Content-Type': 'text/html' },
  })
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const amountStr = formData.get('amount');
    const channelCode = formData.get('channelCode')?.toString();
    const amount = amountStr ? parseInt(amountStr.toString(), 10) : NaN;

    const PAYMENT_CHANNELS = process.env.NEXT_PUBLIC_PAYMENT_CHANNELS
    const channels = (PAYMENT_CHANNELS || '').split(',')

    if (!channelCode || !channels.includes(channelCode)) {
      return response({
        status: 400,
        title: '充值失败',
        message: `通道${channelCode}无效, 请选择正确的通道`,
      })
    }

    const range = channelCode.split('-')

    if (
      isNaN(amount)
      ||
      amount < Number(range[1])
      ||
      amount > Number(range[2])
    ) {
      return response({
        status: 400,
        title: '充值失败',
        message: `金额无效，请输入 ${range[1]} 到 ${range[2]} 之间的整数金额。`,
      })
    }

    const result = await rechargeAction(amount, channelCode);

    if (result.success && result.url) {
      return NextResponse.redirect(result.url, { status: 302 });
    } else {
      return response({
        status: 500,
        title: '充值失败',
        message: result.error || '提交充值失败，请返回重试。',
      })
    }
  } catch (error: any) {
    console.error('Recharge API route error:', error);

    return response({
      status: 500,
      title: '系统错误',
      message: '处理充值请求时发生未知错误，请稍后再试。',
    })
  }
}