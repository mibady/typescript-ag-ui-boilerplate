'use client';

import { MessageSquare, Database, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'chat' | 'knowledge' | 'settings' | 'team';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

// Mock activity data
const activities: Activity[] = [
  {
    id: '1',
    type: 'chat',
    message: 'Chat session completed with GPT-4',
    timestamp: '2 minutes ago',
    status: 'success',
  },
  {
    id: '2',
    type: 'knowledge',
    message: 'Added 5 documents to knowledge base',
    timestamp: '15 minutes ago',
    status: 'success',
  },
  {
    id: '3',
    type: 'chat',
    message: 'Chat session with Claude 3 Opus',
    timestamp: '23 minutes ago',
    status: 'success',
  },
  {
    id: '4',
    type: 'team',
    message: 'New team member joined',
    timestamp: '1 hour ago',
    status: 'success',
  },
  {
    id: '5',
    type: 'settings',
    message: 'API key updated',
    timestamp: '2 hours ago',
    status: 'success',
  },
  {
    id: '6',
    type: 'chat',
    message: 'Chat session completed with Gemini Pro',
    timestamp: '3 hours ago',
    status: 'success',
  },
  {
    id: '7',
    type: 'knowledge',
    message: 'Document embedding completed',
    timestamp: '4 hours ago',
    status: 'success',
  },
  {
    id: '8',
    type: 'chat',
    message: 'Rate limit warning: 80% of quota used',
    timestamp: '5 hours ago',
    status: 'warning',
  },
];

const iconMap = {
  chat: MessageSquare,
  knowledge: Database,
  settings: Settings,
  team: Users,
};

const statusColors = {
  success: 'text-green-500 bg-green-500/10',
  warning: 'text-yellow-500 bg-yellow-500/10',
  error: 'text-red-500 bg-red-500/10',
};

export function ActivityFeed() {
  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const Icon = iconMap[activity.type];

        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={cn('rounded-lg p-2', statusColors[activity.status])}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium">{activity.message}</p>
              <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
