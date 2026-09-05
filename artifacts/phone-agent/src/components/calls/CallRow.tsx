import type * as api from '@/lib/api';

export function CallRow({ call, expanded, onToggle, conversation }: {
  call: api.Call;
  expanded: boolean;
  onToggle: () => void;
  conversation?: api.Conversation;
}) {
  const isInbound = call.direction === 'inbound';
  const statusColor = call.status === 'completed' ? 'text-[#3f8274]' :
                     call.status === 'failed' || call.status === 'no-answer' || call.status === 'busy' ? 'text-[#b44343]' :
                     'text-muted-foreground';

  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold uppercase tracking-[.08em] ${isInbound ? 'text-[#3159c4]' : 'text-[#3f8274]'}`}>
              {isInbound ? 'Inbound' : 'Outbound'}
            </span>
            <span className={`text-[10px] ${statusColor}`}>
              {call.status}
            </span>
          </div>
          <h3 className="mt-1 font-bold">
            {isInbound ? `Inbound call from ${call.from}` : `Outbound call to ${call.to}`}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {call.durationSec != null ? `${Math.floor(call.durationSec / 60)}m ${call.durationSec % 60}s` : 'In progress'}
          </p>
          {call.recordingUrl && (
            <a href={call.recordingUrl} className="mt-2 text-xs text-[#3159c4] underline">Recording</a>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-muted-foreground">
            {call.endedAt ? new Date(call.endedAt).toLocaleDateString() :
             call.startedAt ? new Date(call.startedAt).toLocaleDateString() :
             new Date(call.createdAt).toLocaleDateString()}
          </p>
          {call.contact && (
            <div className="mt-2 flex items-center gap-1.5">
              <span
                className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[8px] font-bold"
                style={{ background: call.contact.color }}
              >
                {call.contact.initials.slice(0, 1)}
              </span>
              <span className="text-[10px] font-bold text-[#3159c4]">{call.contact.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={onToggle}
            className="mt-2 text-xs text-[#3159c4] hover:underline"
          >
            {expanded ? 'Hide conversation' : 'View conversation'}
          </button>
        </div>
      </div>

      {expanded && conversation && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="space-y-3">
            {conversation.messages.map((message) => (
              <div key={message.id} className="flex gap-3">
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  message.role === 'assistant' ? 'bg-[#3f8274] text-white' : 'bg-[#697a73] text-white'
                }`}>
                  {message.role === 'assistant' ? 'A' : 'U'}
                </div>
                <div className="flex-1 rounded-lg bg-muted px-3 py-2 text-sm">
                  <p className="text-foreground">{message.content}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{message.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
