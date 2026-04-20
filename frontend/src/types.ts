/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
  type?: 'text' | 'file';
  file?: {
    name: string;
    size: number;
    type: string;
    lastModified: number;
  } | null;
}

export interface RequestItem {
  id: string;
  method: HttpMethod;
  name: string;
  url: string;
  timestamp: string;
  // Full request state — persisted so reopening restores everything
  params?: KeyValuePair[];
  pathVariables?: KeyValuePair[];
  headers?: KeyValuePair[];
  auth?: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKeyName?: string;
    apiKeyValue?: string;
  };
  bodyType?: 'none' | 'json' | 'form-data' | 'urlencoded';
  body?: string;
  bodyFormData?: KeyValuePair[];
  bodyUrlEncoded?: KeyValuePair[];
}

export interface RequestTab {
  id: string;
  method: HttpMethod;
  url: string;
  name: string;
  isDirty?: boolean;
  collectionId?: string;
  params: KeyValuePair[];
  pathVariables?: KeyValuePair[];
  headers: KeyValuePair[];
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    bearerToken?: string;
    username?: string;
    password?: string;
    apiKeyName?: string;
    apiKeyValue?: string;
  };
  bodyType: 'none' | 'json' | 'form-data' | 'urlencoded';
  body: string;
  bodyFormData: KeyValuePair[];
  bodyUrlEncoded: KeyValuePair[];
  response: any | null;
  isSending: boolean;
  abortController?: AbortController | null;
}

export interface Collection {
  id: string;
  name: string;
  items: RequestItem[];
  collapsed: boolean;
  children?: Collection[];
}

export interface EditModalTarget {
  type: 'collection' | 'request' | 'environment';
  id: string;
  name: string;
  parentId?: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: KeyValuePair[];
}

export interface Cookie {
  id: string;
  domain: string;
  name: string;
  value: string;
  path: string;
  expires?: string;
  httpOnly: boolean;
  secure: boolean;
  enabled?: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  url: string | null; // null means Local
  isConnected: boolean;
  isLoggedIn?: boolean;
  status?: 'disconnected' | 'connecting' | 'connected' | 'authenticated';
  userEmail?: string;
  user?: {
    email: string;
    name: string;
  };
}
