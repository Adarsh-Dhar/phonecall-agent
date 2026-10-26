import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/shared';
import { usePushSubscription } from '@/individual/hooks/usePushSubscription';
import { AgentAutonomySettings } from './AgentAutonomySettings';

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
];

export function Preferences({ onClose }: { onClose: () => void }) {
  const [prefs, setPrefs] = useState<Pref[]>(DEFAULT_PREFS);
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [timezone, setTimezone] = useState<string>(browserTimezone);
  const [quietHoursStart, setQuietHoursStart] = useState<number | null>(null);
  const [quietHoursEnd, setQuietHoursEnd] = useState<number | null>(null);
  const [agentMode, setAgentMode] = useState(false);
  const [emailFallback, setEmailFallback] = useState(true);
  const [declineDelayMin, setDeclineDelayMin] = useState(30);
  const [declineMaxRetries, setDeclineMaxRetries] = useState(2);
  const [ownerResponseTimeoutSec, setOwnerResponseTimeoutSec] = useState(60);
  const { permission, subscribe } = usePushSubscription();

  const toggle = (id: string) =>
    setPrefs((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p)),
    );

  // Load user's timezone and quiet hours on mount
  useEffect(() => {
    apiFetch('/api/user/timezone')
      .then((res) => res.json())
      .then((data) => {
        if (data.timezone) {
          setTimezone(data.timezone);
        } else {
          // First login: auto-save browser timezone
          setTimezone(browserTimezone);
          apiFetch('/api/user/timezone', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timezone: browserTimezone }),
          }).catch((err) => {
            console.error('Failed to auto-save timezone:', err);
          });
        }
      })
      .catch(() => {
        // Default to browser timezone
        setTimezone(browserTimezone);
      });

    apiFetch('/api/user/agent-mode')
      .then((res) => res.json())
      .then((data) => setAgentMode(data.enabled === true))
      .catch(() => {
        // Default to off
      });

    apiFetch('/api/user/quiet-hours')
      .then((res) => res.json())
      .then((data) => {
        setQuietHoursStart(data.quietHoursStart);
        setQuietHoursEnd(data.quietHoursEnd);
      })
      .catch(() => {
        // Default to no quiet hours
      });

    apiFetch('/api/user/email-fallback')
      .then((res) => res.json())
      .then((data) => setEmailFallback(data.enabled ?? true))
      .catch(() => {
        // Default to enabled
      });

    apiFetch('/api/user/decline-retry')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.delayMin === 'number') setDeclineDelayMin(data.delayMin);
        if (typeof data.maxRetries === 'number') setDeclineMaxRetries(data.maxRetries);
      })
      .catch(() => {
        // Keep defaults (30 min, 2 recalls)
      });

    apiFetch('/api/user/response-style')
      .then((res) => res.json())
      .then((data) => {
        setPrefs((prev) =>
          prev.map((p) => {
            if (p.id === 'concise') return { ...p, enabled: data.concise ?? true };
            if (p.id === 'clarify') return { ...p, enabled: data.askClarifying ?? true };
            if (p.id === 'confirm') return { ...p, enabled: data.confirmBeforeAction ?? false };
            return p;
          })
        );
      })
      .catch(() => {
        // Keep defaults
      });

    apiFetch('/api/user/owner-response-timeout')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.timeoutSec === 'number') setOwnerResponseTimeoutSec(data.timeoutSec);
      })
      .catch(() => {
        // Keep default (60 seconds)
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

      await apiFetch('/api/user/quiet-hours', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quietHoursStart, quietHoursEnd }),
      });

      await apiFetch('/api/user/agent-mode', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: agentMode }),
      });

      await apiFetch('/api/user/decline-retry', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delayMin: declineDelayMin, maxRetries: declineMaxRetries }),
      });

      await apiFetch('/api/user/email-fallback', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: emailFallback }),
      });

      const concisePref = prefs.find((p) => p.id === 'concise');
      const clarifyPref = prefs.find((p) => p.id === 'clarify');
      const confirmPref = prefs.find((p) => p.id === 'confirm');

      await apiFetch('/api/user/response-style', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concise: concisePref?.enabled,
          askClarifying: clarifyPref?.enabled,
          confirmBeforeAction: confirmPref?.enabled,
        }),
      });

      await apiFetch('/api/user/owner-response-timeout', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timeoutSec: ownerResponseTimeoutSec }),
      });
    } catch (err) {
      console.error('Failed to save preferences:', err);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between flex-shrink-0">
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

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6">
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

          {/* Agent mode (master switch) */}
          <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
            <div className="flex-1">
              <Label htmlFor="pref-agent-mode" className="cursor-pointer text-sm font-medium leading-none">
                Agent mode
              </Label>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                Your AI agent places your scheduled calls and answers business calls for you, with no action from you,
                even when you're offline. You can still watch live and review every transcript. Turn off to be
                asked first (you get a notification when a call is due and calls ring for you).
              </p>
            </div>
            <Switch
              id="pref-agent-mode"
              data-testid="switch-agent-mode"
              checked={agentMode}
              onCheckedChange={setAgentMode}
            />
          </div>

          {/* Standing rules, agent summary and learned lessons (agent mode) */}
          {agentMode && <AgentAutonomySettings />}

          {/* When a business rejects the agent's call */}
          {agentMode && (
            <div className="mt-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3" data-testid="decline-retry-settings">
              <Label className="text-sm font-medium leading-none">If a business rejects the call</Label>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                Your agent waits, calls again, and after the last recall stops and tells you the business is not responding.
              </p>
              <div className="mt-2 flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="decline-delay" className="text-xs">Call again after</Label>
                  <select
                    id="decline-delay"
                    value={declineDelayMin}
                    onChange={(e) => setDeclineDelayMin(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                  >
                    {[
                      [5, '5 minutes'], [15, '15 minutes'], [30, '30 minutes'], [60, '1 hour'],
                      [120, '2 hours'], [240, '4 hours'], [480, '8 hours'], [1440, '1 day'],
                    ].map(([m, label]) => (
                      <option key={m} value={m}>{label}</option>
                    ))}
                    {![5, 15, 30, 60, 120, 240, 480, 1440].includes(declineDelayMin) && (
                      <option value={declineDelayMin}>{declineDelayMin} minutes</option>
                    )}
                  </select>
                </div>
                <div className="flex-1">
                  <Label htmlFor="decline-retries" className="text-xs">Recall up to</Label>
                  <select
                    id="decline-retries"
                    value={declineMaxRetries}
                    onChange={(e) => setDeclineMaxRetries(parseInt(e.target.value))}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                  >
                    {[0, 1, 2, 3, 4, 5, 10].map((n) => (
                      <option key={n} value={n}>{n === 0 ? 'Never recall' : `${n} time${n === 1 ? '' : 's'}`}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

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

          {/* Quiet hours selector */}
          <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
            <Label className="text-sm font-medium leading-none">
              Quiet hours
            </Label>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              Don't trigger call notifications during these hours (0-23). Leave empty to disable.
            </p>
            <div className="mt-2 flex gap-2">
              <div className="flex-1">
                <Label htmlFor="quiet-start" className="text-xs">Start hour</Label>
                <input
                  id="quiet-start"
                  type="number"
                  min="0"
                  max="23"
                  value={quietHoursStart ?? ''}
                  onChange={(e) => setQuietHoursStart(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                  placeholder="e.g., 22"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="quiet-end" className="text-xs">End hour</Label>
                <input
                  id="quiet-end"
                  type="number"
                  min="0"
                  max="23"
                  value={quietHoursEnd ?? ''}
                  onChange={(e) => setQuietHoursEnd(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
                  placeholder="e.g., 8"
                />
              </div>
            </div>
          </div>

          {/* Owner response timeout */}
          <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
            <Label htmlFor="owner-timeout" className="text-sm font-medium leading-none">
              Agent wait time
            </Label>
            <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
              How long the agent waits for you to respond during a call (15-180 seconds).
            </p>
            <div className="mt-2">
              <input
                id="owner-timeout"
                type="number"
                min="15"
                max="180"
                value={ownerResponseTimeoutSec}
                onChange={(e) => setOwnerResponseTimeoutSec(parseInt(e.target.value) || 60)}
                className="w-full rounded-lg border border-[hsl(var(--border))] bg-background px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))]"
              />
              <span className="ml-2 text-xs text-[hsl(var(--muted-foreground))]">seconds</span>
            </div>
          </div>

          {/* Push notification subscription */}
          <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
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

          {/* Email fallback */}
          <div className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
            <div className="flex-1">
              <Label htmlFor="pref-email-fallback" className="cursor-pointer text-sm font-medium leading-none">
                Email fallback
              </Label>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                Send you an email when you're unreachable (no open tab and no push subscription). You can turn this off if you prefer notifications only.
              </p>
            </div>
            <Switch
              id="pref-email-fallback"
              checked={emailFallback}
              onCheckedChange={setEmailFallback}
            />
          </div>
        </div>

        {/* Fixed bottom section with Save button */}
        <div className="px-6 py-6 flex-shrink-0 border-t border-[hsl(var(--border))]">
          <button
            type="button"
            data-testid="button-save-preferences"
            onClick={handleSave}
            className="w-full rounded-xl bg-[#2854cc] py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4] active:translate-y-0"
          >
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
