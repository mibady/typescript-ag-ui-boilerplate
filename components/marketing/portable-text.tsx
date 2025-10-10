import Image from 'next/image';
import { imageUrlBuilder } from '@/lib/sanity-client';

interface PortableTextBlock {
  _type: string;
  _key: string;
  style?: string;
  children?: Array<{
    _type: string;
    _key: string;
    text: string;
    marks?: string[];
  }>;
  markDefs?: Array<{
    _key: string;
    _type: string;
    href?: string;
  }>;
  asset?: {
    _ref: string;
  };
  alt?: string;
  level?: number;
  listItem?: string;
}

interface PortableTextProps {
  content: PortableTextBlock[];
}

export function PortableText({ content }: PortableTextProps) {
  if (!content || !Array.isArray(content)) {
    return null;
  }

  return (
    <div className="prose prose-gray dark:prose-invert max-w-none">
      {content.map((block) => renderBlock(block))}
    </div>
  );
}

function renderBlock(block: PortableTextBlock) {
  const { _type, _key } = block;

  // Handle different block types
  switch (_type) {
    case 'block':
      return renderTextBlock(block);
    case 'image':
      return renderImage(block);
    default:
      return null;
  }
}

function renderTextBlock(block: PortableTextBlock) {
  const { style = 'normal', children = [], _key, markDefs = [], listItem } = block;

  if (!children || children.length === 0) {
    return null;
  }

  const textContent = children.map((child) => {
    if (!child.text) return null;

    let content = child.text;
    const marks = child.marks || [];

    // Apply marks
    marks.forEach((mark) => {
      if (mark === 'strong') {
        content = `<strong>${content}</strong>`;
      } else if (mark === 'em') {
        content = `<em>${content}</em>`;
      } else if (mark === 'code') {
        content = `<code>${content}</code>`;
      } else {
        // Check for link marks
        const markDef = markDefs.find((def) => def._key === mark);
        if (markDef && markDef._type === 'link' && markDef.href) {
          content = `<a href="${markDef.href}" target="_blank" rel="noopener noreferrer">${content}</a>`;
        }
      }
    });

    return content;
  });

  const htmlContent = textContent.join('');

  // Handle list items
  if (listItem === 'bullet') {
    return (
      <li key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />
    );
  }

  if (listItem === 'number') {
    return (
      <li key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />
    );
  }

  // Handle headings and paragraphs
  switch (style) {
    case 'h1':
      return <h1 key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    case 'h2':
      return <h2 key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    case 'h3':
      return <h3 key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    case 'h4':
      return <h4 key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    case 'h5':
      return <h5 key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    case 'h6':
      return <h6 key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    case 'blockquote':
      return <blockquote key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
    default:
      return <p key={_key} dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  }
}

function renderImage(block: PortableTextBlock) {
  const { asset, alt, _key } = block;

  if (!asset) return null;

  const imageUrl = imageUrlBuilder({ asset });

  return (
    <div key={_key} className="my-8">
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <Image
          src={imageUrl}
          alt={alt || 'Blog post image'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>
      {alt && (
        <p className="mt-2 text-center text-sm text-muted-foreground">{alt}</p>
      )}
    </div>
  );
}
