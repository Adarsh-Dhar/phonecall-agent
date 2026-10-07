import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/shared';
import { usePushSubscription } from '@/hooks/usePushSubscription';

type Pref = { id: string; label: string; description: string; enabled: boolean };

const DEFAULT_PREFS: Pref[] = [
  {
    id: 'concise',
    label: 'Concise responses',
    description: 'Keep answers short and to the point.',
    enabled: true,
  },
  {
    id: 'clarify',
    label: 'Ask clarifying questions',
    description: "Ask before acting if the intent isn't clear.",
    enabled: true,
  },
  {
    id: 'confirm',
    label: 'Confirm before taking action',
    description: 'Always confirm before making calls or changes.',
    enabled: false,
  },
  {
    id: 'notifications',
    label: 'Push notifications',
    description: 'Receive notifications when calls are due or during calls.',
    enabled: false,
  },
];

export function Preferences({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<Pref[]>(DEFAULT_PREFS);
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const { permission, subscribe } = usePushSubscription();

  const toggle = (id: string) =>
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );

  // Load user's timezone on mount
  useEffect(() => {
    apiFetch('/api/user/timezone')
      .then((res) => res.json())
      .then((data) => {
        if (data.timezone) setTimezone(data.timezone);
      })
      .catch(() => {
        // Default to browser timezone
      });
  }, []);

  // Get all available timezones, plus the current one if not in the list
  const allTimezones = Intl.supportedValuesOf('timeZone');
  const timezones = allTimezones.includes(timezone) ? allTimezones : [timezone, ...allTimezones];

  const handleSave = async () => {
    try {
      await apiFetch('/api/user/timezone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone }),
      });
    } catch (err) {
      console.error('Failed to save timezone:', err);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your preferences</h2>
          <button
            type="button"
            data-testid="button-close-preferences"
            onClick={onClose}
            className="rounded-md p-1 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
          >
            <X size={20} />
          </button>
        </div>

        <p className="mb-5 text-sm text-[hsl(var(--muted-foreground))]">
          I'll help you think things through and keep the next step clear. I'm your
          personal admin assistant, ready to help with everyday tasks.
        </p>

        {/* Toggle rows */}
        <div className="space-y-4">
          {prefs.map((pref) => (
            <div
              key={pref.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3"
            >
              <div className="flex-1">
                <Label
                  htmlFor={`pref-${pref.id}`}
                  className="cursor-pointer text-sm font-medium leading-none"
                >
                  {pref.label}
                </Label>
                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                  {pref.description}
                </p>
              </div>
              <Switch
                id={`pref-${pref.id}`}
                checked={pref.enabled}
                onCheckedChange={() => toggle(pref.id)}
              />
            </div>
          ))}
        </div>

        {/* Timezone selector */}
        <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
          <Label htmlFor="timezone" className="text-sm font-medium leading-none">
            Timezone
          </Label>
          <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
            Used for date/time resolution in calls and task extraction
          </p>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="mt-2 w-full rounded-lg border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
          >
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Save */}
        <button
          type="button"
          data-testid="button-save-preferences"
          onClick={handleSave}
          className="mt-6 w-full rounded-xl bg-[#2854cc] py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4] active:translate-y-0"
        >
          Save preferences
        </button>

        {/* Push notification subscription */}
        {prefs.find((p) => p.id === 'notifications')?.enabled && (
          <div className="mt-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
            <p className="text-sm font-medium">Push notifications</p>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              {permission === 'granted' ? 'Notifications enabled' : permission === 'denied' ? 'Notifications blocked' : 'Enable notifications'}
            </p>
            {permission !== 'granted' && (
              <button
                type="button"
                onClick={() => subscribe()}
                className="mt-2 rounded-lg bg-[#2854cc] px-4 py-2 text-xs font-bold text-white hover:bg-[#2148b4]"
              >
                Enable
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
