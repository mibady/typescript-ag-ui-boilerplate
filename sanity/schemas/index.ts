/**
 * Sanity Schema Index
 *
 * Exports all schema definitions for Sanity Studio
 */

import author from './author';
import post from './blog-post';
import documentation from './documentation';

export const schemaTypes = [author, post, documentation];
