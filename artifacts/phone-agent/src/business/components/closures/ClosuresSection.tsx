import { useCallback, useEffect, useState } from 'react';
import { CalendarOff, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { fetchClosures, type BusinessClosure } from '../../api';
import { OutOfServiceCard } from './OutOfServiceCard';
import { ClosureForm } from './ClosureForm';
import { ClosureList } from './ClosureList';

interface Props {
  /** The business timezone as last saved. */
  timezone: string | null;
}

export function ClosuresSection({ timezone }: Props) {
  const [closures, setClosures] = useState<BusinessClosure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BusinessClosure | null>(null);

  const load = useCallback(async () => {
    try {
      setClosures(await fetchClosures());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load closures');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Statuses change with time (a closure starts or ends), so refresh now and then.
    const timer = setInterval(() => void load(), 60_000);
    return () => clearInterval(timer);
  }, [load]);

  const active =
    closures.filter((c) => c.status === 'active').sort((a, b) => Number(b.endsAt === null) - Number(a.endsAt === null))[0] ?? null;

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const afterSave = () => {
    closeForm();
    void load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#fde9e3] text-[#bf4720]">
          <CalendarOff size={15} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight">Closures and out of service</h3>
          <p className="text-[10px] text-muted-foreground">
            Holidays, emergencies and time off. No scheduled calls are placed while you are closed.
          </p>
        </div>
      </div>

      {!timezone && (
        <div className="rounded-lg bg-[#fff8e6] p-3 text-sm text-[#8a6100]">
          Set and save your timezone in Business Hours above so closure dates are read in your local time.
        </div>
      )}

      {error && <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <div className="py-4 text-center text-sm text-muted-foreground">Loading closures...</div>
      ) : (
        <>
          <OutOfServiceCard active={active} timezone={timezone} onChanged={load} />

          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold tracking-tight">Planned closures</p>
              {!formOpen && (
                <Button variant="outline" onClick={() => setFormOpen(true)}>
                  <Plus size={14} />
                  <span className="ml-2">Add closure</span>
                </Button>
              )}
            </div>

            {formOpen && (
              <ClosureForm
                key={editing?.id ?? 'new'}
                timezone={timezone}
                editing={editing}
                onSaved={afterSave}
                onCancel={closeForm}
              />
            )}

            <ClosureList
              closures={closures}
              timezone={timezone}
              onEdit={(c) => {
                setEditing(c);
                setFormOpen(true);
              }}
              onChanged={load}
            />
          </Card>
        </>
      )}
    </div>
  );
}
