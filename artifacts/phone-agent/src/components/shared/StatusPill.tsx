export function StatusPill({ busy }: { busy: boolean }) {
  return (
    <span
      data-testid="status-agent"
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.12em] ${busy ? 'bg-[#fff0df] text-[#af5c1c]' : 'bg-[#dcefe9] text-[#216457]'}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${busy ? 'bg-[#e58a34] animate-breathe' : 'bg-[#3b9a83]'}`} />
      {busy ? 'Thinking' : 'Online'}
    </span>
  );
}
