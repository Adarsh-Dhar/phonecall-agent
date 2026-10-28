import { useState, useEffect } from 'react';
import { Clock, Check, RotateCcw, LoaderCircle } from 'lucide-react';
import { fetchBusinessSettings, saveBusinessSettings, type BusinessSettings, type BusinessHours } from '../api';
import { HoursEditor } from '@/components/hours/HoursEditor';
import { ClosuresSection } from '../components/closures/ClosuresSection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const DEFAULT_HOURS: BusinessHours = { days: [1, 2, 3, 4, 5], start: 9, end: 17 };
const DEFAULT_TIMEZONE = 'Asia/Calcutta';

export function BusinessSettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localHours, setLocalHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [localTimezone, setLocalTimezone] = useState<string>('');

  // Get all available timezones
  const allTimezones = Intl.supportedValuesOf('timeZone');
  const currentTimezone = localTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timezones = allTimezones.includes(currentTimezone) ? allTimezones : [currentTimezone, ...allTimezones];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchBusinessSettings();
      setSettings(data);
      setLocalHours(data.hours);
      setLocalTimezone(data.timezone || DEFAULT_TIMEZONE);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!localTimezone) {
      setError('Timezone is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await saveBusinessSettings({
        businessHours: localHours,
        timezone: localTimezone,
      });
      setSettings(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await saveBusinessSettings({
        businessHours: null,
        timezone: localTimezone,
      });
      setSettings(updated);
      setLocalHours(DEFAULT_HOURS);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-muted-foreground">Configure your business hours, timezone and closures</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f4fd] text-[#3b82f6]">
            <Clock size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Business Hours</h3>
            {settings?.isDefault && (
              <p className="text-[10px] text-[#3b82f6]">
                Using default hours: Mon to Fri, 9 AM to 5 PM
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <HoursEditor
            value={localHours}
            onChange={setLocalHours}
            showTimezone={false}
          />

          <div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              Your Timezone <span className="text-[#b44343]">*</span>
            </label>
            <select
              value={localTimezone}
              onChange={(e) => setLocalTimezone(e.target.value)}
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

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving || localHours.days.length === 0 || !localTimezone}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <LoaderCircle size={14} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={14} />
                  Save
                </>
              )}
            </Button>
            {!settings?.isDefault && (
              <Button
                variant="outline"
                onClick={handleResetToDefault}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <RotateCcw size={14} />
                Reset to Default
              </Button>
            )}
          </div>
        </div>
      </Card>

      <ClosuresSection timezone={settings?.timezone ?? null} />
    </div>
  );
}
