// src/app/components/OrderList.tsx
'use client'; // 这是一个客户端组件

import { useState, useEffect } from 'react';
import Pagination from './Pagination';
import { OrderListItem, OurOrderState, OurOrderStateMap } from '@/src/types/user'
import { checkRechargeOrderAction, getUserOrdersAction } from '@/src/lib/actions'
export default function OrderList() {

  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async (page: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const pageParams: PageParams = { current: page, pageSize: size };
      const result: PageResult<OrderListItem> = await getUserOrdersAction(pageParams);

      if (result.success) {
        setOrders(result.data || []);
        setTotal(result.total);
        setCurrentPage(result.current);
        setPageSize(result.pageSize);
      } else {
        setError('加载订单失败。');
        setOrders([]);
        setTotal(0);
      }
    } catch (err: any) {
      console.error("Failed to fetch orders:", err);
      setError(err.message || '加载订单时发生错误。');
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, pageSize);
  }, [currentPage, pageSize]); // 依赖 currentPage 和 pageSize，确保在它们变化时重新获取数据

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // fetchOrders 会在 useEffect 中自动触发
  };

  // 处理“检查”按钮点击
  const handleCheckOrder = async (merchantSerial: string) => {
    // if (!confirm(`确定要检查订单 ${merchantSerial} 的状态吗？`)) {
    //   return;
    // }
    setLoading(true); // 可以只针对单个订单设置loading状态，这里为了简化，整个列表loading
    setError(null);
    try {
      const result = await checkRechargeOrderAction(merchantSerial); // 直接调用 Server Action

      if (result.success) {
        // alert(`订单 ${merchantSerial} 状态更新成功！最新状态: ${OurOrderStateMap[result.state!]}`);
        fetchOrders(currentPage, pageSize); // 刷新列表以显示最新状态
      } else {
        // alert(`检查订单 ${merchantSerial} 失败: ${result.error || '未知错误'}`);
        setError(result.error || '检查订单失败。');
      }
    } catch (err: any) {
      console.error("Failed to check order:", err);
      // alert(`检查订单 ${merchantSerial} 时发生网络错误: ${err.message}`);
      setError(err.message || '检查订单时发生网络错误。');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="text-center py-8 text-gray-600">加载中...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">错误: {error}</div>;
  }

  return (
    <div>
      {orders.length === 0 ? (
        <p className="text-gray-600 text-center py-8">暂无充值订单。</p>
      ) : (
        <ul className="space-y-4"> {/* 使用 ul 标签作为列表容器 */}
          {orders.map((order) => (
            <li key={order._id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                {/* 订单号 */}
                <div className="text-gray-800 font-semibold text-base sm:text-lg mb-1 sm:mb-0">
                  订单号: <span className="break-all">{order._id}</span> {/* break-all 防止长ID溢出 */}
                </div>
                {/* 状态 */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium self-start sm:self-auto
                  ${order.state === OurOrderStateMap[OurOrderState.SUCCESS] ? 'bg-green-100 text-green-800' :
                    order.state === OurOrderStateMap[OurOrderState.PENDING] ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'}`}>
                  {order.state}
                </span>
              </div>

              {/* 金额 */}
              <div className="text-gray-700 text-sm mb-1">
                金额: <span className="font-bold text-lg text-blue-600">￥{order.amount.toFixed(2)}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                {/* 时间 */}
                <div className="text-gray-500 text-xs sm:text-sm mb-2 sm:mb-0">
                  时间: {order.time}
                </div>
                {/* 操作按钮 */}
                <div className="self-start sm:self-auto">
                  {order.checkable && ( // 只有我方状态为“等待”的订单才显示检查按钮
                    <button
                      onClick={() => handleCheckOrder(order._id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs transition-colors duration-200"
                    >
                      检查
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 分页组件依然保留 */}
      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={handlePageChange}
      />
    </div>
  );
}