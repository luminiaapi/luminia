/**
 * Utilities for working with KeyValuePair arrays
 */

import { KeyValuePair } from '../types';
import { generateId } from './idGenerator';

export function createEmptyKeyValuePair(): KeyValuePair {
  return {
    id: generateId(),
    key: '',
    value: '',
    enabled: true,
    type: 'text'
  };
}

export function ensureEmptyRow(items: KeyValuePair[]): KeyValuePair[] {
  const lastItem = items[items.length - 1];
  if (lastItem && (lastItem.key || lastItem.value)) {
    return [...items, createEmptyKeyValuePair()];
  }
  return items;
}

export function hasContent(item: KeyValuePair): boolean {
  return !!(item.key || item.value);
}
