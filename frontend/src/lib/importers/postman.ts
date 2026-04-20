import { Collection, RequestItem, KeyValuePair } from '../../types';

// ── Postman v2.0 / v2.1 types ─────────────────────────────────────────────────

interface PostmanUrl {
  raw?: string;
  host?: string[];
  path?: string[];
  query?: { key: string; value: string; disabled?: boolean }[];
  variable?: { key: string; value: string }[];
}

interface PostmanHeader {
  key: string;
  value: string;
  disabled?: boolean;
  type?: string;
}

interface PostmanBody {
  mode?: string;
  raw?: string;
  urlencoded?: { key: string; value: string; disabled?: boolean }[];
  formdata?: { key: string; value: string; disabled?: boolean; type?: string }[];
  options?: { raw?: { language?: string } };
}

interface PostmanAuth {
  type: string;
  bearer?: { key: string; value: string }[];
  basic?: { key: string; value: string }[];
  apikey?: { key: string; value: string }[];
}

interface PostmanRequest {
  method?: string;
  header?: PostmanHeader[];
  body?: PostmanBody;
  url?: string | PostmanUrl;
  auth?: PostmanAuth;
}

interface PostmanItem {
  name: string;
  request?: PostmanRequest;
  item?: PostmanItem[]; // folder
  response?: any[];
}

interface PostmanCollection {
  info?: { name?: string; schema?: string };
  item?: PostmanItem[];
  variable?: { key: string; value: string; enabled?: boolean }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).substring(2, 11);
}

function resolveUrl(url: string | PostmanUrl | undefined): string {
  if (!url) return '';
  if (typeof url === 'string') return url;
  return url.raw || '';
}

function parseHeaders(headers?: PostmanHeader[]): KeyValuePair[] {
  const result: KeyValuePair[] = (headers || []).map(h => ({
    id: uid(),
    key: h.key || '',
    value: h.value || '',
    enabled: !h.disabled,
    type: 'text' as const,
  }));
  result.push({ id: uid(), key: '', value: '', enabled: true, type: 'text' });
  return result;
}

function parseQueryParams(url: string | PostmanUrl | undefined): KeyValuePair[] {
  const result: KeyValuePair[] = [];
  if (url && typeof url !== 'string' && url.query) {
    for (const q of url.query) {
      result.push({
        id: uid(),
        key: q.key || '',
        value: q.value || '',
        enabled: !q.disabled,
        type: 'text',
      });
    }
  }
  result.push({ id: uid(), key: '', value: '', enabled: true, type: 'text' });
  return result;
}

function parsePathVariables(url: string | PostmanUrl | undefined): KeyValuePair[] {
  if (!url || typeof url === 'string') return [];
  return (url.variable || []).map(v => ({
    id: uid(),
    key: v.key || '',
    value: v.value || '',
    enabled: true,
  }));
}

function parseAuth(auth?: PostmanAuth): RequestItem['auth'] {
  if (!auth) return { type: 'none' };
  switch (auth.type) {
    case 'bearer': {
      const token = auth.bearer?.find(b => b.key === 'token')?.value || '';
      return { type: 'bearer', bearerToken: token };
    }
    case 'basic': {
      const username = auth.basic?.find(b => b.key === 'username')?.value || '';
      const password = auth.basic?.find(b => b.key === 'password')?.value || '';
      return { type: 'basic', username, password };
    }
    case 'apikey': {
      const name = auth.apikey?.find(b => b.key === 'key')?.value || '';
      const value = auth.apikey?.find(b => b.key === 'value')?.value || '';
      return { type: 'apikey', apiKeyName: name, apiKeyValue: value };
    }
    case 'noauth':
    default:
      return { type: 'none' };
  }
}

function parseBody(body?: PostmanBody): Pick<RequestItem, 'bodyType' | 'body' | 'bodyFormData' | 'bodyUrlEncoded'> {
  if (!body || body.mode === 'none' || !body.mode) {
    return { bodyType: 'none', body: '', bodyFormData: [], bodyUrlEncoded: [] };
  }
  switch (body.mode) {
    case 'raw':
      return {
        bodyType: 'json',
        body: body.raw || '',
        bodyFormData: [{ id: uid(), key: '', value: '', enabled: true, type: 'text' }],
        bodyUrlEncoded: [{ id: uid(), key: '', value: '', enabled: true, type: 'text' }],
      };
    case 'urlencoded': {
      const pairs: KeyValuePair[] = (body.urlencoded || []).map(p => ({
        id: uid(), key: p.key || '', value: p.value || '', enabled: !p.disabled, type: 'text',
      }));
      pairs.push({ id: uid(), key: '', value: '', enabled: true, type: 'text' });
      return { bodyType: 'urlencoded', body: '', bodyFormData: [], bodyUrlEncoded: pairs };
    }
    case 'formdata': {
      const pairs: KeyValuePair[] = (body.formdata || []).map(p => ({
        id: uid(), key: p.key || '', value: p.value || '', enabled: !p.disabled, type: 'text',
      }));
      pairs.push({ id: uid(), key: '', value: '', enabled: true, type: 'text' });
      return { bodyType: 'form-data', body: '', bodyFormData: pairs, bodyUrlEncoded: [] };
    }
    default:
      return { bodyType: 'none', body: '', bodyFormData: [], bodyUrlEncoded: [] };
  }
}

function convertItem(item: PostmanItem, collectionId: string): { request?: RequestItem; folder?: Collection } {
  // It's a folder if it has sub-items
  if (item.item && item.item.length >= 0 && !item.request) {
    const folderId = uid();
    const children: Collection[] = [];
    const requests: RequestItem[] = [];

    for (const child of item.item || []) {
      const converted = convertItem(child, folderId);
      if (converted.folder) children.push(converted.folder);
      if (converted.request) requests.push(converted.request);
    }

    return {
      folder: {
        id: folderId,
        name: item.name,
        collapsed: false,
        items: requests,
        children,
      },
    };
  }

  // It's a request
  const req = item.request;
  const method = (req?.method || 'GET').toUpperCase();
  const url = resolveUrl(req?.url);
  const headers = parseHeaders(req?.header);
  const params = parseQueryParams(req?.url);
  const pathVariables = parsePathVariables(req?.url);
  const auth = parseAuth(req?.auth);
  const bodyData = parseBody(req?.body);

  const requestItem: RequestItem = {
    id: uid(),
    name: item.name,
    method: method as any,
    url,
    timestamp: new Date().toISOString(),
    headers,
    params,
    pathVariables,
    auth,
    ...bodyData,
  };

  return { request: requestItem };
}

// ── Main export ───────────────────────────────────────────────────────────────

export function importPostmanCollection(json: string): Collection {
  const data: PostmanCollection = JSON.parse(json);
  const name = data.info?.name || 'Imported Collection';
  const rootId = uid();

  const items: RequestItem[] = [];
  const children: Collection[] = [];

  for (const item of data.item || []) {
    const converted = convertItem(item, rootId);
    if (converted.folder) children.push(converted.folder);
    if (converted.request) items.push(converted.request);
  }

  return {
    id: rootId,
    name,
    collapsed: false,
    items,
    children,
  };
}
