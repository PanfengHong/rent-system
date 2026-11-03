import type { Metadata } from 'next';
import { getBillViews } from '@/lib/queries';
import { BillsClient } from './bills-client';

export const metadata: Metadata = { title: '账单收款' };
export const dynamic = 'force-dynamic';

export default function BillsPage() {
  return <BillsClient bills={getBillViews()} />;
}
