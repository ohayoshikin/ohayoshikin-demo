'use client';
import { useRouter } from 'next/navigation';
import OrderList from '../components/OrderList'
export default function RechargeListPage () {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };
  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <button onClick={handleBack} className="px-3 py-1 text-black">← 返回</button>
          <h1 className="text-2xl font-bold text-gray-800">充值记录</h1>
          <div></div>
        </div>

        <div className="mb-8 p-6 bg-green-50 border border-green-200 rounded-md">
          <h2 className="text-2xl font-semibold text-green-800 mb-4">充值记录</h2>
          <OrderList />
        </div>
      </div>
    </div>

  )
}