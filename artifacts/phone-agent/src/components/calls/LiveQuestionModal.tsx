import { X, Send, LoaderCircle } from 'lucide-react';
import { useState } from 'react';
import { answerQuestion } from '@/lib/api/questions';

interface LiveQuestionData {
  queryId: string;
  callId: string;
  question: string;
  urgent: boolean;
}

export function LiveQuestionModal({
  liveQuestion,
  onClose,
}: {
  liveQuestion: LiveQuestionData | null;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!liveQuestion) return null;

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setSubmitting(true);
    try {
      await answerQuestion(liveQuestion.queryId, answer);
      onClose();
    } catch (error) {
      console.error('Error answering question:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div key={liveQuestion.queryId} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6b4fc8]">
              <Send size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Agent Needs Your Help</h2>
              {liveQuestion.urgent && (
                <span className="text-xs font-bold uppercase tracking-[.08em] text-red-600">
                  Urgent — during call
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-muted/30 p-4">
          <p className="text-sm font-medium">{liveQuestion.question}</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="Your answer…"
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            disabled={submitting}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!answer.trim() || submitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
          >
            {submitting ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
