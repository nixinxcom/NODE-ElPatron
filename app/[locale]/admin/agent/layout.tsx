// app/[locale]/admin/agent/layout.tsx
'use client';
import React from 'react';
import AdminGuard from '@/complements/admin/AdminGuard';

export default function AgentAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  );
}
