import type { Metadata } from 'next';
import { getTenantViews } from '@/lib/queries';
import { TenantsClient } from './tenants-client';

export const metadata: Metadata = { title: '租客管理' };
export const dynamic = 'force-dynamic';

export default function TenantsPage() {
  return <TenantsClient tenants={getTenantViews()} />;
}
