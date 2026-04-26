/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeyValuePair, Environment, Collection } from '../types';

/**
 * Resolves variables with three-tier priority system:
 * 1. Selected Environment (highest priority)
 * 2. Collection Environment 
 * 3. Global Environment (lowest priority)
 */
export function resolveVariablesWithScope(
  text: string, 
  environments: Environment[],
  selectedEnvironmentId: string | null,
  currentCollection: Collection | null
): string {
  if (!text) return text;
  
  const mergedVariables = getMergedVariables(environments, selectedEnvironmentId, currentCollection);
  
  return text.replace(/\{\{(.*?)\}\}/g, (match, key) => {
    const variable = mergedVariables.find(v => v.key === key.trim() && v.enabled);
    return variable ? variable.value : match;
  });
}

/**
 * Get merged variables with proper priority resolution
 */
export function getMergedVariables(
  environments: Environment[],
  selectedEnvironmentId: string | null,
  currentCollection: Collection | null
): KeyValuePair[] {
  const variableMap = new Map<string, KeyValuePair>();
  
  // 1. Start with Global environment (lowest priority)
  const globalEnv = environments.find(e => e.scope === 'global' || (!e.scope && e.name.toLowerCase().includes('global')));
  if (globalEnv) {
    globalEnv.variables.forEach(v => {
      if (v.enabled && v.key) {
        variableMap.set(v.key, v);
      }
    });
  }
  
  // 2. Override with Collection variables (medium priority)
  if (currentCollection?.variables) {
    currentCollection.variables.forEach(v => {
      if (v.enabled && v.key) {
        variableMap.set(v.key, v);
      }
    });
  }
  
  // 3. Override with Selected environment (highest priority)
  if (selectedEnvironmentId) {
    const selectedEnv = environments.find(e => e.id === selectedEnvironmentId);
    if (selectedEnv) {
      selectedEnv.variables.forEach(v => {
        if (v.enabled && v.key) {
          variableMap.set(v.key, v);
        }
      });
    }
  }
  
  return Array.from(variableMap.values());
}

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

/**
 * Resolves variables for key-value pairs with scope support
 */
export function resolveKeyValuePairsWithScope(
  pairs: KeyValuePair[], 
  environments: Environment[],
  selectedEnvironmentId: string | null,
  currentCollection: Collection | null
): KeyValuePair[] {
  const mergedVariables = getMergedVariables(environments, selectedEnvironmentId, currentCollection);
  return resolveKeyValuePairs(pairs, mergedVariables);
}
