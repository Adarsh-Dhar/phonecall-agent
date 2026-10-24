import { useState } from 'react';
import { Clock, Check, X, RotateCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api/shared';
import { HoursEditor, type BusinessHours } from '@/components/hours/HoursEditor';
import type { HoursSource } from '@/lib/api/contacts';

interface BusinessHoursCardProps {
  contactId: string;
  initial: string | null;
  effectiveHours?: BusinessHours;
  hoursSource?: HoursSource;
  isBusinessContact?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SOURCE_LABELS: Record<HoursSource, string> = {
  default: 'Default (Mon-Fri, 9 AM-5 PM)',
  business: 'Set by the business',
  override: 'Your override',
};

export function BusinessHoursCard({ contactId, initial, effectiveHours, hoursSource, isBusinessContact = false }: BusinessHoursCardProps) {
  const [editing, setEditing] = useState(false);
  const [businessHours, setBusinessHours] = useState<BusinessHours | null>(
    effectiveHours || (initial ? JSON.parse(initial) : null)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!businessHours || businessHours.days.length === 0) {
      setError('Select at least one day');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHoursJson: businessHours }),
      });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setBusinessHours(effectiveHours || (initial ? JSON.parse(initial) : null));
    setError(null);
    setEditing(false);
  };

  const handleUseBusinessHours = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessHoursJson: null }),
      });
      setBusinessHours(null);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    } finally {
      setSaving(false);
    }
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
              {hoursSource && (
                <p className="text-[10px] text-muted-foreground">
                  Source: {SOURCE_LABELS[hoursSource]}
                </p>
              )}
            </div>
          </div>
          {!isBusinessContact && hoursSource !== 'business' && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#3b82f6] hover:bg-[#f0f7ff]"
            >
              {businessHours ? 'Edit' : 'Set Hours'}
            </button>
          )}
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
        <HoursEditor
          value={businessHours || { days: [], start: 9, end: 17 }}
          onChange={setBusinessHours}
        />

        {error && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !businessHours || businessHours.days.length === 0}
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
          {hoursSource !== 'default' && (
            <button
              type="button"
              onClick={handleUseBusinessHours}
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-[#fbfaf6] px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-[#f0f7ff]"
              title="Use the business's hours instead of your override"
            >
              <RotateCcw size={14} />
              Use Business Hours
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
