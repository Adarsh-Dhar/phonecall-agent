import { X } from 'lucide-react';

export function Preferences({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Your preferences</h2>
          <button type="button" data-testid="button-close-preferences" onClick={onClose} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
            <X size={20} />
          </button>
        </div>
        <p className="mb-4 text-sm text-[hsl(var(--muted-foreground))]">
          I'll help you think things through and keep the next step clear. I'm your personal admin assistant, ready to help with everyday tasks.
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Concise responses</span><span className="h-5 w-5 rounded-full bg-[#2854cc]" /></div>
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Ask clarifying questions</span><span className="h-5 w-5 rounded-full bg-[#2854cc]" /></div>
          <div className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] p-3"><span className="text-sm">Confirm before taking action</span><span className="h-5 w-5 rounded-full bg-[#e8e8e8]" /></div>
        </div>
        <button
          type="button"
          data-testid="button-save-preferences"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#2854cc] py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4]"
        >
          Save preferences
        </button>
      </div>
    </div>
  );
}
