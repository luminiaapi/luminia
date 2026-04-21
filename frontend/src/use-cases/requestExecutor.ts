import { RequestTab, Environment, Cookie } from '../types';
import { resolveVariables, resolveKeyValuePairs } from '../lib/variableResolver';
import { waitForWails, isWailsAvailable, sendRequest, addHistory } from '../lib/wails';

export interface ResponseData {
  status: number;
  statusText: string;
  time: string;
  size: string;
  headers: { id: string; key: string; value: string }[];
  body: any;
  error?: string;
  cancelled?: boolean;
}

export interface ExecutionResult {
  response: ResponseData;
}

export async function executeRequest(
  tab: RequestTab,
  environments: Environment[],
  selectedEnvironmentId: string | null,
  allCookies: Cookie[] = [],
  proxySettings: { enabled: boolean; http: string; https: string; socks: string },
  signal?: AbortSignal
): Promise<ExecutionResult> {
  const activeEnv = environments.find(e => e.id === selectedEnvironmentId);
  const envVars = activeEnv?.variables || [];

  // Resolve environment variables
  let resolvedUrl = resolveVariables(tab.url, envVars);

  // Replace path variables (:id, :userId, etc.)
  if (tab.pathVariables) {
    tab.pathVariables.forEach(pv => {
      if (pv.key) resolvedUrl = resolvedUrl.replace(`:${pv.key}`, encodeURIComponent(pv.value));
    });
  }

  const resolvedParams      = resolveKeyValuePairs(tab.params, envVars);
  const resolvedHeaders     = resolveKeyValuePairs(tab.headers, envVars);
  const resolvedBody        = resolveVariables(tab.body, envVars);
  const resolvedFormData    = resolveKeyValuePairs(tab.bodyFormData, envVars);
  const resolvedUrlEncoded  = resolveKeyValuePairs(tab.bodyUrlEncoded, envVars);

  await waitForWails();

  if (!isWailsAvailable()) {
    return {
      response: {
        status: 0, statusText: 'Desktop runtime not available',
        time: '0ms', size: '0B', headers: [], body: '',
        error: 'Not running in desktop app'
      }
    };
  }

  // Abort support — cancel via Go if signal fires
  if (signal) {
    signal.addEventListener('abort', () => {
      import('../lib/wails').then(w => w.cancelRequest()).catch(() => {});
    }, { once: true });
  }

  const result = await sendRequest({
    method: tab.method,
    url: resolvedUrl,
    headers: resolvedHeaders,
    params: resolvedParams,
    auth: tab.auth,
    bodyType: tab.bodyType,
    body: resolvedBody,
    bodyFormData: resolvedFormData,
    bodyUrlEncoded: resolvedUrlEncoded,
    proxy: proxySettings,
  });

  if (result.cancelled) {
    return { response: { ...result, body: '', cancelled: true } };
  }

  // Parse JSON body for pretty display
  let parsedBody: any = result.body;
  try { parsedBody = JSON.parse(result.body); } catch { /* keep as string */ }

  const response: ResponseData = { ...result, body: parsedBody };

  // Persist to history (fire-and-forget)
  addHistory({
    id: Math.random().toString(36).substring(2, 9),
    method: tab.method,
    url: resolvedUrl,
    name: tab.name,
    status: result.status || 0,
    duration: result.time || '',
    timestamp: new Date().toISOString(),
  }).catch(console.error);

  return { response };
}
