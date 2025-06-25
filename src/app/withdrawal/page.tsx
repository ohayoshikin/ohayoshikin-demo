'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function WithdrawalPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [targetAccount, setTargetAccount] = useState('');
  const [targetOwner, setTargetOwner] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBack = () => router.back();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/withdrawal/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          type: 'MVola',
          targetAccount,
          targetOwner
        })
      });
      const data = await res.json();
      if (data.code === 200) {
        alert('取款申请成功');
        router.push('/withdrawal-list');
      } else {
        setError(data.msg || '取款失败');
      }
    } catch (e) {
      setError('网络错误');
      console.log(e)
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <button onClick={handleBack} className="px-3 py-1 text-black">← 返回</button>
          <h1 className="text-2xl font-bold text-gray-800">取款</h1>
          <div></div>
        </div>
        {error && <p className="text-red-600 text-center mb-4">{error}</p>}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-gray-700 mb-2">收款姓名</label>
            <input className="w-full border rounded px-4 py-2 text-black"
              value={targetOwner}
              onChange={e => setTargetOwner(e.target.value)}
              required />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">收款账号</label>
            <input className="w-full border rounded px-4 py-2 text-black"
              value={targetAccount}
              onChange={e => setTargetAccount(e.target.value)}
              required />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">取款金额</label>
            <input className="w-full border rounded px-4 py-2 text-black"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required />
          </div>
          <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded" disabled={loading}>
            {loading ? '提交中...' : '提交取款'}
          </button>
        </form>
      </div>
    </div>
  );
}