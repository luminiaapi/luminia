/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeyValuePair } from '../types';

/**
 * Resolves variables in a string using the provided key-value pairs.
 * Searches for {{variable_name}} and replaces it with the corresponding value.
 */
export function resolveVariables(text: string, variables: KeyValuePair[]): string {
  if (!text) return text;
  
  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const variable = variables.find(v => v.key === key.trim() && v.enabled);
    return variable ? variable.value : match;
  });
}

/**
 * Resolves variables for an entire list of key-value pairs.
 */
export function resolveKeyValuePairs(pairs: KeyValuePair[], variables: KeyValuePair[]): KeyValuePair[] {
  return pairs.map(pair => ({
    ...pair,
    key: resolveVariables(pair.key, variables),
    value: resolveVariables(pair.value, variables)
  }));
}
