import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { imageUrlBuilder } from '@/lib/sanity-client';

interface Author {
  name: string;
  image?: {
    asset: {
      _ref: string;
    };
  };
}

interface PostCardProps {
  title: string;
  slug: string | { current: string };
  excerpt: string;
  mainImage?: {
    asset: {
      _ref: string;
    };
    alt?: string;
  };
  author: Author;
  publishedAt: string;
  categories?: string[];
  estimatedReadingTime?: number;
}

function calculateReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function PostCard({
  title,
  slug,
  excerpt,
  mainImage,
  author,
  publishedAt,
  categories = [],
  estimatedReadingTime,
}: PostCardProps) {
  const slugString = typeof slug === 'string' ? slug : slug.current;
  const imageUrl = mainImage ? imageUrlBuilder(mainImage) : null;
  const authorImageUrl = author.image ? imageUrlBuilder(author.image) : null;
  const readingTime = estimatedReadingTime || calculateReadingTime(excerpt);

  const formattedDate = new Date(publishedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-lg">
      <Link href={`/blog/${slugString}`} className="block">
        {imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden bg-muted">
            <Image
              src={imageUrl}
              alt={mainImage?.alt || title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}

        <CardHeader>
          {categories.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {categories.slice(0, 2).map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}

          <CardTitle className="line-clamp-2 text-xl group-hover:text-primary transition-colors">
            {title}
          </CardTitle>

          <CardDescription className="line-clamp-3 text-base">
            {excerpt}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {/* Author */}
            <div className="flex items-center gap-2">
              {authorImageUrl ? (
                <div className="relative h-6 w-6 overflow-hidden rounded-full">
                  <Image
                    src={authorImageUrl}
                    alt={author.name}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
              ) : (
                <User className="h-4 w-4" />
              )}
              <span>{author.name}</span>
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
        </CardContent>
      </Link>
    </Card>
  );
}
