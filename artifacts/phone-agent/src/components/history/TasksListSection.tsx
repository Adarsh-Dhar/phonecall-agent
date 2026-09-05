import { useCallback, useEffect, useState } from 'react';
import { ListTodo, LoaderCircle, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import * as api from '@/lib/api';
import { TaskRowWithContact, ACTIVE_STATUSES } from '@/components/tasks';

/**
 * Task list section of the History ("Tasks") page: filter tabs, refresh,
 * and the row list. Manages its own task state/loading — split out of
 * HistoryPage.tsx, which also owned the unrelated Google Calendar section.
 */
export function TasksListSection() {
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const handleStatusChange = async (taskId: string, status: api.TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch { /* no-op */ }
  };

  const visible = filter === 'active'
    ? tasks.filter((t) => ACTIVE_STATUSES.includes(t.status as api.TaskStatus))
    : tasks;

  const suggestedCount = tasks.filter((t) => t.status === 'suggested').length;

  return (
    <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12">
      <Link href="/contacts" className="mb-8 block text-xs font-bold text-[#3159c4] hover:underline">← Back to contacts</Link>
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">All contacts</p>
        <h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Tasks</h1>
      </div>

      {/* Header row: filter tabs + refresh */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
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
          {suggestedCount > 0 && (
            <span className="ml-1 text-[10px] text-[#995500]">{suggestedCount} suggested</span>
          )}
        </div>
        <button
          type="button"
          aria-label="Refresh tasks"
          onClick={() => void loadTasks()}
          className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <LoaderCircle size={16} className="animate-spin text-muted-foreground" />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef4f0] text-[#4a8978]">
            <ListTodo size={24} />
          </div>
          <p className="mt-4 font-bold text-[#203039]">
            {filter === 'active' ? 'No active tasks' : 'No tasks yet'}
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            {filter === 'active' ? 'Switch to All to see completed tasks.' : 'Tasks will appear here after your first conversation.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((task) => (
            <TaskRowWithContact key={task.id} task={task} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
