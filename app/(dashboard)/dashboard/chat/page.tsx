import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ChatPageClient } from './chat-page-client';
import { createSession, getUserSessions } from '@/lib/db/sessions';

export const metadata = {
  title: 'AI Chat - Dashboard',
  description: 'Chat with your AI assistant',
};

export default async function DashboardChatPage() {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    redirect('/sign-in');
  }

  const user = await currentUser();

  // Get or create an active session
  const existingSessions = await getUserSessions(userId, {
    status: 'active',
    limit: 1,
  });

  let sessionId: string;

  if (existingSessions.length > 0) {
    // Use existing active session
    sessionId = existingSessions[0].id;
  } else {
    // Create new session
    const newSession = await createSession({
      organizationId: orgId,
      userId,
      agentType: 'assistant',
      metadata: {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
      },
    });

    sessionId = newSession?.id || `temp_${Date.now()}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-2">
          Chat with your AI agent powered by multiple LLM providers
        </p>
      </div>

      <ChatPageClient
        sessionId={sessionId}
        userName={user?.firstName || 'User'}
        orgId={orgId}
      />
    </div>
  );
}
