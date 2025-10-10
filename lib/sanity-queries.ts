/**
 * Sanity GROQ Queries
 *
 * Centralized queries for fetching data from Sanity CMS
 */

import { sanityClient } from './sanity-client';

/**
 * Blog Post Type Definition
 */
export interface BlogPost {
  _id: string;
  title: string;
  slug: { current: string };
  excerpt: string;
  publishedAt: string;
  mainImage?: {
    asset: {
      _ref: string;
      _type: string;
    };
    alt?: string;
  };
  author: {
    name: string;
    bio?: string;
    twitter?: string;
    linkedin?: string;
    image?: {
      asset: {
        _ref: string;
        _type: string;
      };
    };
  };
  categories?: string[];
  body?: any[];
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
  };
}

/**
 * Documentation Type Definition
 */
export interface Documentation {
  _id: string;
  title: string;
  slug: { current: string };
  category: string;
  order?: number;
  description?: string;
  content: any[];
  relatedDocs?: Array<{
    _id: string;
    title: string;
    slug: { current: string };
  }>;
}

/**
 * Fetch all blog posts (paginated)
 */
export async function getAllPosts(limit = 10, offset = 0): Promise<BlogPost[]> {
  try {
    const query = `*[_type == "post"] | order(publishedAt desc) [${offset}...${offset + limit}] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage {
        asset-> {
          _id,
          _ref,
          _type
        },
        alt
      },
      author-> {
        name,
        image {
          asset-> {
            _id,
            _ref,
            _type
          }
        }
      },
      categories
    }`;

    return await sanityClient.fetch(query);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

/**
 * Fetch a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    publishedAt,
    mainImage {
      asset-> {
        _id,
        _ref,
        _type
      },
      alt
    },
    author-> {
      name,
      bio,
      image {
        asset-> {
          _id,
          _ref,
          _type
        }
      },
      twitter,
      linkedin
    },
    categories,
    body,
    seo {
      metaTitle,
      metaDescription,
      ogImage {
        asset-> {
          _id,
          _ref,
          _type
        }
      }
    }
  }`;

  return sanityClient.fetch(query, { slug });
}

/**
 * Fetch total count of blog posts
 */
export async function getPostCount(): Promise<number> {
  try {
    const query = `count(*[_type == "post"])`;
    return await sanityClient.fetch(query);
  } catch (error) {
    console.error('Error fetching post count:', error);
    return 0;
  }
}

/**
 * Fetch recent posts for sidebar/related content
 */
export async function getRecentPosts(limit = 5): Promise<BlogPost[]> {
  try {
    const query = `*[_type == "post"] | order(publishedAt desc) [0...${limit}] {
      _id,
      title,
      slug,
      excerpt,
      publishedAt,
      mainImage {
        asset-> {
          _id,
          _ref,
          _type
        },
        alt
      },
      author-> {
        name
      }
    }`;

    return await sanityClient.fetch(query);
  } catch (error) {
    console.error('Error fetching recent posts:', error);
    return [];
  }
}

/**
 * Fetch all documentation pages
 */
export async function getAllDocumentation(): Promise<Documentation[]> {
  const query = `*[_type == "documentation"] | order(category asc, order asc) {
    _id,
    title,
    slug,
    category,
    order,
    description
  }`;

  return sanityClient.fetch(query);
}

/**
 * Fetch a single documentation page by slug
 */
export async function getDocumentationBySlug(slug: string): Promise<Documentation | null> {
  const query = `*[_type == "documentation" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    category,
    description,
    content,
    relatedDocs[]-> {
      _id,
      title,
      slug
    }
  }`;

  return sanityClient.fetch(query, { slug });
}

/**
 * Fetch documentation by category
 */
export async function getDocumentationByCategory(category: string): Promise<Documentation[]> {
  const query = `*[_type == "documentation" && category == $category] | order(order asc) {
    _id,
    title,
    slug,
    category,
    order,
    description
  }`;

  return sanityClient.fetch(query, { category });
}
