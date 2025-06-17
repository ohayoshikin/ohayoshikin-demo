// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { loginAction, registerAction } from '@/src/lib/actions'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    // 直接调用 Server Action
    const result = await loginAction(formData);
    // Server Action 内部已经处理了重定向，如果返回了错误，说明登录失败
    if (result && result.error) {
      setError(result.error);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    const result = await registerAction(formData);
    if (result && result.error) {
      setError(result.error);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>

      {error && <p style={{ color: 'red', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

      <h2 style={{ fontSize: '1.2em', marginBottom: '10px' }}>登录</h2>
      <form onSubmit={handleLoginSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="login-username" style={{ display: 'block', marginBottom: '5px' }}>账号:</label>
          <input type="text" id="login-username" name="username" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="login-password" style={{ display: 'block', marginBottom: '5px' }}>密码:</label>
          <input type="password" id="login-password" name="password" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>登录</button>
      </form>

      <hr style={{ margin: '40px 0' }} />

      <h2 style={{ fontSize: '1.2em', marginBottom: '10px' }}>注册</h2>
      <form onSubmit={handleRegisterSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="register-username" style={{ display: 'block', marginBottom: '5px' }}>账号:</label>
          <input type="text" id="register-username" name="username" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="register-password" style={{ display: 'block', marginBottom: '5px' }}>密码:</label>
          <input type="password" id="register-password" name="password" required style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>注册</button>
      </form>
    </div>
  );
}