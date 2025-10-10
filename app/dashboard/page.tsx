import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome, {user?.firstName}!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Your dashboard is being built. Phase 1 foundation is in progress.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Phase 1</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Foundation setup in progress
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Coming Soon</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              AI agents, RAG system, and more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
