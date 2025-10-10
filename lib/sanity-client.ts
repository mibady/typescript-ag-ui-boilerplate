/**
 * Sanity Client
 *
 * Client configuration for fetching data from Sanity CMS
 */

import { createClient } from 'next-sanity';
import { projectId, dataset, apiVersion } from '@/sanity.config';

if (!projectId || !dataset) {
  throw new Error(
    'Missing Sanity configuration. Check that NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET are set.'
  );
}

/**
 * Sanity client for server-side and client-side data fetching
 */
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === 'production',
  perspective: 'published',
  stega: {
    enabled: false,
    studioUrl: '/studio',
  },
});

/**
 * Helper function to get image URL from Sanity image reference
 */
export function imageUrlBuilder(source: any) {
  if (!source || !source.asset) {
    return '';
  }

  const { _ref } = source.asset;
  const [_file, id, dimensions, format] = _ref.split('-');
  const [width, height] = dimensions.split('x');

  return `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${width}x${height}.${format}`;
}
