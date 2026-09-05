import { Link } from 'wouter';
import type * as api from '@/lib/api';
import { TaskRow } from './TaskRow';

export function TaskRowWithContact({
  task,
  onStatusChange,
}: {
  task: api.Task;
  onStatusChange: (id: string, status: api.TaskStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-0">
      {task.contact && (
        <div className="mb-0.5 flex items-center gap-1.5 px-1">
          <Link
            href={`/contacts/${task.contact.id}`}
            className="flex items-center gap-1.5 text-[10px] font-bold text-[#3159c4] hover:underline"
          >
            <span
              className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] font-bold"
              style={{ background: task.contact.color }}
            >
              {task.contact.initials.slice(0, 1)}
            </span>
            {task.contact.name}
          </Link>
        </div>
      )}
      <TaskRow task={task} onStatusChange={onStatusChange} />
    </div>
  );
}
