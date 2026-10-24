import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { updateContact } from '@/lib/api/contacts';

interface Props {
  contactId: string;
  initialEmail?: string | null;
  initialOptIn?: boolean;
  whatsappReachable?: boolean;
}

export function ContactMessagingCard({ contactId, initialEmail, initialOptIn, whatsappReachable }: Props) {
  const [contactEmail, setContactEmail] = useState(initialEmail || '');
  const [allowFallbackMessage, setAllowFallbackMessage] = useState(initialOptIn || false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateContact(contactId, {
        contactEmail: contactEmail || null,
        allowFallbackMessage,
      });
      toast({ description: 'Messaging settings saved' });
    } catch (error) {
      console.error('Error saving messaging settings:', error);
      toast({ variant: 'destructive', description: 'Failed to save messaging settings' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Messaging if unreachable</p>
      <div className="mt-3 space-y-3">
        <div>
          <Label htmlFor="contact-email" className="text-xs">Contact email (for fallback messages)</Label>
          <Input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="desk@clinic.com"
            className="mt-1.5 h-8 text-sm"
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <Label htmlFor="allow-fallback" className="cursor-pointer text-xs font-medium leading-none">
              Message if unreachable
            </Label>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Send an email or WhatsApp message when the agent can't reach this contact. Requires at least one valid email or phone.
            </p>
          </div>
          <Switch
            id="allow-fallback"
            checked={allowFallbackMessage}
            onCheckedChange={setAllowFallbackMessage}
          />
        </div>
        {whatsappReachable && (
          <p className="text-[10px] text-muted-foreground">
            WhatsApp is available for this contact.
          </p>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-lg bg-[#2854cc] py-2 text-xs font-bold text-white hover:bg-[#2148b4] disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
