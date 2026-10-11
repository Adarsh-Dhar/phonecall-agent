import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClosure, updateClosure, type BusinessClosure, type ClosureInput } from '../../api';
import { toLocalParts } from './format';

interface Props {
  timezone: string | null;
  editing: BusinessClosure | null;
  onSaved: () => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm outline-none focus:border-[#3b82f6]';

function initialState(editing: BusinessClosure | null, tz: string | null) {
  if (!editing) {
    return {
      kind: 'holiday' as 'holiday' | 'out_of_service',
      label: '',
      allDay: true,
      startDate: '',
      endDate: '',
      startLocal: '',
      endLocal: '',
      message: '',
      blockCalls: false,
    };
  }
  const start = toLocalParts(editing.startsAt, tz);
  const end = editing.endsAt
    ? toLocalParts(editing.allDay ? new Date(new Date(editing.endsAt).getTime() - 1).toISOString() : editing.endsAt, tz)
    : { date: '', time: '' };
  return {
    kind: (editing.kind === 'holiday' ? 'holiday' : 'out_of_service') as 'holiday' | 'out_of_service',
    label: editing.label ?? '',
    allDay: editing.allDay,
    startDate: start.date,
    endDate: end.date,
    startLocal: `${start.date}T${start.time}`,
    endLocal: end.date ? `${end.date}T${end.time}` : '',
    message: editing.message ?? '',
    blockCalls: editing.blockCalls,
  };
}

export function ClosureForm({ timezone, editing, onSaved, onCancel }: Props) {
  const [f, setF] = useState(() => initialState(editing, timezone));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((s) => ({ ...s, [key]: value }));

  const submit = async () => {
    setError(null);
    if (!timezone) {
      setError('Set your business timezone in Business Hours first');
      return;
    }
    if (f.allDay ? !f.startDate || !f.endDate : !f.startLocal || !f.endLocal) {
      setError('Choose when the closure starts and ends');
      return;
    }
    const payload: ClosureInput = {
      kind: f.kind,
      label: f.label.trim() || undefined,
      message: f.message.trim() || undefined,
      allDay: f.allDay,
      blockCalls: f.blockCalls,
      ...(f.allDay
        ? { startDate: f.startDate, endDate: f.endDate }
        : { startLocal: f.startLocal, endLocal: f.endLocal }),
    };
    setBusy(true);
    try {
      if (editing) await updateClosure(editing.id, payload);
      else await createClosure(payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the closure');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-border bg-[#fbfaf6] p-4">
      <p className="text-sm font-bold tracking-tight">{editing ? 'Edit closure' : 'Add a closure'}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Type</label>
          <select value={f.kind} onChange={(e) => set('kind', e.target.value as 'holiday' | 'out_of_service')} className={inputClass}>
            <option value="holiday">Holiday</option>
            <option value="out_of_service">Planned closure</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Name (optional)</label>
          <input
            value={f.label}
            onChange={(e) => set('label', e.target.value)}
            maxLength={80}
            placeholder="e.g. Diwali"
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.allDay} onChange={(e) => set('allDay', e.target.checked)} />
        All day
      </label>

      {f.allDay ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">First closed day</label>
            <input type="date" value={f.startDate} onChange={(e) => set('startDate', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Last closed day</label>
            <input type="date" value={f.endDate} min={f.startDate || undefined} onChange={(e) => set('endDate', e.target.value)} className={inputClass} />
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Closes at</label>
            <input type="datetime-local" value={f.startLocal} onChange={(e) => set('startLocal', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Reopens at</label>
            <input type="datetime-local" value={f.endLocal} min={f.startLocal || undefined} onChange={(e) => set('endLocal', e.target.value)} className={inputClass} />
          </div>
        </div>
      )}
      <p className="text-[10px] text-muted-foreground">{timezone ? `Times are in ${timezone}` : 'Set your business timezone first'}</p>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Message for callers (optional)</label>
        <textarea value={f.message} onChange={(e) => set('message', e.target.value)} maxLength={200} rows={2} className={inputClass} />
        <p className="mt-1 text-[10px] text-muted-foreground">Individuals who have saved your business can see this message.</p>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.blockCalls} onChange={(e) => set('blockCalls', e.target.checked)} />
        Also reject calls dialed by hand
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? <LoaderCircle size={14} className="animate-spin" /> : null}
          <span className={busy ? 'ml-2' : ''}>{editing ? 'Save changes' : 'Add closure'}</span>
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
