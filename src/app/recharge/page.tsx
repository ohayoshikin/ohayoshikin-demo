// src/app/recharge/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function RechargePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = () => {
    // 客户端处理提交事件，显示弹窗
    setShowModal(true);
    setError(null);
  };

  const handleModalClose = (action: 'view' | 'recharge') => {
    setShowModal(false);
    if (action === 'view') {
      router.push('/dashboard');
    } else {
      if (formRef.current) {
        formRef.current.reset();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <div className="w-full max-w-xl bg-white rounded-lg shadow-md p-8">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <button
            onClick={handleBack}
            className="px-3 py-1 rounded-md transition-colors duration-200 text-black cursor-pointer"
          >
            ← 返回
          </button>
          <h1 className="text-2xl font-bold text-gray-800">充值</h1>
          <div></div> {/* 占位符，保持居中 */}
        </div>

        {/* 充值渠道信息 */}
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-gray-700 text-sm">充值渠道: <span className="font-semibold text-gray-900">Mvola 100~5000</span></p>
          <p className="text-gray-600 text-xs mt-1">请输入100到5000之间的金额。</p>
        </div>

        {error && <p className="text-red-600 text-center mb-4">{error}</p>}

        {/* 充值表单 */}
        <form
          ref={formRef}
          action="/api/recharge/create-order" // 表单提交到 API 路由
          method="POST"
          target="_blank" // 在新页面中打开
          onSubmit={handleSubmit} // 客户端处理提交事件
          className="space-y-6"
        >
          <div>
            <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">
              充值金额 (￥)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              required
              min="100"
              max="5000"
              step="1"
              placeholder="请输入充值金额"
              className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-200"
          >
            提交充值
          </button>
        </form>
      </div>

      {/* 提示弹窗 */}
      {showModal && createPortal(
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-sm w-full">
            <h2 className="text-xl font-bold mb-4">充值提示</h2>
            <p className="text-gray-700 mb-6">请在新打开的页面中完成充值。</p>
            <div className="flex justify-around space-x-4">
              <button
                onClick={() => handleModalClose('view')}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200"
              >
                返回查看
              </button>
              <button
                onClick={() => handleModalClose('recharge')}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
              >
                再次充值
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}