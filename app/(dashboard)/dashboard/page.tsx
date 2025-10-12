import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import { AgentInteraction } from '@/components/agent-interaction';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Database,
  Users,
  Settings,
  BarChart3,
  BookOpen,
  ArrowRight,
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await currentUser();

  const quickActions = [
    {
      title: 'AI Chat',
      description: 'Chat with AI agents powered by multiple LLM providers',
      icon: MessageSquare,
      href: '/chat',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Knowledge Base',
      description: 'Manage your RAG documents and knowledge',
      icon: Database,
      href: '/dashboard/knowledge-base',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Team',
      description: 'Manage team members and permissions',
      icon: Users,
      href: '/dashboard/team',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Analytics',
      description: 'View usage metrics and performance data',
      icon: BarChart3,
      href: '/dashboard/analytics',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
    {
      title: 'Documentation',
      description: 'Learn about features and best practices',
      icon: BookOpen,
      href: '/docs',
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
    },
    {
      title: 'Settings',
      description: 'Configure your account and preferences',
      icon: Settings,
      href: '/dashboard/settings',
      color: 'text-slate-500',
      bgColor: 'bg-slate-500/10',
    },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Your AI-powered workspace is ready to use
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.title} className="group transition-shadow hover:shadow-lg">
                <Link href={action.href}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg ${action.bgColor} p-2`}>
                        <Icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors">
                        {action.title}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">
                      {action.description}
                    </CardDescription>
                    <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Open <ArrowRight className="ml-1 h-4 w-4" />
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <AgentInteraction />
        </div>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Follow these steps to get your project running.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium">Configure Environment</p>
                <p className="text-sm text-muted-foreground">
                  Copy `.env.example` to `.env.local` and add your API keys.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium">Upload Knowledge</p>
                <p className="text-sm text-muted-foreground">
                  Add documents to your knowledge base for context-aware responses.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full bg-primary/10 p-1">
                <div className="h-2 w-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="font-medium">Invite Your Team</p>
                <p className="text-sm text-muted-foreground">
                  Collaborate with team members on AI-powered projects.
                </p>
              </div>
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/docs">
                View Full Documentation <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
