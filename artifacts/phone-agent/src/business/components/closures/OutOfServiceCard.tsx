import { useState } from 'react';
import { Power, PowerOff, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { endClosure, startOutOfService, type BusinessClosure } from '../../api';
import { KIND_LABEL, formatDateTime } from './format';

type Duration = '1h' | '4h' | '24h' | 'until' | 'open';

interface Props {
  active: BusinessClosure | null;
  timezone: string | null;
  onChanged: () => void;
}

const HOUR = 60 * 60 * 1000;

export function OutOfServiceCard({ active, timezone, onChanged }: Props) {
  const [formOpen, setFormOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState<Duration>('4h');
  const [untilLocal, setUntilLocal] = useState('');
  const [emergency, setEmergency] = useState(false);
  const [blockCalls, setBlockCalls] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFormOpen(false);
    setMessage('');
    setDuration('4h');
    setUntilLocal('');
    setEmergency(false);
    setBlockCalls(false);
    setError(null);
  };

  const submit = async () => {
    setError(null);
    if (duration === 'until' && !untilLocal) {
      setError('Pick the date and time you will reopen');
      return;
    }
    setBusy(true);
    try {
      const payload: Parameters<typeof startOutOfService>[0] = {
        message: message.trim() || undefined,
        emergency,
        blockCalls,
      };
      if (duration === '1h') payload.until = new Date(Date.now() + HOUR).toISOString();
      if (duration === '4h') payload.until = new Date(Date.now() + 4 * HOUR).toISOString();
      if (duration === '24h') payload.until = new Date(Date.now() + 24 * HOUR).toISOString();
      if (duration === 'until') payload.untilLocal = untilLocal;
      await startOutOfService(payload);
      reset();
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not mark you out of service');
    } finally {
      setBusy(false);
    }
  };

  const reopen = async () => {
    if (!active) return;
    if (!window.confirm('Reopen now? Individuals will be able to reach you again straight away.')) return;
    setBusy(true);
    setError(null);
    try {
      await endClosure(active.id);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reopen');
    } finally {
      setBusy(false);
    }
  };

  if (active) {
    return (
      <Card className="border-[#e26951]/40 bg-[#fff5f2] p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fde3dc] text-[#bf4720]">
            <PowerOff size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold tracking-tight">
              Closed now{active.label ? `: ${active.label}` : ''}{' '}
              <span className="text-xs font-medium text-muted-foreground">({KIND_LABEL[active.kind]})</span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {active.endsAt ? `Reopens ${formatDateTime(active.endsAt, timezone)}` : 'Closed until you reopen'}
            </p>
            {active.message && <p className="mt-2 text-sm">{active.message}</p>}
            <p className="mt-2 text-[11px] text-muted-foreground">
              Scheduled calls to you are paused.{' '}
              {active.blockCalls ? 'Manual calls are rejected too.' : 'Individuals dialing by hand see a warning.'}
            </p>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={reopen} disabled={busy} variant="outline" className="shrink-0">
            {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Power size={14} />}
            <span className="ml-2">Reopen now</span>
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e6f4ec] text-[#2f7d52]">
          <Power size={16} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold tracking-tight">Open for calls</p>
          <p className="text-xs text-muted-foreground">
            Need to stop calls right now (emergency, power cut, staff out)? Mark yourself out of service.
          </p>
        </div>
        {!formOpen && (
          <Button variant="outline" onClick={() => setFormOpen(true)}>
            Mark out of service
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="mt-5 space-y-4 border-t border-border pt-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Message for callers (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="e.g. Closed for an emergency repair. Back tomorrow."
              className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm outline-none focus:border-[#3b82f6]"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              Individuals who have saved your business can see this message.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">How long?</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
              className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm outline-none focus:border-[#3b82f6]"
            >
              <option value="1h">1 hour</option>
              <option value="4h">4 hours</option>
              <option value="24h">24 hours</option>
              <option value="until">Until a date and time</option>
              <option value="open">Until I reopen</option>
            </select>
            {duration === 'until' && (
              <div className="mt-2">
                <input
                  type="datetime-local"
                  value={untilLocal}
                  onChange={(e) => setUntilLocal(e.target.value)}
                  className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm outline-none focus:border-[#3b82f6]"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {timezone ? `Time in ${timezone}` : 'Set your business timezone in Business Hours first'}
                </p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={emergency} onChange={(e) => setEmergency(e.target.checked)} />
            This is an emergency
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={blockCalls} onChange={(e) => setBlockCalls(e.target.checked)} />
            Also reject calls dialed by hand
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button onClick={submit} disabled={busy}>
              {busy ? <LoaderCircle size={14} className="animate-spin" /> : null}
              <span className={busy ? 'ml-2' : ''}>Mark out of service</span>
            </Button>
            <Button variant="outline" onClick={reset} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
