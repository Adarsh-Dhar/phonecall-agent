import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import * as api from '@/lib/api';

export function KnowledgeBoardPanel({ contactId }: { contactId: string | undefined }) {
  const [facts, setFacts] = useState<api.KnowledgeFact[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newCategory, setNewCategory] = useState('fact');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const loadFacts = useCallback(async () => {
    if (!contactId) return;
    setLoading(true);
    try {
      const data = await api.fetchContactKnowledge(contactId);
      setFacts(data);
    } catch {
      // silently ignore — panel is non-critical
    } finally {
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => { void loadFacts(); }, [loadFacts]);

  const handleCreate = async () => {
    if (!contactId || !newCategory || !newKey || !newValue.trim()) return;
    try {
      const fact = await api.createContactKnowledge(contactId, {
        category: newCategory,
        key: newKey,
        value: newValue.trim(),
      });
      setFacts((prev) => [...prev, fact]);
      setNewCategory('fact');
      setNewKey('');
      setNewValue('');
      setShowAddForm(false);
    } catch (err) {
      console.error('[KnowledgeBoardPanel] Failed to create fact:', err);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const updated = await api.updateContactKnowledge(id, { value: editValue });
      setFacts((prev) => prev.map((f) => f.id === id ? updated : f));
      setEditingId(null);
      setEditValue('');
    } catch (err) {
      console.error('[KnowledgeBoardPanel] Failed to update fact:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteContactKnowledge(id);
      setFacts((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('[KnowledgeBoardPanel] Failed to delete fact:', err);
    }
  };

  const grouped = facts.reduce((acc, fact) => {
    if (!acc[fact.category]) acc[fact.category] = [];
    acc[fact.category].push(fact);
    return acc;
  }, {} as Record<string, api.KnowledgeFact[]>);

  return (
    <section className="rounded-[22px] border border-card-border bg-card p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#f0eaff] text-[#6b4fc8]">
            <BookOpen size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Knowledge</h3>
            <p className="text-[10px] text-[#7a4fc8]">{facts.length} fact{facts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Refresh knowledge"
            onClick={() => void loadFacts()}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            aria-label="Add knowledge fact"
            onClick={() => setShowAddForm((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div className="mt-3 space-y-2">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            className="w-full rounded-xl border border-border bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          >
            <option value="fact">Fact</option>
            <option value="preference">Preference</option>
            <option value="history">History</option>
            <option value="constraint">Constraint</option>
            <option value="contact_info">Contact Info</option>
          </select>
          <input
            type="text"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="Key (e.g. preferred_callback_time)"
            className="w-full rounded-xl border border-border bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          />
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="w-full rounded-xl border border-border bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleCreate()}
              disabled={!newCategory || !newKey || !newValue.trim()}
              className="flex-1 rounded-xl bg-[#6b4fc8] px-3 py-2 text-xs font-bold text-white hover:bg-[#5a3fb8] disabled:opacity-40"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Knowledge list */}
      <div className="mt-3 space-y-3">
        {!contactId ? (
          <p className="py-3 text-center text-xs text-muted-foreground">Select a contact to see knowledge.</p>
        ) : loading && facts.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <LoaderCircle size={14} className="animate-spin text-muted-foreground" />
          </div>
        ) : facts.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">No knowledge facts yet.</p>
        ) : (
          Object.entries(grouped).map(([category, categoryFacts]) => (
            <div key={category}>
              <p className="mb-2 text-[9px] font-bold uppercase tracking-[.08em] text-muted-foreground">{category}</p>
              <div className="space-y-2">
                {categoryFacts.map((fact) => (
                  <div key={fact.id} className="rounded-xl border border-border bg-[#fafaf7] px-3 py-2">
                    {editingId === fact.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') void handleUpdate(fact.id); if (e.key === 'Escape') { setEditingId(null); setEditValue(''); } }}
                          className="flex-1 rounded-lg border border-border bg-white px-2 py-1 text-xs outline-none focus:border-[#6b4fc8] focus:ring-2 focus:ring-[#6b4fc8]/10"
                        />
                        <button
                          type="button"
                          onClick={() => void handleUpdate(fact.id)}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#6b4fc8] text-white hover:bg-[#5a3fb8]"
                        >
                          <Check size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditValue(''); }}
                          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold uppercase tracking-[.07em] text-muted-foreground">{fact.key}</p>
                          <p className="text-xs text-foreground">{fact.value}</p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            aria-label="Edit fact"
                            onClick={() => { setEditingId(fact.id); setEditValue(fact.value); }}
                            className="grid h-6 w-6 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete fact"
                            onClick={() => void handleDelete(fact.id)}
                            className="grid h-6 w-6 place-items-center rounded-lg text-muted-foreground hover:bg-[#fde8e8] hover:text-[#b44343]"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
