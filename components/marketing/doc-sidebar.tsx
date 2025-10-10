import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronRight } from 'lucide-react';

interface DocItem {
  _id: string;
  title: string;
  slug: { current: string };
  category: string;
  order?: number;
}

interface DocSidebarProps {
  docs: DocItem[];
  currentSlug?: string;
}

export function DocSidebar({ docs, currentSlug }: DocSidebarProps) {
  // Group docs by category
  const categories = docs.reduce((acc, doc) => {
    const category = doc.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, DocItem[]>);

  // Sort categories alphabetically
  const sortedCategories = Object.keys(categories).sort();

  return (
    <ScrollArea className="h-full pb-10">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Documentation
          </h2>
          <div className="space-y-1">
            {sortedCategories.map((category) => (
              <div key={category}>
                <h3 className="mb-1 px-4 text-sm font-semibold text-muted-foreground">
                  {category}
                </h3>
                <div className="space-y-1">
                  {categories[category]
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .map((doc) => (
                      <Link
                        key={doc._id}
                        href={`/docs/${doc.slug.current}`}
                        className={cn(
                          'group flex w-full items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                          currentSlug === doc.slug.current
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        <ChevronRight className="mr-2 h-4 w-4 opacity-50" />
                        {doc.title}
                      </Link>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
