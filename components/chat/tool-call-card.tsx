'use client';

/**
 * Tool Call Card Component
 *
 * Displays MCP tool execution in the chat interface.
 * Shows tool name, arguments, results, and execution status.
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2, Wrench } from 'lucide-react';

interface ToolCallCardProps {
  toolName: string;
  args?: Record<string, unknown>;
  result?: {
    success: boolean;
    data?: unknown;
    error?: string;
    metadata?: Record<string, unknown>;
  };
  status?: 'running' | 'success' | 'error';
}

export function ToolCallCard({ toolName, args, result, status = 'running' }: ToolCallCardProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'running':
      default:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Running</Badge>;
    }
  };

  const renderDataContent = () => {
    if (!result?.data) return null;
    const jsonString = JSON.stringify(result.data, null, 2);
    return (
      <div className="rounded-md bg-muted p-3 text-xs font-mono">
        <pre className="whitespace-pre-wrap">{jsonString}</pre>
      </div>
    );
  };

  return (
    <Card className="my-2 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">Tool: {toolName}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </div>
        {args && (
          <CardDescription className="text-xs">
            Arguments: {JSON.stringify(args, null, 2).substring(0, 100)}
            {JSON.stringify(args).length > 100 && '...'}
          </CardDescription>
        )}
      </CardHeader>

      {result && (
        <CardContent className="pt-0">
          {result.success ? (
            <div className="space-y-2">
              {renderDataContent()}
              {result.metadata && (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {Object.entries(result.metadata).map(([key, value]) => {
                    return (
                      <span key={key}>
                        <strong>{key}:</strong> {String(value)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-900">
              <p className="font-semibold">Error:</p>
              <p>{result.error}</p>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
