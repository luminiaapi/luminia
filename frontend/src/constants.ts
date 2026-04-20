/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RequestItem, Collection, HttpMethod, Environment } from './types';

export const COLORS = {
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  brand: 'text-brand-accent bg-brand-accent/10',
  danger: 'text-danger bg-danger/10',
  dim: 'text-text-dim bg-white/5'
};

export function getMethodColor(method: HttpMethod) {
  switch (method) {
    case 'GET': return COLORS.success;
    case 'POST': return COLORS.warning;
    case 'PUT': return COLORS.brand;
    case 'PATCH': return COLORS.brand;
    case 'DELETE': return COLORS.danger;
    default: return COLORS.dim;
  }
}

export const MOCK_HISTORY: RequestItem[] = [
  { id: 'h1', method: 'GET', name: 'Get Current User', url: 'https://api.lumina.io/v1/user/me', timestamp: '2m ago' },
  { id: 'h2', method: 'POST', name: 'Auth Login', url: 'https://api.lumina.io/v1/auth/login', timestamp: '15m ago' },
  { id: 'h3', method: 'PUT', name: 'Update Profile', url: 'https://api.lumina.io/v1/user/profile', timestamp: '1h ago' },
  { id: 'h4', method: 'DELETE', name: 'Revoke Token', url: 'https://api.lumina.io/v1/auth/logout', timestamp: '2h ago' },
];

export const INITIAL_COLLECTIONS: Collection[] = [
  {
    id: 'c1',
    name: 'Auth Service',
    collapsed: false,
    items: [
      { id: 'r1', method: 'POST', name: 'Login', url: 'https://api.vortex.io/v1/auth/login', timestamp: '' },
      { id: 'r2', method: 'GET', name: 'Session', url: 'https://api.vortex.io/v1/auth/session', timestamp: '' },
    ]
  },
  {
    id: 'c2',
    name: 'Payment API',
    collapsed: true,
    items: [
      { id: 'r3', method: 'POST', name: 'Create Transaction', url: 'https://api.vortex.io/v1/pay', timestamp: '' },
      { id: 'r4', method: 'GET', name: 'Verify Payment', url: 'https://api.vortex.io/v1/verify', timestamp: '' },
    ]
  }
];

export const INITIAL_ENVIRONMENTS: Environment[] = [
  {
    id: 'e1',
    name: 'Production',
    variables: [
      { id: 'v1', key: 'base_url', value: 'https://api.lumina.io', enabled: true },
      { id: 'v2', key: 'api_version', value: 'v1', enabled: true },
    ]
  },
  {
    id: 'e2',
    name: 'Development',
    variables: [
      { id: 'v3', key: 'base_url', value: 'http://localhost:3000', enabled: true },
      { id: 'v4', key: 'api_version', value: 'v1-dev', enabled: true },
    ]
  }
];
