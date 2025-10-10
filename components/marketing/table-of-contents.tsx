'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  content: any[];
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  useEffect(() => {
    // Extract headings from content
    const headings = content
      .filter((block) => block._type === 'block' && block.style?.match(/^h[2-4]$/))
      .map((block, index) => {
        const level = parseInt(block.style.replace('h', ''));
        const title = block.children
          ?.map((child: any) => child.text)
          .join(' ') || '';
        const id = `heading-${index}`;

        return { id, title, level };
      });

    setTocItems(headings);

    // Set up intersection observer for active heading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    // Observe all heading elements
    const timeout = setTimeout(() => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.observe(element);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [content]);

  if (tocItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="font-medium">On This Page</p>
      <ul className="space-y-2 text-sm">
        {tocItems.map((item) => (
          <li
            key={item.id}
            className={cn(
              'border-l-2 transition-colors',
              item.level === 2 && 'pl-2',
              item.level === 3 && 'pl-4',
              item.level === 4 && 'pl-6',
              activeId === item.id
                ? 'border-primary text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
          >
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              }}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
