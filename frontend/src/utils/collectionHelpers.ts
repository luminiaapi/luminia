/**
 * Utilities for working with collection trees
 */

import { Collection } from '../types';

/**
 * Recursively finds a collection by ID in a tree
 */
export function findCollectionById(
  collections: Collection[],
  id: string
): Collection | undefined {
  for (const col of collections) {
    if (col.id === id) return col;
    if (col.children) {
      const found = findCollectionById(col.children, id);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Recursively applies a transformation function to all collections
 */
export function mapCollections(
  collections: Collection[],
  fn: (c: Collection) => Collection
): Collection[] {
  return collections.map(c => {
    const transformed = fn(c);
    return {
      ...transformed,
      children: transformed.children ? mapCollections(transformed.children, fn) : []
    };
  });
}

/**
 * Recursively filters collections from a tree
 */
export function filterCollections(
  collections: Collection[],
  predicate: (c: Collection) => boolean
): Collection[] {
  return collections
    .filter(predicate)
    .map(c => ({
      ...c,
      children: c.children ? filterCollections(c.children, predicate) : []
    }));
}
