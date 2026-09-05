import { useCallback, useEffect, useState } from 'react';
import { ListTodo, LoaderCircle, Plus, RefreshCw, Sparkles } from 'lucide-react';
import * as api from '@/lib/api';
import { TaskRow } from './TaskRow';
import { ACTIVE_STATUSES } from './taskMeta';

export function TasksPanel({
  conversationId,
  contactId,
}: {
  conversationId: string | undefined;
  contactId: string | undefined;
}) {
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const loadTasks = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    try {
      const data = await api.fetchConversationTasks(conversationId);
      setTasks(data);
    } catch {
      // silently ignore — panel is non-critical
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Reload whenever the conversation changes
  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const handleExtract = async () => {
    if (!conversationId || extracting) return;
    setExtracting(true);
    try {
      await api.extractTasks(conversationId);
      await loadTasks();
    } finally {
      setExtracting(false);
    }
  };

  const handleStatusChange = async (taskId: string, status: api.TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch { /* no-op */ }
  };

  const handleAddTask = async () => {
    const title = newTitle.trim();
    if (!title || !conversationId || !contactId) {
      console.warn('[TasksPanel] Missing required data:', { title, conversationId, contactId });
      return;
    }
    try {
      const task = await api.createTask({ title, conversationId, contactId });
      setTasks((prev) => [...prev, task]);
      setNewTitle('');
      setShowAddForm(false);
      console.log('[TasksPanel] Task created successfully:', task.title);
    } catch (err) {
      console.error('[TasksPanel] Failed to create task:', err);
    }
  };

  const visible = filter === 'active'
    ? tasks.filter((t) => ACTIVE_STATUSES.includes(t.status as api.TaskStatus))
    : tasks;

  const suggestedCount = tasks.filter((t) => t.status === 'suggested').length;

  return (
    <section className="rounded-[22px] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#edf1ec] text-[#3f8274]">
            <ListTodo size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Tasks</h3>
            {suggestedCount > 0 && (
              <p className="text-[10px] text-[#995500]">{suggestedCount} suggested</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Refresh tasks"
            onClick={() => void loadTasks()}
            className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            type="button"
            aria-label="Check conversation for new tasks"
            onClick={() => void handleExtract()}
            disabled={extracting || !conversationId}
            className="flex items-center gap-1 rounded-lg border border-[hsl(var(--border))] px-2 py-1 text-[10px] font-bold text-[#3159c4] hover:bg-[#edf1ff] disabled:opacity-40"
          >
            {extracting ? <LoaderCircle size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {extracting ? 'Scanning…' : 'Scan'}
          </button>
          <button
            type="button"
            aria-label="Add task manually"
            onClick={() => setShowAddForm((v) => !v)}
            className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mt-3 flex gap-1">
        {(['active', 'all'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] transition-colors ${
              filter === f ? 'bg-[#2854cc] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {f === 'active' ? 'Active' : 'All'}
          </button>
        ))}
      </div>

      {/* Inline add form */}
      {showAddForm && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleAddTask(); if (e.key === 'Escape') setShowAddForm(false); }}
            placeholder="New task…"
            className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          />
          <button
            type="button"
            onClick={() => void handleAddTask()}
            disabled={!newTitle.trim()}
            className="rounded-xl bg-[#2854cc] px-3 py-2 text-xs font-bold text-white hover:bg-[#2148b4] disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="mt-3 space-y-2">
        {!conversationId ? (
          <p className="py-3 text-center text-xs text-[hsl(var(--muted-foreground))]">Select a conversation to see tasks.</p>
        ) : loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <LoaderCircle size={14} className="animate-spin text-[hsl(var(--muted-foreground))]" />
          </div>
        ) : visible.length === 0 ? (
          <p className="py-3 text-center text-xs text-[hsl(var(--muted-foreground))]">
            {filter === 'active' ? 'No active tasks — hit Scan to mine the conversation.' : 'No tasks yet.'}
          </p>
        ) : (
          visible.map((task) => (
            <TaskRow key={task.id} task={task} onStatusChange={handleStatusChange} />
          ))
        )}
      </div>
    </section>
  );
}
