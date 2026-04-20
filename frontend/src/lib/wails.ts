/**
 * Wails bridge — wraps all Go backend calls with runtime-ready checks.
 * Falls back gracefully when running outside the desktop app.
 */

export function waitForWails(): Promise<void> {
  return new Promise((resolve) => {
    if ((window as any)?.go?.main?.App) { resolve(); return; }
    const interval = setInterval(() => {
      if ((window as any)?.go?.main?.App) { clearInterval(interval); resolve(); }
    }, 50);
    setTimeout(() => { clearInterval(interval); resolve(); }, 10000);
  });
}

export function isWailsAvailable(): boolean {
  return !!(window as any)?.go?.main?.App;
}

const go = () => (window as any).go.main.App;

// ── Collections ───────────────────────────────────────────────────────────────
export const loadCollections  = (): Promise<any[]>   => go().LoadCollections();
export const saveCollections  = (c: any[]): Promise<void> => go().SaveCollections(c);

// ── Environments ──────────────────────────────────────────────────────────────
export const loadEnvironments = (): Promise<any[]>   => go().LoadEnvironments();
export const saveEnvironments = (e: any[]): Promise<void> => go().SaveEnvironments(e);

// ── History ───────────────────────────────────────────────────────────────────
export const addHistory   = (entry: any): Promise<void>  => go().AddHistory(entry);
export const loadHistory  = (limit = 100): Promise<any[]> => go().LoadHistory(limit);
export const clearHistory = (): Promise<void>             => go().ClearHistory();

// ── KV Store ──────────────────────────────────────────────────────────────────
export const setKV    = (key: string, value: string): Promise<void>   => go().SetKV(key, value);
export const getKV    = (key: string): Promise<string>                 => go().GetKV(key);
export const deleteKV = (key: string): Promise<void>                   => go().DeleteKV(key);

// ── HTTP ──────────────────────────────────────────────────────────────────────
export const sendRequest   = (req: any): Promise<any> => go().SendRequest(req);
export const cancelRequest = (): Promise<void>         => go().CancelRequest();
