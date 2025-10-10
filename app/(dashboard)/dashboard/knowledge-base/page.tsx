import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from '@/components/knowledge-base/document-upload';
import { DocumentList } from '@/components/knowledge-base/document-list';
import { Database, Upload, FileText, Zap } from 'lucide-react';

export default function KnowledgeBasePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Knowledge Base</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your RAG documents and knowledge sources for AI-powered context
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+3</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Chunks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              Avg 54 chunks/doc
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Embeddings</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">
              All documents indexed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Upload className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45.2 MB</div>
            <p className="text-xs text-muted-foreground">
              of 1 GB available
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Documents</CardTitle>
              <CardDescription>
                Manage your knowledge base documents and their embeddings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Add new documents to your knowledge base for RAG-powered responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload />

              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-medium">Supported File Types</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium">Documents</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      PDF, DOCX, TXT, MD
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium">Code</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      JS, TS, PY, JSON, YAML
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <h4 className="font-medium">Processing</h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>• Documents are automatically chunked for optimal retrieval</li>
                    <li>• Embeddings are generated using OpenAI ada-002</li>
                    <li>• Processed documents are available for RAG immediately</li>
                    <li>• Maximum file size: 10 MB per document</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base Settings</CardTitle>
              <CardDescription>
                Configure how your documents are processed and used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Chunking Strategy</h4>
                <p className="text-sm text-muted-foreground">
                  Documents are split into chunks of approximately 1000 tokens with 200 token overlap for better context retrieval.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Embedding Model</h4>
                <p className="text-sm text-muted-foreground">
                  Using OpenAI text-embedding-ada-002 for vector embeddings (1536 dimensions).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Similarity Search</h4>
                <p className="text-sm text-muted-foreground">
                  Top 5 most relevant chunks are retrieved using cosine similarity for each query.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Auto-Indexing</h4>
                <p className="text-sm text-muted-foreground">
                  New documents are automatically indexed and available for search within minutes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
