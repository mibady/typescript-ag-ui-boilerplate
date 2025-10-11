import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { BillingDashboard } from './billing-client';

export const metadata = {
  title: 'Billing - Dashboard',
  description: 'Manage your subscription and billing',
};

export default async function BillingPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    redirect('/sign-in');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
        <p className="text-muted-foreground mt-2">
          Manage your subscription, view usage, and payment history
        </p>
      </div>

      <BillingDashboard organizationId={orgId} />
    </div>
  );
}
