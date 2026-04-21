/**
 * URL parsing and manipulation utilities
 */

import { KeyValuePair } from '../types';
import { generateId } from './idGenerator';
import { createEmptyKeyValuePair } from './keyValueHelpers';

/**
 * Encodes a string while preserving template variable syntax {{...}}
 */
export function encodePreservingTemplates(str: string): string {
  return encodeURIComponent(str)
    .replace(/%7B%7B/g, '{{')
    .replace(/%7D%7D/g, '}}');
}

/**
 * Synchronizes URL query string with params array
 */
export function syncUrlWithParams(url: string, params: KeyValuePair[]): string {
  const baseUrl = url.split('?')[0];
  const searchParams = params
    .filter(p => p.enabled && p.key)
    .map(p => `${encodePreservingTemplates(p.key)}=${encodePreservingTemplates(p.value)}`)
    .join('&');
  
  return searchParams ? `${baseUrl}?${searchParams}` : baseUrl;
}

/**
 * Extracts path variables from URL (e.g., :userId)
 */
export function extractPathVariables(url: string, currentVars: KeyValuePair[] = []): KeyValuePair[] {
  const pathVarMatches = url.match(/:[a-zA-Z0-9_]+/g);
  
  if (!pathVarMatches) {
    return [];
  }
  
  const uniqueVars = Array.from(new Set(pathVarMatches.map(m => m.substring(1))));
  return uniqueVars.map(key => {
    const existing = currentVars.find(v => v.key === key);
    return existing || { id: generateId(), key, value: '', enabled: true };
  });
}

/**
 * Parses query parameters from URL
 */
export function parseQueryParams(url: string): KeyValuePair[] {
  const parts = url.split('?');
  const queryString = parts.length > 1 ? parts[1] : '';
  
  const params: KeyValuePair[] = [];
  
  if (queryString) {
    const pairs = queryString.split('&');
    pairs.forEach(pair => {
      if (!pair) return;
      const [key, value] = pair.split('=');
      params.push({
        id: generateId(),
        key: decodeURIComponent(key || ''),
        value: decodeURIComponent(value || ''),
        enabled: true,
        type: 'text'
      });
    });
  }
  
  // Always add an empty row at the end
  params.push(createEmptyKeyValuePair());
  
  return params;
}

/**
 * Ensures URL has a protocol prefix
 */
export function ensureProtocol(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}
