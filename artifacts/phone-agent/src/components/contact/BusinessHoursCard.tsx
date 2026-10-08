import { useState } from 'react';
import { Clock, Check, X } from 'lucide-react';
import { apiFetch } from '@/lib/api/shared';

interface BusinessHours {
  days: number[];
  start: number;
  end: number;
  tz?: string;
}

interface BusinessHoursCardProps {
  contactId: string;
  initial: string | null;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function BusinessHoursCard({ contactId, initial }: BusinessHoursCardProps) {
  const [editing, setEditing] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(
    initial ? JSON.parse(initial) : null
  );
  const [localDays, setLocalDays] = useState<number[]>(
    businessHours?.days ?? []
  );
  const [localStart, setLocalStart] = useState<number>(
    businessHours?.start ?? 9
  );
  const [localEnd, setLocalEnd] = useState<number>(
    businessHours?.end ?? 17
  );
  const [localTz, setLocalTz] = useState<string>(
    businessHours?.tz ?? 'Asia/Kolkata'
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated: BusinessHours = {
        days: localDays,
        start: localStart,
        end: localEnd,
        tz: localTz,
      };
      await apiFetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHoursJson: updated }),
      });
      setBusinessHours(updated);
      setEditing(false);
    } catch (err) {
      console.error('[BusinessHoursCard] Failed to save:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalDays(businessHours?.days ?? []);
    setLocalStart(businessHours?.start ?? 9);
    setLocalEnd(businessHours?.end ?? 17);
    setLocalTz(businessHours?.tz ?? 'Asia/Kolkata');
    setEditing(false);
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHoursJson: null }),
      });
      setBusinessHours(null);
      setLocalDays([]);
      setLocalStart(9);
      setLocalEnd(17);
      setLocalTz('Asia/Kolkata');
      setEditing(false);
    } catch (err) {
      console.error('[BusinessHoursCard] Failed to clear:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setLocalDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  if (!editing) {
    return (
      <div className="mt-5 rounded-[22px] border border-card-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f4fd] text-[#3b82f6]">
              <Clock size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Business Hours</h3>
              <p className="text-[10px] text-[#3b82f6]">
                {businessHours
                  ? `${businessHours.days.map((d) => DAY_NAMES[d]).join(', ')} ${businessHours.start}:00-${businessHours.end}:00 ${businessHours.tz ?? ''}`
                  : 'Not set'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#3b82f6] hover:bg-[#f0f7ff]"
          >
            {businessHours ? 'Edit' : 'Set Hours'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-[22px] border border-card-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f4fd] text-[#3b82f6]">
          <Clock size={15} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight">Business Hours</h3>
          <p className="text-[10px] text-[#3b82f6]">Edit availability</p>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Days
          </label>
          <div className="flex flex-wrap gap-2">
            {DAY_NAMES.map((name, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => toggleDay(idx)}
                className={`h-8 w-10 rounded-lg text-xs font-medium transition-colors ${
                  localDays.includes(idx)
                    ? 'bg-[#3b82f6] text-white'
                    : 'bg-[#fbfaf6] text-muted-foreground hover:bg-[#f0f7ff]'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Start Hour (0-23)
            </label>
            <input
              type="number"
              min="0"
              max="23"
              value={localStart}
              onChange={(e) => setLocalStart(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              End Hour (0-23, exclusive)
            </label>
            <input
              type="number"
              min="0"
              max="24"
              value={localEnd}
              onChange={(e) => setLocalEnd(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Timezone
          </label>
          <input
            type="text"
            value={localTz}
            onChange={(e) => setLocalTz(e.target.value)}
            placeholder="e.g., Asia/Kolkata"
            className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || localDays.length === 0}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-medium text-white hover:bg-[#2563eb] disabled:opacity-50"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Check size={14} />
                Save
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-lg border border-border bg-[#fbfaf6] px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-[#f0f7ff]"
          >
            <X size={14} />
            Cancel
          </button>
          {businessHours && (
            <button
              type="button"
              onClick={handleClear}
              disabled={saving}
              className="rounded-lg border border-border bg-[#fbfaf6] px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-[#fde8e8] hover:text-[#b44343]"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
