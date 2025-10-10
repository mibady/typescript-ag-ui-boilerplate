import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getPostBySlug, getAllPosts, getRecentPosts } from '@/lib/sanity-queries';
import { PortableText } from '@/components/marketing/portable-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, User, ArrowLeft } from 'lucide-react';
import { imageUrlBuilder } from '@/lib/sanity-client';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

// Generate static params for all blog posts
export async function generateStaticParams() {
  const posts = await getAllPosts(100, 0); // Get first 100 posts
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  const imageUrl = post.mainImage ? imageUrlBuilder(post.mainImage) : undefined;

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: imageUrl ? [{ url: imageUrl }] : [],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  // Fetch related/recent posts
  const relatedPosts = await getRecentPosts(3);

  const imageUrl = post.mainImage ? imageUrlBuilder(post.mainImage) : null;
  const authorImageUrl = post.author.image ? imageUrlBuilder(post.author.image) : null;

  const formattedDate = new Date(post.publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Calculate reading time
  const wordCount = post.body?.reduce((count: number, block: any) => {
    if (block._type === 'block' && block.children) {
      return count + block.children.reduce((c: number, child: any) => c + (child.text?.split(/\s+/).length || 0), 0);
    }
    return count;
  }, 0) || 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Back button */}
      <div className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </div>

      {/* Article */}
      <article className="px-6 py-16 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <header className="mb-8">
            {post.categories && post.categories.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {post.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {post.title}
            </h1>

            <p className="mt-4 text-xl text-muted-foreground">{post.excerpt}</p>

            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* Author */}
              <div className="flex items-center gap-2">
                {authorImageUrl ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-full">
                    <Image
                      src={authorImageUrl}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                    />
                  </div>
                ) : (
                  <User className="h-5 w-5" />
                )}
                <span className="font-medium">{post.author.name}</span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
              </div>

              {/* Reading time */}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{readingTime} min read</span>
              </div>
            </div>
          </header>

          {/* Featured image */}
          {imageUrl && (
            <div className="mb-12 overflow-hidden rounded-xl">
              <div className="relative aspect-[16/9]">
                <Image
                  src={imageUrl}
                  alt={post.mainImage?.alt || post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                  priority
                />
              </div>
            </div>
          )}

          {/* Content */}
          {post.body && (
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <PortableText content={post.body} />
            </div>
          )}

          <Separator className="my-12" />

          {/* Author bio */}
          {post.author.bio && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  {authorImageUrl && (
                    <div className="relative h-16 w-16 overflow-hidden rounded-full">
                      <Image
                        src={authorImageUrl}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div>
                    <CardTitle>{post.author.name}</CardTitle>
                    {(post.author.twitter || post.author.linkedin) && (
                      <div className="mt-1 flex gap-3 text-sm">
                        {post.author.twitter && (
                          <a
                            href={`https://twitter.com/${post.author.twitter}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            Twitter
                          </a>
                        )}
                        {post.author.linkedin && (
                          <a
                            href={post.author.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{post.author.bio}</CardDescription>
              </CardContent>
            </Card>
          )}
        </div>
      </article>

      {/* Related posts */}
      {relatedPosts.length > 0 && (
        <section className="border-t bg-muted/30 px-6 py-16 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Recent Posts</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {relatedPosts
                .filter((p) => p.slug.current !== params.slug)
                .slice(0, 3)
                .map((relatedPost) => {
                  const relatedImageUrl = relatedPost.mainImage
                    ? imageUrlBuilder(relatedPost.mainImage)
                    : null;

                  return (
                    <Card key={relatedPost.slug.current} className="overflow-hidden">
                      <Link href={`/blog/${relatedPost.slug.current}`}>
                        {relatedImageUrl && (
                          <div className="relative aspect-[16/9] overflow-hidden">
                            <Image
                              src={relatedImageUrl}
                              alt={relatedPost.title}
                              fill
                              className="object-cover transition-transform hover:scale-105"
                              sizes="(max-width: 768px) 100vw, 33vw"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="line-clamp-2 text-lg">
                            {relatedPost.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {relatedPost.excerpt}
                          </CardDescription>
                        </CardHeader>
                      </Link>
                    </Card>
                  );
                })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// Enable ISR (Incremental Static Regeneration)
export const revalidate = 3600; // Revalidate every hour
