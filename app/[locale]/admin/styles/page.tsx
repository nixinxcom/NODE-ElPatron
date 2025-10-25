'use client';

import AdminGuard from '@/complements/admin/AdminGuard';
import StylesTab from '@/complements/admin/StylesTab';
import SuperAdminOnly from '@/complements/admin/SuperAdminOnly';

export default function AdminStylesPage() {
  return (
    <AdminGuard>
      <SuperAdminOnly>
        <div className="space-y-6">
          <StylesTab />
        </div>
      </SuperAdminOnly>
    </AdminGuard>
  );
}
