import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { SettingsClient } from './settings-client';

export const metadata: Metadata = { title: '系统设置' };
export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireUser();
  const db = getDb();

  const users = db.users.map(({ passwordHash: _hash, ...rest }) => rest);

  return (
    <SettingsClient
      user={user}
      users={user.role === 'admin' ? users : users.filter((u) => u.id === user.id)}
      isAdmin={user.role === 'admin'}
      stats={{
        rooms: db.rooms.length,
        tenants: db.tenants.length,
        contracts: db.contracts.length,
        bills: db.bills.length,
        orders: db.workOrders.length,
      }}
    />
  );
}
