import { Send, FileCode, Cloud, Moon } from 'lucide-react';

export const IMPORT_OPTIONS = [
  {
    id: 'postman',
    name: 'Postman',
    description: 'Import Postman Collections (v2.0/v2.1)',
    icon: <Send className="w-5 h-5" />,
    color: 'text-orange-400',
    enabled: true
  },
  {
    id: 'openapi',
    name: 'OpenAPI',
    description: 'Import from Swagger or OpenAPI 3.0/3.1',
    icon: <FileCode className="w-5 h-5" />,
    color: 'text-blue-400',
    enabled: false
  },
  {
    id: 'hoppscotch',
    name: 'Hoppscotch',
    description: 'Import Hoppscotch collection JSON files',
    icon: <Cloud className="w-5 h-5" />,
    color: 'text-emerald-400',
    enabled: false
  },
  {
    id: 'insomnia',
    name: 'Insomnia',
    description: 'Import Insomnia export JSON files',
    icon: <Moon className="w-5 h-5" />,
    color: 'text-purple-400',
    enabled: false
  },
] as const;

export type ImportType = typeof IMPORT_OPTIONS[number]['id'];
