/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Code, Play, Info } from 'lucide-react';
import { JavaScriptEditor } from './JavaScriptEditor';

interface ScriptEditorProps {
  preRequestScript: string;
  postResponseScript: string;
  onUpdatePreRequestScript: (script: string) => void;
  onUpdatePostResponseScript: (script: string) => void;
}

export function ScriptEditor({
  preRequestScript,
  postResponseScript,
  onUpdatePreRequestScript,
  onUpdatePostResponseScript
}: ScriptEditorProps) {
  const [activeScriptTab, setActiveScriptTab] = useState<'pre' | 'post'>('pre');

  return (
    <div className="flex flex-col h-full">
      {/* Script Tabs */}
      <div className="flex border-b border-white/5 bg-bg-card/30">
        <button
          onClick={() => setActiveScriptTab('pre')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all ${
            activeScriptTab === 'pre'
              ? 'text-brand-accent border-b-2 border-brand-accent bg-white/[0.02]'
              : 'text-text-dim hover:text-text-main hover:bg-white/[0.02]'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          Pre-request Script
        </button>
        <button
          onClick={() => setActiveScriptTab('post')}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all ${
            activeScriptTab === 'post'
              ? 'text-brand-accent border-b-2 border-brand-accent bg-white/[0.02]'
              : 'text-text-dim hover:text-text-main hover:bg-white/[0.02]'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          Post-response Script
        </button>
      </div>

      {/* Script Content */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {activeScriptTab === 'pre' && (
          <>
            <div className="flex items-center gap-2 text-text-main">
              <Play className="w-4 h-4 text-brand-accent" />
              <h3 className="text-sm font-bold">Pre-request Script</h3>
            </div>
            <div className="p-3 rounded-lg bg-brand-accent/5 border border-brand-accent/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
                <div className="text-xs text-text-dim">
                  <p className="font-bold text-brand-accent mb-1">Available APIs:</p>
                  <p><code className="text-brand-accent">pm.environment.set(key, value)</code> - Set environment variable</p>
                  <p><code className="text-brand-accent">pm.environment.get(key)</code> - Get environment variable</p>
                  <p><code className="text-brand-accent">pm.request.headers.add(key, value)</code> - Add request header</p>
                </div>
              </div>
            </div>
            <JavaScriptEditor
              value={preRequestScript}
              onChange={onUpdatePreRequestScript}
              placeholder="// Pre-request script (JavaScript)
// Example:
// pm.environment.set('timestamp', Date.now().toString());
// pm.request.headers.add('X-Timestamp', pm.environment.get('timestamp'));"
              height="400px"
            />
          </>
        )}

        {activeScriptTab === 'post' && (
          <>
            <div className="flex items-center gap-2 text-text-main">
              <Code className="w-4 h-4 text-brand-accent" />
              <h3 className="text-sm font-bold">Post-response Script</h3>
            </div>
            <div className="p-3 rounded-lg bg-brand-accent/5 border border-brand-accent/20">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-brand-accent mt-0.5 shrink-0" />
                <div className="text-xs text-text-dim">
                  <p className="font-bold text-brand-accent mb-1">Available APIs:</p>
                  <p><code className="text-brand-accent">pm.response.json()</code> - Get response as JSON</p>
                  <p><code className="text-brand-accent">pm.response.text()</code> - Get response as text</p>
                  <p><code className="text-brand-accent">pm.environment.set(key, value)</code> - Set environment variable</p>
                  <p><code className="text-brand-accent">pm.test(name, function)</code> - Add test assertion</p>
                </div>
              </div>
            </div>
            <JavaScriptEditor
              value={postResponseScript}
              onChange={onUpdatePostResponseScript}
              placeholder="// Post-response script (JavaScript)
// Example:
// const response = pm.response.json();
// pm.environment.set('token', response.access_token);
// pm.test('Status is 200', () => pm.response.status === 200);"
              height="400px"
            />
          </>
        )}
      </div>
    </div>
  );
}