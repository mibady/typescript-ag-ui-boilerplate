import { Metadata } from 'next';
import { PostCard } from '@/components/marketing/post-card';
import { getAllPosts, getPostCount } from '@/lib/sanity-queries';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Blog | AI SaaS Boilerplate',
  description: 'Insights, tutorials, and updates about AI development and our platform.',
};

const POSTS_PER_PAGE = 9;

interface BlogPageProps {
  searchParams: {
    page?: string;
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const currentPage = Number(searchParams.page) || 1;
  const offset = (currentPage - 1) * POSTS_PER_PAGE;

  // Fetch posts and total count in parallel
  const [posts, totalCount] = await Promise.all([
    getAllPosts(POSTS_PER_PAGE, offset),
    getPostCount(),
  ]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <section className="bg-gradient-to-b from-background to-muted/20 px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge className="mb-6">Blog</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Insights & Updates
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Tutorials, best practices, and news about AI development and our platform.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-foreground">No posts yet</h2>
              <p className="mt-2 text-muted-foreground">
                Check back soon for new content!
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard
                    key={post.slug.current}
                    title={post.title}
                    slug={post.slug}
                    excerpt={post.excerpt}
                    mainImage={post.mainImage}
                    author={post.author}
                    publishedAt={post.publishedAt}
                    categories={post.categories}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={!hasPrevPage}
                  >
                    {hasPrevPage ? (
                      <Link href={`/blog?page=${currentPage - 1}`}>
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Link>
                    ) : (
                      <span className="flex items-center">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Previous
                      </span>
                    )}
                  </Button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    disabled={!hasNextPage}
                  >
                    {hasNextPage ? (
                      <Link href={`/blog?page=${currentPage + 1}`}>
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <span className="flex items-center">
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour
