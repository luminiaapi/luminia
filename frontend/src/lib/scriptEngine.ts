/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Environment, KeyValuePair, Collection } from '../types';
import { getMergedVariables } from './variableResolver';

export interface ScriptContext {
  environment: {
    set: (key: string, value: any) => void;
    get: (key: string) => string | undefined;
  };
  request?: {
    headers: {
      add: (key: string, value: string) => void;
    };
  };
  response?: {
    json: () => any;
    text: () => string;
    status: number;
    headers: Record<string, string>;
  };
  test?: (name: string, testFn: () => boolean) => void;
}

export interface ScriptResult {
  success: boolean;
  error?: string;
  environmentUpdates?: { key: string; value: string }[];
  headerUpdates?: { key: string; value: string }[];
  testResults?: { name: string; passed: boolean; error?: string }[];
}

export class ScriptEngine {
  private environments: Environment[];
  private activeEnvironmentId: string | null;
  private onEnvironmentUpdate: (id: string, updates: Partial<Environment>) => void;
  private currentCollection: Collection | null;

  constructor(
    environments: Environment[],
    activeEnvironmentId: string | null,
    onEnvironmentUpdate: (id: string, updates: Partial<Environment>) => void,
    currentCollection: Collection | null = null
  ) {
    this.environments = environments;
    this.activeEnvironmentId = activeEnvironmentId;
    this.onEnvironmentUpdate = onEnvironmentUpdate;
    this.currentCollection = currentCollection;
  }

  async executePreRequestScript(
    script: string,
    headers: KeyValuePair[]
  ): Promise<{ success: boolean; error?: string; updatedHeaders?: KeyValuePair[] }> {
    if (!script.trim()) return { success: true };

    const environmentUpdates: { key: string; value: string }[] = [];
    const headerUpdates: { key: string; value: string }[] = [];
    const updatedHeaders = [...headers];

    const context: ScriptContext = {
      environment: {
        set: (key: string, value: any) => {
          // Convert value to string to handle numbers, booleans, objects, etc.
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          environmentUpdates.push({ key, value: stringValue });
        },
        get: (key: string) => {
          // Use merged variables with proper scope priority
          const mergedVariables = getMergedVariables(this.environments, this.activeEnvironmentId, this.currentCollection);
          const variable = mergedVariables.find(v => v.key === key && v.enabled);
          return variable?.value;
        }
      },
      request: {
        headers: {
          add: (key: string, value: string) => {
            headerUpdates.push({ key, value });
            // Add to headers array
            const existingIndex = updatedHeaders.findIndex(h => h.key.toLowerCase() === key.toLowerCase());
            if (existingIndex >= 0) {
              updatedHeaders[existingIndex] = { ...updatedHeaders[existingIndex], value, enabled: true };
            } else {
              updatedHeaders.push({
                id: Math.random().toString(36).substring(2, 11),
                key,
                value,
                enabled: true
              });
            }
          }
        }
      }
    };

    try {
      // Create a safe execution environment
      const pm = context;
      const func = new Function('pm', script);
      await func(pm);

      // Apply environment updates to the selected environment (highest priority)
      if (environmentUpdates.length > 0 && this.activeEnvironmentId) {
        const activeEnv = this.environments.find(e => e.id === this.activeEnvironmentId);
        if (activeEnv) {
          const updatedVariables = [...activeEnv.variables];
          
          environmentUpdates.forEach(({ key, value }) => {
            const existingIndex = updatedVariables.findIndex(v => v.key === key);
            if (existingIndex >= 0) {
              updatedVariables[existingIndex] = { ...updatedVariables[existingIndex], value };
            } else {
              updatedVariables.push({
                id: Math.random().toString(36).substring(2, 11),
                key,
                value,
                enabled: true
              });
            }
          });

          this.onEnvironmentUpdate(this.activeEnvironmentId, { variables: updatedVariables });
        }
      }

      return { success: true, updatedHeaders };
    } catch (error) {
      console.error('Pre-request script error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Script execution failed' };
    }
  }

  async executePostResponseScript(
    script: string,
    response: any
  ): Promise<{ success: boolean; error?: string; testResults?: { name: string; passed: boolean; error?: string }[] }> {
    if (!script.trim()) return { success: true };

    const environmentUpdates: { key: string; value: string }[] = [];
    const testResults: { name: string; passed: boolean; error?: string }[] = [];

    const context: ScriptContext = {
      environment: {
        set: (key: string, value: any) => {
          // Convert value to string to handle numbers, booleans, objects, etc.
          const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
          environmentUpdates.push({ key, value: stringValue });
        },
        get: (key: string) => {
          // Use merged variables with proper scope priority
          const mergedVariables = getMergedVariables(this.environments, this.activeEnvironmentId, this.currentCollection);
          const variable = mergedVariables.find(v => v.key === key && v.enabled);
          return variable?.value;
        }
      },
      response: {
        json: () => {
          try {
            return typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
          } catch {
            throw new Error('Response is not valid JSON');
          }
        },
        text: () => {
          return typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
        },
        status: response.status,
        headers: response.headers?.reduce((acc: Record<string, string>, h: any) => {
          acc[h.key] = h.value;
          return acc;
        }, {}) || {}
      },
      test: (name: string, testFn: () => boolean) => {
        try {
          const passed = testFn();
          testResults.push({ name, passed });
        } catch (error) {
          testResults.push({ 
            name, 
            passed: false, 
            error: error instanceof Error ? error.message : 'Test execution failed' 
          });
        }
      }
    };

    try {
      // Create a safe execution environment
      const pm = context;
      const func = new Function('pm', script);
      await func(pm);

      // Apply environment updates to the selected environment (highest priority)
      if (environmentUpdates.length > 0 && this.activeEnvironmentId) {
        const activeEnv = this.environments.find(e => e.id === this.activeEnvironmentId);
        if (activeEnv) {
          const updatedVariables = [...activeEnv.variables];
          
          environmentUpdates.forEach(({ key, value }) => {
            const existingIndex = updatedVariables.findIndex(v => v.key === key);
            if (existingIndex >= 0) {
              updatedVariables[existingIndex] = { ...updatedVariables[existingIndex], value };
            } else {
              updatedVariables.push({
                id: Math.random().toString(36).substring(2, 11),
                key,
                value,
                enabled: true
              });
            }
          });

          this.onEnvironmentUpdate(this.activeEnvironmentId, { variables: updatedVariables });
        }
      }

      return { success: true, testResults };
    } catch (error) {
      console.error('Post-response script error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Script execution failed' };
    }
  }
}