import type { Metadata } from 'next';
import { getRoomViews, getWorkOrderViews } from '@/lib/queries';
import { MaintenanceClient } from './maintenance-client';

export const metadata: Metadata = { title: '报修工单' };
export const dynamic = 'force-dynamic';

export default function MaintenancePage() {
  return <MaintenanceClient orders={getWorkOrderViews()} rooms={getRoomViews()} />;
}
