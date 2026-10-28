import { Clock } from 'lucide-react';

export interface BusinessHours {
  days: number[];
  start: number;
  end: number;
  tz?: string;
}

interface HoursEditorProps {
  value: BusinessHours;
  onChange: (value: BusinessHours) => void;
  showTimezone?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HoursEditor({ value, onChange, showTimezone = false }: HoursEditorProps) {
  const toggleDay = (day: number) => {
    onChange({
      ...value,
      days: value.days.includes(day) ? value.days.filter((d) => d !== day) : [...value.days, day],
    });
  };

  // Get all available timezones, plus the current one if not in the list
  const allTimezones = Intl.supportedValuesOf('timeZone');
  const currentTimezone = value.tz || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezones = allTimezones.includes(currentTimezone) ? allTimezones : [currentTimezone, ...allTimezones];

  return (
    <div className="space-y-4">
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
                value.days.includes(idx)
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
            value={value.start}
            onChange={(e) => onChange({ ...value, start: Number(e.target.value) })}
            className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            End Hour (1-24, exclusive)
          </label>
          <input
            type="number"
            min="1"
            max="24"
            value={value.end}
            onChange={(e) => onChange({ ...value, end: Number(e.target.value) })}
            className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm"
          />
        </div>
      </div>

      {showTimezone && (
        <div>
          <label className="mb-2 block text-xs font-medium text-muted-foreground">
            Timezone
          </label>
          <select
            value={value.tz || ''}
            onChange={(e) => onChange({ ...value, tz: e.target.value || undefined })}
            className="w-full rounded-lg border border-border bg-[#fbfaf6] px-3 py-2 text-sm outline-none focus:border-[#3b82f6]"
          >
            <option value="">Select timezone</option>
            {timezones.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
