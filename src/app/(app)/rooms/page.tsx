import type { Metadata } from 'next';
import { getDb } from '@/lib/db';
import { getRoomViews } from '@/lib/queries';
import { RoomsClient } from './rooms-client';

export const metadata: Metadata = { title: '房间管理' };
export const dynamic = 'force-dynamic';

export default function RoomsPage() {
  const rooms = getRoomViews();
  const buildings = getDb().buildings;

  return <RoomsClient rooms={rooms} buildings={buildings} />;
}
