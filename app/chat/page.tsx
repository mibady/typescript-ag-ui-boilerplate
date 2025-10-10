import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ChatPageClient } from './chat-page-client';

export default async function ChatPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  // Generate a session ID (in production, this would be stored in database)
  const sessionId = `session_${Date.now()}_${userId}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            AI Assistant
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Chat with your AI agent powered by multiple LLM providers
          </p>
        </div>

        <ChatPageClient
          sessionId={sessionId}
          userName={user?.firstName || 'User'}
          orgId={orgId || ''}
        />
      </div>
    </div>
  );
}
