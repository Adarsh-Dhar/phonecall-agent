import { useCallback, useEffect, useState } from 'react';
import { UserRound, Plus, Pencil, Trash2, LoaderCircle, RefreshCw, Info } from 'lucide-react';
import * as api from '@/lib/api';
import { AppLayout } from '@/individual/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

const CATEGORY_LABELS: Record<string, string> = {
  identity: 'Identity',
  contact: 'Contact',
  location: 'Location',
  availability: 'Availability',
  preferences: 'Preferences',
  insurance_plan: 'Insurance plan',
  other: 'Other',
};

export function OwnerInfoPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const { user } = useAuth();
  const [facts, setFacts] = useState<api.OwnerInfoFact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: 'other',
    key: '',
    value: '',
    shareable: false,
  });
  const [error, setError] = useState<string | null>(null);

  const loadFacts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchOwnerInfo();
      setFacts(data);
      setError(null);
    } catch {
      setError('Failed to load your info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFacts();
  }, [loadFacts]);

  const handleSave = async () => {
    if (!formData.key.trim() || !formData.value.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await api.saveOwnerInfo(formData);
      setFacts((prev) => [...prev, saved]);
      setFormData({ category: 'other', key: '', value: '', shareable: false });
      setShowAddForm(false);
      toast({ title: 'Saved', description: 'Your info has been saved.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.key.trim() || !formData.value.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateOwnerInfo(id, {
        category: formData.category,
        value: formData.value,
        shareable: formData.shareable,
      });
      setFacts((prev) => prev.map((f) => (f.id === id ? updated : f)));
      setEditingId(null);
      setFormData({ category: 'other', key: '', value: '', shareable: false });
      toast({ title: 'Updated', description: 'Your info has been updated.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteOwnerInfo(id);
      setFacts((prev) => prev.filter((f) => f.id !== id));
      toast({ title: 'Deleted', description: 'Your info has been deleted.' });
    } catch {
      setError('Failed to delete');
    }
  };

  const startEdit = (fact: api.OwnerInfoFact) => {
    setEditingId(fact.id);
    setFormData({
      category: fact.category,
      key: fact.key,
      value: fact.value,
      shareable: fact.shareable,
    });
  };

  const groupedFacts = facts.reduce((acc, fact) => {
    if (!acc[fact.category]) acc[fact.category] = [];
    acc[fact.category].push(fact);
    return acc;
  }, {} as Record<string, api.OwnerInfoFact[]>);

  return (
    <AppLayout
      title="My info"
      onPrefsOpen={() => setPrefsOpen(true)}
      currentDate={currentDate}
      prefsOpen={prefsOpen}
      onPrefsClose={() => setPrefsOpen(false)}
    >
      <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12">
        {/* Page header */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Personal information</p>
            <h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">My info</h1>
          </div>
          <button
            type="button"
            aria-label="Refresh"
            onClick={() => void loadFacts()}
            className="flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Warning banner */}
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-[#e26951]/30 bg-[#e26951]/5 p-4">
          <Info size={18} className="mt-0.5 shrink-0 text-[#e26951]" />
          <p className="text-sm text-[#e26951]">
            Never enter card numbers, passwords or ID numbers. The agent reads these facts, and private ones are never read out.
          </p>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="mb-6 rounded-xl border border-border bg-background p-5">
            <h3 className="mb-4 text-sm font-medium">Add a fact</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Key</label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData((d) => ({ ...d, key: e.target.value }))}
                  placeholder="e.g., phone, email, preferred time"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  maxLength={60}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Value</label>
                <textarea
                  value={formData.value}
                  onChange={(e) => setFormData((d) => ({ ...d, value: e.target.value }))}
                  placeholder="e.g., 555-1234, morning appointments"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  rows={2}
                  maxLength={300}
                />
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.shareable}
                  onChange={(e) => setFormData((d) => ({ ...d, shareable: e.target.checked }))}
                  className="h-4 w-4 rounded border-border"
                />
                <span className="text-sm">Agent may say this out loud</span>
              </label>
              {error && <p className="text-sm text-[#e26951]">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                >
                  {saving ? <LoaderCircle size={14} className="inline animate-spin" /> : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ category: 'other', key: '', value: '', shareable: false });
                    setError(null);
                  }}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mb-6 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
          >
            <Plus size={16} />
            Add a fact
          </button>
        )}

        {/* Facts list */}
        {loading && facts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : facts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted">
              <UserRound size={24} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No facts saved yet.</p>
            <p className="text-xs text-muted-foreground">
              Add facts like your callback phone number, preferred appointment times, or home area.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFacts).map(([category, categoryFacts]) => (
              <div key={category}>
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                  {CATEGORY_LABELS[category] || category}
                </h3>
                <div className="space-y-2">
                  {categoryFacts.map((fact) => (
                    <div
                      key={fact.id}
                      className="flex items-start gap-3 rounded-xl border border-border bg-background p-4"
                    >
                      {editingId === fact.id ? (
                        <div className="flex-1 space-y-3">
                          <select
                            value={formData.category}
                            onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          >
                            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          <textarea
                            value={formData.value}
                            onChange={(e) => setFormData((d) => ({ ...d, value: e.target.value }))}
                            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                            rows={2}
                            maxLength={300}
                          />
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={formData.shareable}
                              onChange={(e) => setFormData((d) => ({ ...d, shareable: e.target.checked }))}
                              className="h-4 w-4 rounded border-border"
                            />
                            <span className="text-sm">Agent may say this out loud</span>
                          </label>
                          {error && <p className="text-sm text-[#e26951]">{error}</p>}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleUpdate(fact.id)}
                              disabled={saving}
                              className="rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
                            >
                              {saving ? <LoaderCircle size={12} className="inline animate-spin" /> : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(null);
                                setFormData({ category: 'other', key: '', value: '', shareable: false });
                                setError(null);
                              }}
                              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-medium">{fact.key}</span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  fact.shareable
                                    ? 'bg-[#5bc4a3]/10 text-[#5bc4a3]'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {fact.shareable ? 'Shared' : 'Private'}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{fact.value}</p>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => startEdit(fact)}
                              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              title="Edit"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(fact.id)}
                              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
