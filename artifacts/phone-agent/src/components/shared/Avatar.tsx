import type { Contact } from '@/lib/api';

// Task/Query/Call responses only embed a trimmed-down contact shape, so we
// type against the common subset rather than the full Contact.
export type AvatarSubject = Pick<Contact, 'id' | 'color' | 'initials'>;

export function Avatar({ contact, size = 'md' }: { contact: AvatarSubject; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = size === 'sm' ? 'h-7 w-7 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-sm' : 'h-10 w-10 text-xs';
  return (
    <div
      data-testid={`avatar-${contact.id}`}
      className={`grid shrink-0 place-items-center rounded-full font-bold text-foreground ${sizes}`}
      style={{ background: contact.color }}
    >
      {contact.initials}
    </div>
  );
}
