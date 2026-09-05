import { useCallback, useEffect, useState } from 'react';
import { CircleHelp, LoaderCircle, Plus, RefreshCw, X } from 'lucide-react';
import * as api from '@/lib/api';

/**
 * Questions card on the Contact Detail page. Manages its own state (load,
 * create, answer, dismiss) scoped to a single contact — separate from the
 * global `components/questions/QueriesPanel`, which intentionally shows
 * questions across all contacts.
 */
export function ContactQuestionsCard({ contactId }: { contactId: string | undefined }) {
  const [questions, setQuestions] = useState<api.Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');

  const loadQuestions = useCallback(async () => {
    if (!contactId) return;
    setQuestionsLoading(true);
    try {
      const data = await api.fetchContactQuestions(contactId);
      setQuestions(data);
    } catch (err) {
      console.error('[ContactQuestionsCard] Failed to load questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  }, [contactId]);

  useEffect(() => { void loadQuestions(); }, [loadQuestions]);

  const handleCreateQuestion = async () => {
    if (!newQuestionText.trim() || !contactId) return;
    try {
      const question = await api.createQuestion({
        question: newQuestionText.trim(),
        conversationId: '', // Will be set by backend
        contactId,
      });
      setQuestions((prev) => [...prev, question]);
      setNewQuestionText('');
      setShowAddQuestion(false);
    } catch (err) {
      console.error('[ContactQuestionsCard] Failed to create question:', err);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    try {
      const updated = await api.answerQuestion(questionId, answer);
      setQuestions((prev) => prev.map((q) => q.id === questionId ? updated : q));
    } catch (err) {
      console.error('[ContactQuestionsCard] Failed to answer question:', err);
    }
  };

  const handleDismissQuestion = async (questionId: string) => {
    try {
      const updated = await api.dismissQuestion(questionId);
      setQuestions((prev) => prev.map((q) => q.id === questionId ? updated : q));
    } catch (err) {
      console.error('[ContactQuestionsCard] Failed to dismiss question:', err);
    }
  };

  return (
    <div className="mt-5 rounded-[22px] border border-card-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#f0eaff] text-[#6b4fc8]">
          <CircleHelp size={15} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight">Questions</h3>
          <p className="text-[10px] text-[#7a4fc8]">{questions.filter((q) => q.status === 'pending').length} pending</p>
        </div>
        <button
          type="button"
          aria-label="Refresh questions"
          onClick={() => void loadQuestions()}
          className="ml-auto grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <RefreshCw size={13} className={questionsLoading ? 'animate-spin' : ''} />
        </button>
        <button
          type="button"
          aria-label="Add question"
          onClick={() => setShowAddQuestion((v) => !v)}
          className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
        >
          <Plus size={14} />
        </button>
      </div>

      {showAddQuestion && (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            type="text"
            value={newQuestionText}
            onChange={(e) => setNewQuestionText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleCreateQuestion(); if (e.key === 'Escape') setShowAddQuestion(false); }}
            placeholder="New question…"
            className="flex-1 rounded-xl border border-border bg-[#fbfaf6] px-3 py-2 text-xs outline-none focus:border-[#4168e5] focus:ring-2 focus:ring-[#4168e5]/10"
          />
          <button
            type="button"
            onClick={() => void handleCreateQuestion()}
            disabled={!newQuestionText.trim()}
            className="rounded-xl bg-[#6b4fc8] px-3 py-2 text-xs font-bold text-white hover:bg-[#5a3fb8] disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {questionsLoading && questions.length === 0 ? (
          <div className="flex items-center justify-center py-6">
            <LoaderCircle size={14} className="animate-spin text-muted-foreground" />
          </div>
        ) : questions.length === 0 ? (
          <p className="py-3 text-center text-xs text-muted-foreground">No questions yet.</p>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className={`rounded-xl border px-4 py-3 ${
                question.status === 'pending' ? 'border-[#d4c4ff] bg-[#f8f5ff]' : 'border-border bg-muted/40 opacity-60'
              }`}
            >
              <p className="text-xs font-semibold">{question.question}</p>
              {question.status === 'pending' ? (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Your answer…"
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.currentTarget.value.trim()) void handleAnswerQuestion(question.id, e.currentTarget.value); }}
                    className="flex-1 rounded-lg border border-[#c4b0f0] bg-white px-3 py-1.5 text-xs outline-none focus:border-[#6b4fc8] focus:ring-2 focus:ring-[#6b4fc8]/10"
                  />
                  <button
                    type="button"
                    onClick={() => void handleDismissQuestion(question.id)}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground">↳ {question.answer || 'Dismissed'}</p>
                  <span className="text-[9px] font-bold uppercase tracking-[.1em] text-muted-foreground">
                    {question.status}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
