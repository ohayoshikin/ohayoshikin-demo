// src/app/dashboard/page.tsx

import { getCurrentUserAction } from '@/src/lib/actions'
import LogoutButton from '../components/LogoutButton'
import BalanceDisplay from '../components/BalanceDisplay'
import OrderList from '../components/OrderList'
import ClientOnly from '../components/ClientOnly'

export const dynamic = 'force-dynamic'; // 明确声明页面为动态渲染

export default async function DashboardPage() {
  const user = await getCurrentUserAction();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">访问受限</h1>
          <p className="text-gray-700">请<a href="/login" className="text-blue-500 hover:underline">登录</a>以查看此页面。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-3xl font-bold text-gray-800">欢迎，{user.username}!</h1>
          <LogoutButton />
        </div>

        {/* 账户信息，现在由 ClientOnly 包裹 */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-md">
          <h2 className="text-2xl font-semibold text-blue-800 mb-4">账户概览</h2>
          <ClientOnly> {/* <--- 使用 ClientOnly 包裹 BalanceDisplay */}
            <BalanceDisplay initialBalance={user.balance} />
          </ClientOnly>
        </div>

        {/* 充值订单列表 */}
        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-md">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">充值订单</h2>
          <OrderList />
        </div>
      </div>
    </div>
  );
}