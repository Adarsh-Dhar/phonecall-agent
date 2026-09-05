import { useState } from 'react';
import { Check, X } from 'lucide-react';
import type * as api from '@/lib/api';
import { STATUS_META, PRIORITY_BADGE } from './taskMeta';

export function TaskRow({
  task,
  onStatusChange,
}: {
  task: api.Task;
  onStatusChange: (id: string, status: api.TaskStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[task.status] ?? STATUS_META.open;
  const isDone = task.status === 'done' || task.status === 'cancelled';

  // Next logical status to advance to on checkbox click
  const advanceStatus = (): api.TaskStatus => {
    if (task.status === 'suggested') return 'open';
    if (task.status === 'open') return 'in_progress';
    if (task.status === 'in_progress') return 'done';
    return task.status as api.TaskStatus;
  };

  return (
    <div
      className={`rounded-xl border bg-[#fafaf7] p-3 transition-all ${
        task.status === 'suggested' ? 'border-[#f5d78e] bg-[#fffbf0]' : 'border-[hsl(var(--border))]'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox / advance button */}
        <button
          type="button"
          aria-label={isDone ? 'Task complete' : 'Advance task status'}
          onClick={() => !isDone && onStatusChange(task.id, advanceStatus())}
          className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded ${
            isDone
              ? 'bg-[#8fba9a] text-white cursor-default'
              : task.status === 'suggested'
              ? 'border border-[#f5a623] bg-[#fff8e8]'
              : 'border border-[#3b9a83] bg-white hover:bg-[#edf9f5]'
          }`}
        >
          {(task.status === 'in_progress' || isDone) && <Check size={10} strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-semibold leading-4 ${isDone ? 'line-through text-[hsl(var(--muted-foreground))]' : ''}`}>
              {task.title}
            </span>
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[.07em] ${PRIORITY_BADGE[task.priority] ?? PRIORITY_BADGE.normal}`}>
              {task.priority}
            </span>
          </div>

          {/* Status + due date */}
          <div className="mt-1 flex items-center gap-2">
            <span className={`flex items-center gap-1 text-[10px] font-bold ${meta.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            {task.dueDate && (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                Due {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            )}
            {task.source === 'agent' && task.confidence < 1 && (
              <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                {Math.round(task.confidence * 100)}% conf.
              </span>
            )}
          </div>

          {/* Expand toggle for description */}
          {task.description && (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="mt-1 text-[10px] font-bold text-[#3159c4] hover:underline"
            >
              {open ? 'Hide detail' : 'Show detail'}
            </button>
          )}
          {open && task.description && (
            <p className="mt-1 text-[11px] leading-4 text-[hsl(var(--muted-foreground))]">{task.description}</p>
          )}
        </div>

        {/* Suggested task quick-actions: confirm or dismiss */}
        {task.status === 'suggested' && (
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              aria-label="Confirm task"
              onClick={() => onStatusChange(task.id, 'open')}
              className="grid h-6 w-6 place-items-center rounded-lg bg-[#dcefe9] text-[#216457] hover:bg-[#c4e3da]"
            >
              <Check size={11} strokeWidth={3} />
            </button>
            <button
              type="button"
              aria-label="Dismiss task"
              onClick={() => onStatusChange(task.id, 'cancelled')}
              className="grid h-6 w-6 place-items-center rounded-lg bg-[#f3ebe8] text-[#a05a4a] hover:bg-[#e8d5cf]"
            >
              <X size={11} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
