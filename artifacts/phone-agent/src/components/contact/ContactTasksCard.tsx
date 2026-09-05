import { useCallback, useEffect, useState } from 'react';
import { Check, ListTodo, LoaderCircle, Phone, Plus, RefreshCw } from 'lucide-react';
import * as api from '@/lib/api';
import { TestCallWidget } from '@/components/TestCallWidget';

/**
 * Tasks card on the Contact Detail page. Manages its own state (load,
 * create, toggle status) scoped to a single contact — this is intentionally
 * separate from the conversation-scoped `components/tasks/TasksPanel`, which
 * has different filters and a different data source.
 */
export function ContactTasksCard({ contactId }: { contactId: string | undefined }) {
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [callingTask, setCallingTask] = useState<api.Task | null>(null);

  const loadTasks = useCallback(async () => {
    if (!contactId) return;
    setTasksLoading(true);
    try {
      const data = await api.fetchContactTasks(contactId);
      setTasks(data);
    } catch (err) {
      console.error('[ContactTasksCard] Failed to load tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [contactId]);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !contactId) return;
    try {
      const task = await api.createTask({
        title: newTaskTitle.trim(),
        conversationId: '', // Will be set by backend
        contactId,
      });
      setTasks((prev) => [...prev, task]);
      setNewTaskTitle('');
      setShowAddTask(false);
    } catch (err) {
      console.error('[ContactTasksCard] Failed to create task:', err);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: api.TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch (err) {
      console.error('[ContactTasksCard] Failed to update task:', err);
    }
  };

  return (
    <div className="mt-5 rounded-[22px] border border-card-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#edf1ec] text-[#3f8274]">
          <ListTodo size={15} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight">Tasks</h3>
          <p className="text-[10px] text-[#3f8274]">{tasks.filter((t) => t.status !== 'done').length} active</p>
        </div>
        <button
          type="button"
          aria-label="Refresh tasks"
          onClick={() => void loadTasks()}
          className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <RefreshCw size={13} className={tasksLoading ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          aria-label="Add task"
          onClick={() => setShowAddTask((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <Plus size={14} />
        </button>
      </div>

      {showAddTask && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateTask(); if (e.key === 'Escape') setShowAddTask(false); }}
            placeholder="New task…"
            className="flex-1 rounded-xl border border-border bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          />
          <button
            type="button"
            onClick={() => void handleCreateTask()}
            disabled={!newTaskTitle.trim()}
            className="rounded-xl bg-[#2854cc] px-3 py-2 text-xs font-bold text-white hover:bg-[#2148b4] disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {tasksLoading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <LoaderCircle size={14} className="animate-spin text-muted-foreground" />
          </div>
        ) : tasks.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">No tasks yet.</p>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-[#fbfaf6] px-3 py-2.5"
            >
              <button
                type="button"
                onClick={() => void handleTaskStatusChange(task.id, task.status === 'done' ? 'open' : 'done')}
                className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded ${
                  task.status === 'done'
                    ? 'bg-[#8fba9a] text-white cursor-default'
                    : 'border border-[#3b9a83] bg-white hover:bg-[#edf9f5]'
                }`}
              >
                {task.status === 'done' && <Check size={10} strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-medium ${task.status === 'done' ? 'text-muted-foreground line-through' : ''}`}>
                  {task.title}
                </p>
                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[.06em] ${
                  task.priority === 'high' ? 'bg-[#fde3e3] text-[#b44343]'
                  : task.priority === 'low' ? 'bg-[#edf1ec] text-[#58645f]'
                  : 'bg-[#eef1fb] text-[#3159c4]'
                }`}>
                  {task.priority}
                </span>
              </div>
              {task.status !== 'done' && task.status !== 'cancelled' && contactId && (
                <button
                  type="button"
                  aria-label={`Call about "${task.title}"`}
                  title="Call about this"
                  onClick={() => setCallingTask(task)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[#3f8274] hover:bg-[#edf9f5]"
                >
                  <Phone size={13} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {callingTask && contactId && (
        <TestCallWidget
          contactId={contactId}
          taskId={callingTask.id}
          taskTitle={callingTask.title}
          onClose={() => { setCallingTask(null); void loadTasks(); }}
        />
      )}
    </div>
  );
}
