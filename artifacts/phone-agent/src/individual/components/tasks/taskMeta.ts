import type * as api from '@/lib/api';

export const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  suggested: { label: 'Suggested',   dot: 'bg-[#f5a623]',  text: 'text-[#995500]' },
  open:       { label: 'Open',       dot: 'bg-[#3b9a83]',  text: 'text-[#216457]' },
  in_progress:{ label: 'In progress',dot: 'bg-[#4168e5]',  text: 'text-[#1f40ad]' },
  done:       { label: 'Done',       dot: 'bg-[#8fba9a]',  text: 'text-[#3d6e4a]' },
  cancelled:  { label: 'Cancelled',  dot: 'bg-[#c9b0a0]',  text: 'text-[#7a5c50]' },
};

export const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-[#ffe5dd] text-[#bd5d47]',
  normal: 'bg-[#edf1ec] text-[#4a7060]',
  low:    'bg-[#f3f0ea] text-[#7a7060]',
};

export const ACTIVE_STATUSES: api.TaskStatus[] = ['suggested', 'open', 'in_progress'];
