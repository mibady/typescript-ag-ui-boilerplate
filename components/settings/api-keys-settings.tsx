'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const apiKeys = [
  { id: '1', name: 'Production API Key', key: 'sk-prod-abc123...', lastUsed: '2 hours ago' },
  { id: '2', name: 'Development API Key', key: 'sk-dev-xyz789...', lastUsed: '1 day ago' },
];

export function ApiKeysSettings() {
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: 'Copied to clipboard' });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>
            Manage your API keys for accessing the platform programmatically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{apiKey.name}</p>
                    <Badge variant="outline">Active</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="text-sm">{showKeys[apiKey.id] ? apiKey.key : '••••••••••••••••'}</code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowKeys(prev => ({ ...prev, [apiKey.id]: !prev[apiKey.id] }))}
                    >
                      {showKeys[apiKey.id] ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleCopy(apiKey.key)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Last used: {apiKey.lastUsed}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button>Create New API Key</Button>
        </CardContent>
      </Card>
    </div>
  );
}
