// src/app/components/ClientOnly.tsx
'use client';

import { useEffect, useState, ReactNode } from 'react';

interface ClientOnlyProps {
  children: ReactNode;
}

export default function ClientOnly({ children }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // 只有在组件在客户端挂载后才设置 hasMounted 为 true
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    // 在服务器渲染或客户端水合完成之前，不渲染子组件
    return null;
  }

  // 在客户端水合完成后，渲染子组件
  return <>{children}</>;
}