import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteClosure, type BusinessClosure } from '../../api';
import { KIND_LABEL, describeRange } from './format';

interface Props {
  closures: BusinessClosure[];
  timezone: string | null;
  onEdit: (closure: BusinessClosure) => void;
  onChanged: () => void;
}

function Row({
  c,
  timezone,
  onEdit,
  onDelete,
}: {
  c: BusinessClosure;
  timezone: string | null;
  onEdit?: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">
          {c.label || KIND_LABEL[c.kind]}{' '}
          <span className="text-xs font-normal text-muted-foreground">({KIND_LABEL[c.kind]})</span>
        </p>
        <p className="text-xs text-muted-foreground">{describeRange(c, timezone)}</p>
        {c.message && <p className="mt-1 text-xs">{c.message}</p>}
        {c.blockCalls && <p className="mt-1 text-[10px] text-[#bf4720]">Manual calls rejected</p>}
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} aria-label="Edit closure" className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
          <Pencil size={14} />
        </button>
      )}
      <button type="button" onClick={onDelete} aria-label="Delete closure" className="rounded-lg p-2 text-muted-foreground hover:bg-muted">
        <Trash2 size={14} />
      </button>
    </li>
  );
}

export function ClosureList({ closures, timezone, onEdit, onChanged }: Props) {
  const [showPast, setShowPast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upcoming = closures.filter((c) => c.status === 'upcoming');
  const past = closures.filter((c) => c.status === 'past').reverse();

  const remove = async (c: BusinessClosure) => {
    if (!window.confirm(`Delete "${c.label || KIND_LABEL[c.kind]}"?`)) return;
    setError(null);
    try {
      await deleteClosure(c.id);
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete');
    }
  };

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Upcoming</p>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No planned closures. Add holidays and time off so callers know in advance.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((c) => (
              <Row key={c.id} c={c} timezone={timezone} onEdit={() => onEdit(c)} onDelete={() => remove(c)} />
            ))}
          </ul>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            className="text-xs font-medium text-[#3b82f6] hover:underline"
          >
            {showPast ? 'Hide' : 'Show'} past closures (last 30 days)
          </button>
          {showPast && (
            <ul className="mt-2 space-y-2 opacity-70">
              {past.map((c) => (
                <Row key={c.id} c={c} timezone={timezone} onDelete={() => remove(c)} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
