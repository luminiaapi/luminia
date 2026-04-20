/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { KeyValuePair, RequestTab, Environment } from '../types';
import { KeyValueEditor } from './KeyValueEditor';
import { FileJson, List, Hash, Ban } from 'lucide-react';
import { SegmentedControl } from './SegmentedControl';
import { VariableInput } from './VariableInput';

interface BodyEditorProps {
  bodyType: RequestTab['bodyType'];
  body: string;
  bodyFormData: KeyValuePair[];
  bodyUrlEncoded: KeyValuePair[];
  onUpdate: (updates: Partial<RequestTab>) => void;
  onUpdateKeyValuePair: (field: 'bodyFormData' | 'bodyUrlEncoded', id: string, updates: Partial<KeyValuePair>) => void;
  onRemoveKeyValuePair: (field: 'bodyFormData' | 'bodyUrlEncoded', id: string) => void;
  onAddKeyValuePair: (field: 'bodyFormData' | 'bodyUrlEncoded') => void;
  environments: Environment[];
  selectedEnvironmentId: string | null;
}

export function BodyEditor({ 
  bodyType, 
  body, 
  bodyFormData, 
  bodyUrlEncoded, 
  onUpdate,
  onUpdateKeyValuePair,
  onRemoveKeyValuePair,
  onAddKeyValuePair,
  environments,
  selectedEnvironmentId
}: BodyEditorProps) {
  const bodyTypes = [
    { id: 'none', label: 'None', icon: <Ban className="w-3.5 h-3.5" /> },
    { id: 'json', label: 'JSON', icon: <FileJson className="w-3.5 h-3.5" /> },
    { id: 'form-data', label: 'Form Data', icon: <List className="w-3.5 h-3.5" /> },
    { id: 'urlencoded', label: 'x-www-form-urlencoded', icon: <Hash className="w-3.5 h-3.5" /> },
  ] as const;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Type Selector */}
      <SegmentedControl 
        options={bodyTypes}
        value={bodyType}
        onChange={(val) => onUpdate({ bodyType: val })}
        className="self-start"
      />

      <div className="flex-1 min-h-[300px] h-full">
        {bodyType === 'none' && (
          <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl opacity-40">
            <Ban className="w-12 h-12 mb-4" />
            <p className="text-sm italic">This request has no body.</p>
          </div>
        )}

        {bodyType === 'json' && (
          <div className="flex flex-col min-h-[300px] bg-bg-deep rounded-2xl border border-white/5">
            <div className="p-3 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">JSON RAW Editor</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    try {
                      onUpdate({ body: JSON.stringify(JSON.parse(body), null, 2) });
                    } catch (e) {
                      // handle invalid json
                    }
                  }}
                  className="px-2 py-1 text-[9px] font-bold bg-brand-accent/10 text-brand-accent rounded hover:bg-brand-accent/20 transition-all uppercase"
                >
                  Beautify
                </button>
              </div>
            </div>
            <VariableInput
              multiline
              language="json"
              value={body}
              onChange={(val) => onUpdate({ body: val })}
              environments={environments}
              selectedEnvironmentId={selectedEnvironmentId}
              placeholder='{ "key": "value" }'
              className="flex-1"
            />
          </div>
        )}

        {bodyType === 'form-data' && (
          <KeyValueEditor 
            title="Form Data" 
            items={bodyFormData}
            onUpdate={(id, up) => onUpdateKeyValuePair('bodyFormData', id, up)}
            onRemove={(id) => onRemoveKeyValuePair('bodyFormData', id)}
            onAdd={() => onAddKeyValuePair('bodyFormData')}
            showTypeSelector
            environments={environments}
            selectedEnvironmentId={selectedEnvironmentId}
          />
        )}

        {bodyType === 'urlencoded' && (
          <KeyValueEditor 
            title="Url Encoded" 
            items={bodyUrlEncoded}
            onUpdate={(id, up) => onUpdateKeyValuePair('bodyUrlEncoded', id, up)}
            onRemove={(id) => onRemoveKeyValuePair('bodyUrlEncoded', id)}
            onAdd={() => onAddKeyValuePair('bodyUrlEncoded')}
            environments={environments}
            selectedEnvironmentId={selectedEnvironmentId}
          />
        )}
      </div>
    </div>
  );
}
