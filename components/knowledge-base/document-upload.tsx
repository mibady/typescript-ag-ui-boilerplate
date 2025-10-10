'use client';

/**
 * Document Upload Component
 *
 * Allows users to upload documents to the knowledge base.
 * Supports text files, PDFs, and direct text input.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface UploadResponse {
  success: boolean;
  documentId?: string;
  chunkCount?: number;
  totalTokens?: number;
  error?: string;
}

export function DocumentUpload({ onUploadSuccess }: { onUploadSuccess?: (documentId: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [documentName, setDocumentName] = useState('');
  const { toast } = useToast();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsUploading(true);

    try {
      // Read file content
      const content = await file.text();

      // Upload to API
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          content,
          contentType: file.type || 'text/plain',
        }),
      });

      const data: UploadResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      toast({
        title: 'Document uploaded successfully',
        description: `Processed ${data.chunkCount} chunks (${data.totalTokens} tokens)`,
      });

      // Reset form
      setFileName('');
      e.target.value = '';

      if (data.documentId && onUploadSuccess) {
        onUploadSuccess(data.documentId);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextUpload = async () => {
    if (!documentName || !textContent) {
      toast({
        title: 'Missing fields',
        description: 'Please provide both document name and content',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      const response = await fetch('/api/rag/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: documentName,
          content: textContent,
          contentType: 'text/plain',
        }),
      });

      const data: UploadResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      toast({
        title: 'Document uploaded successfully',
        description: `Processed ${data.chunkCount} chunks (${data.totalTokens} tokens)`,
      });

      // Reset form
      setDocumentName('');
      setTextContent('');

      if (data.documentId && onUploadSuccess) {
        onUploadSuccess(data.documentId);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Document</CardTitle>
        <CardDescription>
          Add documents to your knowledge base for semantic search
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">File Upload</TabsTrigger>
            <TabsTrigger value="text">Direct Text</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept=".txt,.md,.json,.csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="flex-1"
                />
                {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
              {fileName && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {fileName}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Supported formats: .txt, .md, .json, .csv
            </p>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Document Name</Label>
              <Input
                id="name"
                placeholder="e.g., Product Documentation"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Paste your document content here..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                disabled={isUploading}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <Button
              onClick={handleTextUpload}
              disabled={isUploading || !documentName || !textContent}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
