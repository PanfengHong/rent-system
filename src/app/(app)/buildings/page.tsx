import type { Metadata } from 'next';
import { requireUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { BuildingsClient } from './buildings-client';

export const metadata: Metadata = { title: '楼栋管理' };
export const dynamic = 'force-dynamic';

export default async function BuildingsPage() {
  const user = await requireUser();
  const db = getDb();

  return <BuildingsClient buildings={db.buildings} rooms={db.rooms} canManage={user.role === 'admin'} />;
}
