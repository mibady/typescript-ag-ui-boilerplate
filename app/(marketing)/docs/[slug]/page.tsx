import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getDocumentationBySlug, getAllDocumentation } from '@/lib/sanity-queries';
import { PortableText } from '@/components/marketing/portable-text';
import { DocSidebar } from '@/components/marketing/doc-sidebar';
import { TableOfContents } from '@/components/marketing/table-of-contents';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface DocPageProps {
  params: {
    slug: string;
  };
}

// Generate static params for all documentation pages
export async function generateStaticParams() {
  const docs = await getAllDocumentation();
  return docs.map((doc) => ({
    slug: doc.slug.current,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: DocPageProps): Promise<Metadata> {
  const doc = await getDocumentationBySlug(params.slug);

  if (!doc) {
    return {
      title: 'Documentation Not Found',
    };
  }

  return {
    title: `${doc.title} | Documentation`,
    description: doc.description || `Learn about ${doc.title}`,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const doc = await getDocumentationBySlug(params.slug);

  if (!doc) {
    notFound();
  }

  // Fetch all docs for sidebar
  const allDocs = await getAllDocumentation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:block w-64 border-r bg-muted/30">
        <div className="sticky top-0 h-screen">
          <div className="px-6 py-8">
            <Button variant="ghost" size="sm" asChild className="mb-4">
              <Link href="/docs">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Docs
              </Link>
            </Button>
          </div>
          <DocSidebar docs={allDocs} currentSlug={params.slug} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        <article className="px-6 py-16 lg:px-12">
          <div className="mx-auto max-w-3xl">
            {/* Back button for mobile */}
            <div className="mb-8 lg:hidden">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/docs">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  All Docs
                </Link>
              </Button>
            </div>

            {/* Header */}
            <header className="mb-8">
              <div className="mb-2 text-sm text-muted-foreground">{doc.category}</div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                {doc.title}
              </h1>
              {doc.description && (
                <p className="mt-4 text-xl text-muted-foreground">{doc.description}</p>
              )}
            </header>

            {/* Content */}
            {doc.content && (
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <PortableText content={doc.content} />
              </div>
            )}

            <Separator className="my-12" />

            {/* Related documentation */}
            {doc.relatedDocs && doc.relatedDocs.length > 0 && (
              <div>
                <h2 className="mb-6 text-2xl font-bold text-foreground">Related Documentation</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {doc.relatedDocs.map((relatedDoc) => (
                    <Card key={relatedDoc._id} className="group transition-shadow hover:shadow-lg">
                      <Link href={`/docs/${relatedDoc.slug.current}`}>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between text-lg group-hover:text-primary transition-colors">
                            {relatedDoc.title}
                            <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </CardTitle>
                        </CardHeader>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>
      </main>

      {/* Table of Contents */}
      {doc.content && (
        <aside className="hidden xl:block w-64 border-l bg-muted/30">
          <div className="sticky top-0 h-screen overflow-auto px-6 py-16">
            <TableOfContents content={doc.content} />
          </div>
        </aside>
      )}
    </div>
  );
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour
