// src/app/recharge/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function RechargePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [selectedMin, setSelectedMin] = useState<number>(0);
  const [selectedMax, setSelectedMax] = useState<number>(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/recharge/channels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        const result = await res.json()

        if (result.code === 200) {
          setChannels(result.data || [])
          const first = result.data?.[0]
          if (first) {
            setSelectedCode(first.code)
            setSelectedMin(first.min)
            setSelectedMax(first.max)
          }
        } else {
          setError('加载支付通道失败：' + result.msg)
        }
      } catch (err) {
        console.error(err)
        setError('加载支付通道失败')
      }
    }

    fetchChannels()
  }, [])

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const amountStr = (e.currentTarget.amount as any).value;
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount < selectedMin || amount > selectedMax) {
      e.preventDefault();
      setError(`金额无效，请输入 ${selectedMin} 到 ${selectedMax} 之间的整数金额。`);
      return;
    }
    setShowModal(true);
    setError(null);
  };

  const handleModalClose = (action: 'view' | 'recharge') => {
    setShowModal(false);
    if (action === 'view') {
      router.push('/dashboard');
    } else {
      formRef.current?.reset();
    }
  };

  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedCode(code);
    const selected = channels.find(c => c.code === code);
    if (selected) {
      setSelectedMin(selected.min);
      setSelectedMax(selected.max);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <button onClick={handleBack} className="px-3 py-1 text-black">← 返回</button>
          <h1 className="text-2xl font-bold text-gray-800">充值</h1>
          <div></div>
        </div>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        <form
          ref={formRef}
          action="/api/recharge/create-order"
          method="POST"
          target="_blank"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label className="block text-gray-700 mb-2">充值通道</label>
            <select
              name="channelCode"
              value={selectedCode}
              onChange={handleChannelChange}
              className="w-full border rounded px-4 py-2 text-black"
            >
              {channels.map(c => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">充值金额 (￥)</label>
            <input
              type="number"
              name="amount"
              required
              min={selectedMin}
              max={selectedMax}
              step="1"
              placeholder={`请输入 ${selectedMin} 到 ${selectedMax}`}
              className="w-full border rounded px-4 py-2 text-black"
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded">
            提交充值
          </button>
        </form>
      </div>

      {/* Modal 提示 */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">充值提示</h2>
            <p className="text-gray-700 mb-6">请在新打开的页面中完成充值。</p>
            <div className="flex justify-around space-x-4">
              <button onClick={() => handleModalClose('view')} className="bg-gray-200 px-6 py-2 rounded">返回查看</button>
              <button onClick={() => handleModalClose('recharge')} className="bg-blue-500 text-white px-6 py-2 rounded">再次充值</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}