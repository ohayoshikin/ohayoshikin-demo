'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface WithdrawalOrder {
  _id: string;
  amount: number;
  state: string;
  time: string;
  checkable: boolean;
}

export default function WithdrawalListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<WithdrawalOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingId, setCheckingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/api/withdrawal/list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current: 1, pageSize: 20 }),
    })
      .then(res => res.json())
      .then(res => {
        setOrders(res.data || []);
        setLoading(false);
      })
      .catch(() => {
        setError('加载失败');
        setLoading(false);
      });
  }, []);

  const handleCheck = async (id: string) => {
    setCheckingId(id);
    try {
      const res = await fetch('/api/withdrawal/check-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantSerial: id }),
      });
      const result = await res.json();
      // 仅更新被检查的那一条
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order._id === id
            ? {
                ...order,
                state: result.state !== undefined
                  ? (result.state === 1 ? '成功' : result.state === 2 || result.state === 3 ? '失败' : '等待中')
                  : order.state,
                checkable: result.state === 0,
              }
            : order
        )
      );
    } catch (err) {
      setError('检查失败');
      console.log(err)
    }
    setCheckingId(null);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-3xl bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <button onClick={handleBack} className="px-3 py-1 text-black">← 返回</button>
          <h1 className="text-2xl font-bold text-gray-800">取款记录</h1>
          <div></div>
        </div>
        {loading && <div className="text-center py-8 text-black">加载中...</div>}
        {error && <div className="text-center py-8 text-red-600">{error}</div>}
        <div className="overflow-x-auto text-black">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="px-4 py-2">金额</th>
                <th className="px-4 py-2">状态</th>
                <th className="px-4 py-2">时间</th>
                <th className="px-4 py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id} className="border-b">
                  <td className="px-4 py-2">{o.amount}</td>
                  <td className="px-4 py-2">{o.state}</td>
                  <td className="px-4 py-2">{o.time}</td>
                  <td className="px-4 py-2">
                    {o.checkable && (
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                        onClick={() => handleCheck(o._id)}
                        disabled={checkingId === o._id}
                      >
                        {checkingId === o._id ? '检查中...' : '检查'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-black">暂无取款记录</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}