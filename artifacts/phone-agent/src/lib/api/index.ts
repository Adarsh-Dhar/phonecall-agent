// Barrel: keeps `import * as api from '@/lib/api'` (and named imports from
// '@/lib/api') working unchanged after the split into per-resource modules.
export * from './contacts';
export * from './conversations';
export * from './history';
export * from './tasks';
export * from './questions';
export * from './knowledge';
export * from './calls';
export * from './googleCalendar';
export * from './gemini';
