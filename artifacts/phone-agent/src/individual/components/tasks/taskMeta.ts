import type * as api from '@/lib/api';

export const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  suggested: { label: 'Suggested',   dot: 'bg-[#f5a623]',  text: 'text-[#995500]' },
  open:       { label: 'Open',       dot: 'bg-[#3b9a83]',  text: 'text-[#216457]' },
  in_progress:{ label: 'In progress',dot: 'bg-[#4168e5]',  text: 'text-[#1f40ad]' },
  waiting_user:{ label: 'Waiting on you',dot: 'bg-[#ff9478]',  text: 'text-[#bf4720]' },
  done:       { label: 'Done',       dot: 'bg-[#8fba9a]',  text: 'text-[#3d6e4a]' },
  cancelled:  { label: 'Cancelled',  dot: 'bg-[#c9b0a0]',  text: 'text-[#7a5c50]' },
};

export const PRIORITY_BADGE: Record<string, string> = {
  high:   'bg-[#ffe5dd] text-[#bd5d47]',
  normal: 'bg-[#edf1ec] text-[#4a7060]',
  low:    'bg-[#f3f0ea] text-[#7a7060]',
};

export const KIND_META: Record<string, { label: string; icon: string }> = {
  appointment: { label: 'Appointment', icon: 'calendar' },
  bring: { label: 'Bring', icon: 'briefcase' },
  pay: { label: 'Pay', icon: 'wallet' },
  submit: { label: 'Submit', icon: 'upload' },
  follow_up: { label: 'Follow-up', icon: 'clock' },
  call: { label: 'Call', icon: 'phone' },
  reminder: { label: 'Reminder', icon: 'bell' },
  other: { label: 'Task', icon: 'circle' },
};

export const SCHEDULER_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-[#3b9a83]' },
  claimed: { label: 'Claimed', color: 'text-[#4168e5]' },
  done: { label: 'Done', color: 'text-[#8fba9a]' },
  exhausted: { label: 'Exhausted', color: 'text-[#c9b0a0]' },
  stale: { label: 'Stale', color: 'text-[#f5a623]' },
};

export const WAITING_BADGE = 'bg-[#ff9478] text-white';

export const ACTIVE_STATUSES: api.TaskStatus[] = ['suggested', 'open', 'in_progress', 'waiting_user'];
