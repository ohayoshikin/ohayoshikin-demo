'use client';

import { useState } from 'react';
import { refreshBalanceAction } from '@/src/lib/actions';

export default function BalanceDisplay({ initialBalance }: { initialBalance?: number }) {
  const [balance, setBalance] = useState<number | undefined>(initialBalance);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefreshBalance = async () => {
    setLoading(true);
    setError(null);
    const result = await refreshBalanceAction();
    if (result.error) {
      setError(result.error);
    } else {
      setBalance(result.balance);
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center space-x-4">
      <p className="text-xl font-medium text-gray-700">
        余额: <span className="font-bold text-green-600">{balance !== undefined ? `${balance.toFixed(2)}` : '加载中...'}</span>
      </p>
      <button
        onClick={handleRefreshBalance}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 transition-colors duration-200"
      >
        {loading ? '...' : '刷新'}
      </button>
      {/* <Link
        href="/recharge"
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors duration-200 inline-block"
      >
        立即充值
      </Link>
      <Link
        href="/withdrawal"
        className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors duration-200 inline-block"
      >
        立即取款
      </Link> */}
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}