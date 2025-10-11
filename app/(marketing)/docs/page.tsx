import { Metadata } from 'next';
import Link from 'next/link';
import { getAllDocumentation } from '@/lib/sanity-queries';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Documentation | AI SaaS Boilerplate',
  description: 'Comprehensive guides and documentation for building with our platform.',
};

export default async function DocsPage() {
  const allDocs = await getAllDocumentation();

  // Group docs by category
  const categories = allDocs.reduce((acc, doc) => {
    const category = doc.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof allDocs>);

  const sortedCategories = Object.keys(categories).sort();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/20 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-6">Documentation</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Guides & Resources
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Everything you need to know to build amazing AI-powered applications.
          </p>
        </div>
      </section>

      {/* Documentation Grid */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {allDocs.length === 0 ? (
            <div className="text-center py-16">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h2 className="mt-4 text-2xl font-semibold text-foreground">No documentation yet</h2>
              <p className="mt-2 text-muted-foreground">
                Documentation is being prepared. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {sortedCategories.map((category) => (
                <div key={category}>
                  <h2 className="mb-6 text-2xl font-bold text-foreground">{category}</h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {categories[category]
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((doc) => (
                        <Card key={doc._id} className="group transition-shadow hover:shadow-lg">
                          <Link href={`/docs/${doc.slug.current}`}>
                            <CardHeader>
                              <CardTitle className="flex items-center justify-between text-lg group-hover:text-primary transition-colors">
                                {doc.title}
                                <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </CardTitle>
                              {doc.description && (
                                <CardDescription className="line-clamp-2">
                                  {doc.description}
                                </CardDescription>
                              )}
                            </CardHeader>
                          </Link>
                        </Card>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour
