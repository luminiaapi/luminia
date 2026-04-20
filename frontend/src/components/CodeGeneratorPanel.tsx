/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Copy, Check, Terminal, Code2, Globe } from 'lucide-react';
import { RequestTab } from '../types';
import { generateCurl, generateFetch, generateAxios, generatePowerShell, generatePython } from '../utils/codeGenerators';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeGeneratorPanelProps {
  tab: RequestTab;
}

type Language = 'curl' | 'fetch' | 'axios' | 'python' | 'powershell';

export function CodeGeneratorPanel({ tab }: CodeGeneratorPanelProps) {
  const [language, setLanguage] = useState<Language>('curl');
  const [copied, setCopied] = useState(false);

  const getCode = () => {
    switch (language) {
      case 'curl': return generateCurl(tab);
      case 'fetch': return generateFetch(tab);
      case 'axios': return generateAxios(tab);
      case 'python': return generatePython(tab);
      case 'powershell': return generatePowerShell(tab);
      default: return '';
    }
  };

  const getLanguageName = () => {
    switch (language) {
      case 'curl': return 'bash';
      case 'fetch': return 'javascript';
      case 'axios': return 'javascript';
      case 'python': return 'python';
      case 'powershell': return 'powershell';
      default: return 'text';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const languages: { id: Language; name: string; icon: any }[] = [
    { id: 'curl', name: 'cURL', icon: Terminal },
    { id: 'fetch', name: 'JS Fetch', icon: Globe },
    { id: 'axios', name: 'JS Axios', icon: Code2 },
    { id: 'python', name: 'Python', icon: Terminal },
    { id: 'powershell', name: 'PowerShell', icon: Terminal },
  ];

  return (
    <div className="flex flex-col h-full bg-bg-deep rounded-2xl border border-white/5 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.01]">
        <div className="flex gap-2">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                language === lang.id
                  ? 'bg-brand-accent/20 border-brand-accent/50 text-brand-accent'
                  : 'bg-white/5 border-transparent text-text-dim hover:bg-white/10'
              }`}
            >
              <lang.icon className="w-3 h-3" />
              {lang.name}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-text-dim hover:text-white"
        >
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          <span className="text-xs font-bold">{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-bg-deep custom-scrollbar">
        <SyntaxHighlighter
          language={getLanguageName()}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: '2rem',
            fontSize: '13px',
            lineHeight: '1.6',
            background: 'transparent',
            fontFamily: '"JetBrains Mono", monospace',
          }}
          showLineNumbers
          lineNumberStyle={{ minWidth: '2.5rem', paddingRight: '1.5rem', color: '#3F3F46', textAlign: 'right', opacity: 0.5 }}
        >
          {getCode()}
        </SyntaxHighlighter>
      </div>
      
      <div className="p-4 bg-white/[0.01] border-t border-white/5">
        <p className="text-[11px] text-text-dim italic text-center">
          Code snippets are generated based on the current request state. Ensure you've documented all headers and body requirements.
        </p>
      </div>
    </div>
  );
}
