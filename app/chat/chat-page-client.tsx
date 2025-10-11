'use client';

import { useState } from 'react';
import { ChatInterface, type Message } from '@/components/chat';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap } from 'lucide-react';

interface ChatPageClientProps {
  sessionId: string;
  userName: string;
  orgId: string;
}

type Provider = 'openai' | 'anthropic' | 'google' | 'mistral';

const PROVIDERS: { value: Provider; label: string; icon: string }[] = [
  { value: 'openai', label: 'OpenAI', icon: '🤖' },
  { value: 'anthropic', label: 'Anthropic', icon: '🧠' },
  { value: 'google', label: 'Google', icon: '🔍' },
  { value: 'mistral', label: 'Mistral', icon: '⚡' },
];

const MODELS: Record<Provider, { value: string; label: string }[]> = {
  openai: [
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  anthropic: [
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku' },
  ],
  google: [
    { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ],
  mistral: [
    { value: 'mistral-large-latest', label: 'Mistral Large' },
    { value: 'mistral-medium-latest', label: 'Mistral Medium' },
  ],
};

export function ChatPageClient({ sessionId, userName, orgId: _orgId }: ChatPageClientProps) {
  const [provider, setProvider] = useState<Provider>('openai');
  const [model, setModel] = useState<string>('gpt-4-turbo-preview');
  const [messageCount, setMessageCount] = useState(0);

  const handleProviderChange = (value: Provider) => {
    setProvider(value);
    // Set first model for the new provider
    const firstModel = MODELS[value][0];
    if (firstModel) {
      setModel(firstModel.value);
    }
  };

  const handleMessagesChange = (messages: Message[]) => {
    setMessageCount(messages.length);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* Settings Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Agent Settings
            </CardTitle>
            <CardDescription>Configure your AI agent</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODELS[provider].map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">User:</span>
              <span className="font-medium">{userName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Messages:</span>
              <Badge variant="secondary">{messageCount}</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div>
        <ChatInterface
          sessionId={sessionId}
          provider={provider}
          model={model}
          onMessagesChange={handleMessagesChange}
        />
      </div>
    </div>
  );
}
