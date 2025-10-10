import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Welcome, {user?.firstName}!
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Your AI-powered workspace is ready to use
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/chat" className="group">
            <div className="h-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                  AI Chat
                </h3>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Chat with AI agents powered by multiple LLM providers
              </p>
              <Button variant="link" className="mt-4 p-0 h-auto">
                Start chatting →
              </Button>
            </div>
          </Link>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-500/10 p-2">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Phase 2
              </h3>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              Core agent system with streaming - Complete!
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-500/10 p-2">
                <Sparkles className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Coming Soon
              </h3>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              MCP tools, RAG system, and advanced features
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
