// src/app/api/recharge/create-order/route.ts
import { NextResponse } from 'next/server';
import { rechargeAction } from '@/src/lib/actions'; // 导入 Server Action

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const amountStr = formData.get('amount');
    const amount = amountStr ? parseInt(amountStr.toString(), 10) : NaN;

    if (isNaN(amount) || amount < 100 || amount > 5000) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>充值失败</title>
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
                <h1>充值失败</h1>
                <p>金额无效，请输入 100 到 5000 之间的整数金额。</p>
                <a href="#" onclick="window.close();">关闭此页面</a>
            </div>
        </body>
        </html>
      `, {
        status: 400,
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const result = await rechargeAction(amount);

    if (result.success && result.url) {
      return NextResponse.redirect(result.url, { status: 302 });
    } else {
      const errorMessage = result.error || '提交充值失败，请返回重试。';
      return new NextResponse(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>充值失败</title>
            <style>
                body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8f8f8; }
                .container { text-align: center; padding: 20px; border: 1px solid #ff0000; background-color: #ffe0e0; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                h1 { color: #cc0000; }
                p { color: #333; margin-bottom: 20px; }
                a { color: #007bff; text-decoration: none; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>充值失败</h1>
                <p>${errorMessage}</p>
                <a href="#" onclick="window.close();">关闭此页面</a>
            </div>
        </body>
        </html>
      `, {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      });
    }
  } catch (error: any) {
    console.error('Recharge API route error:', error);
    return new NextResponse(`
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>系统错误</title>
          <style>
              body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #f8f8f8; }
              .container { text-align: center; padding: 20px; border: 1px solid #cc00cc; background-color: #ffe0ff; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
              h1 { color: #990099; }
              p { color: #333; margin-bottom: 20px; }
              a { color: #007bff; text-decoration: none; }
              a:hover { text-decoration: underline; }
          </style>
      </head>
      <body>
          <div class="container">
              <h1>系统错误</h1>
              <p>处理充值请求时发生未知错误，请稍后再试。</p>
              <a href="#" onclick="window.close();">关闭此页面</a>
          </div>
      </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}