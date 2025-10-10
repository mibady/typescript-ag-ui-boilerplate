/**
 * Sanity CMS Configuration
 *
 * Configuration for Sanity Studio integration with Next.js
 */

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '';
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production';
export const apiVersion = '2024-10-10';
export const useCdn = process.env.NODE_ENV === 'production';

export const sanityConfig = {
  projectId,
  dataset,
  apiVersion,
  useCdn,
};
