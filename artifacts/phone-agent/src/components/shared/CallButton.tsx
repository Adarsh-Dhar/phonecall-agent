import { Phone as PhoneIcon } from 'lucide-react';

// CallButton — phone button that places a call, plus a status pill while
// the call is being connected (see StatusPill for the connecting state).
export function CallButton({ onCall }: { onCall: () => void }) {
  return (
    <button
      type="button"
      aria-label="Test call in browser"
      data-testid="button-call-contact"
      onClick={onCall}
      className="flex items-center gap-1.5 rounded-full border border-border bg-[#f6f3ed] px-3 py-1.5 text-[11px] font-bold text-[#3f8274] transition-all hover:-translate-y-0.5 hover:border-[#a7d0c1] hover:bg-[#edf7f1]"
    >
      <PhoneIcon size={13} />
      Call
    </button>
  );
}
