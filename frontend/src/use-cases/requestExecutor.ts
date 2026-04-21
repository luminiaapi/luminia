import { RequestTab, Environment, Cookie } from '../types';
import { resolveVariables, resolveKeyValuePairs } from '../lib/variableResolver';
import { waitForWails, isWailsAvailable, sendRequest, addHistory } from '../lib/wails';
import { ScriptEngine } from '../lib/scriptEngine';

export interface ResponseData {
  status: number;
  statusText: string;
  time: string;
  size: string;
  headers: { id: string; key: string; value: string }[];
  body: any;
  cookies?: { id: string; name: string; value: string; domain: string; path: string; expires: string; httpOnly: boolean; secure: boolean }[];
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
  onEnvironmentUpdate: (id: string, updates: Partial<Environment>) => void,
  signal?: AbortSignal
): Promise<ExecutionResult> {
  const activeEnv = environments.find(e => e.id === selectedEnvironmentId);
  const envVars = activeEnv?.variables || [];

  // Create script engine
  const scriptEngine = new ScriptEngine(environments, selectedEnvironmentId, onEnvironmentUpdate);

  // Execute pre-request script
  let resolvedHeaders = resolveKeyValuePairs(tab.headers, envVars);
  if (tab.preRequestScript) {
    const preScriptResult = await scriptEngine.executePreRequestScript(tab.preRequestScript, resolvedHeaders);
    if (!preScriptResult.success) {
      return {
        response: {
          status: 0,
          statusText: 'Pre-request script failed',
          time: '0ms',
          size: '0B',
          headers: [],
          body: '',
          error: `Pre-request script error: ${preScriptResult.error}`
        }
      };
    }
    if (preScriptResult.updatedHeaders) {
      resolvedHeaders = preScriptResult.updatedHeaders;
    }
  }

  // Resolve environment variables
  let resolvedUrl = resolveVariables(tab.url, envVars);

  // Replace path variables (:id, :userId, etc.)
  if (tab.pathVariables) {
    tab.pathVariables.forEach(pv => {
      if (pv.key) resolvedUrl = resolvedUrl.replace(`:${pv.key}`, encodeURIComponent(pv.value));
    });
  }

  const resolvedParams      = resolveKeyValuePairs(tab.params, envVars);
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

  // Filter cookies that match the request domain
  const requestUrl = new URL(resolvedUrl.startsWith('http') ? resolvedUrl : `https://${resolvedUrl}`);
  const matchingCookies = allCookies.filter(cookie => {
    if (!cookie.enabled) return false;
    // Check if cookie domain matches request domain
    const cookieDomain = cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain;
    const requestDomain = requestUrl.hostname;
    return requestDomain === cookieDomain || requestDomain.endsWith('.' + cookieDomain);
  });

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
    cookies: matchingCookies,
  });

  if (result.cancelled) {
    return { response: { ...result, body: '', cancelled: true } };
  }

  // Parse JSON body for pretty display
  let parsedBody: any = result.body;
  try { parsedBody = JSON.parse(result.body); } catch { /* keep as string */ }

  const response: ResponseData = { ...result, body: parsedBody };

  // Execute post-response script
  if (tab.postResponseScript) {
    const postScriptResult = await scriptEngine.executePostResponseScript(tab.postResponseScript, response);
    if (!postScriptResult.success) {
      console.error('Post-response script failed:', postScriptResult.error);
    }
    if (postScriptResult.testResults) {
      console.log('Test results:', postScriptResult.testResults);
      // You could add test results to the response here if needed
    }
  }

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
