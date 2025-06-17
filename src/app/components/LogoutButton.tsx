// src/app/components/LogoutButton.tsx
'use client';

import { logoutAction } from '@/src/lib/actions'; // 导入 Server Action

export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        style={{
          padding: '10px 20px',
          backgroundColor: '#dc3545',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '1em',
          marginTop: '20px',
        }}
      >
        Logout
      </button>
    </form>
  );
}