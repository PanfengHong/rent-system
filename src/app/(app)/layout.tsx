import { requireUser } from '@/lib/auth';
import { getShellAlerts } from '@/lib/queries';
import { AppShell } from '@/components/layout/app-shell';
import type { ReactNode } from 'react';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const alerts = getShellAlerts();

  return (
    <AppShell user={user} alerts={alerts}>
      {children}
    </AppShell>
  );
}
