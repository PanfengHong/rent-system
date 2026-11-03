import type { Metadata } from 'next';
import { getBillViews, getContractViews, getRoomViews, getTenantViews } from '@/lib/queries';
import { ContractsClient } from './contracts-client';

export const metadata: Metadata = { title: '合同管理' };
export const dynamic = 'force-dynamic';

export default function ContractsPage() {
  return (
    <ContractsClient
      contracts={getContractViews()}
      rooms={getRoomViews()}
      tenants={getTenantViews()}
      bills={getBillViews()}
    />
  );
}
