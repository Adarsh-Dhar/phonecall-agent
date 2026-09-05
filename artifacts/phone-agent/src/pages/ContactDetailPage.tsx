import { useCallback, useEffect, useState } from 'react';
import { Check, CircleHelp, ListTodo, LoaderCircle, Paperclip, Plus, RefreshCw, X } from 'lucide-react';
import { Link, useParams } from 'wouter';
import * as api from '@/lib/api';
import type { Contact } from '@/lib/api';
import { AppLayout } from '@/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { Avatar } from '@/components/shared';

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [questions, setQuestions] = useState<api.Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');

  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    api.fetchContacts()
      .then((all) => {
        const match = all.find((c) => c.id === id);
        if (match) {
          setContact(match);
        } else {
          setNotFound(true);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const loadTasks = useCallback(async () => {
    if (!id) return;
    setTasksLoading(true);
    try {
      const data = await api.fetchContactTasks(id);
      setTasks(data);
    } catch (err) {
      console.error('[ContactDetailPage] Failed to load tasks:', err);
    } finally {
      setTasksLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadTasks(); }, [loadTasks]);

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !id) return;
    try {
      const task = await api.createTask({
        title: newTaskTitle.trim(),
        conversationId: '', // Will be set by backend
        contactId: id,
      });
      setTasks((prev) => [...prev, task]);
      setNewTaskTitle('');
      setShowAddTask(false);
    } catch (err) {
      console.error('[ContactDetailPage] Failed to create task:', err);
    }
  };

  const handleTaskStatusChange = async (taskId: string, status: api.TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch (err) {
      console.error('[ContactDetailPage] Failed to update task:', err);
    }
  };

  const loadQuestions = useCallback(async () => {
    if (!id) return;
    setQuestionsLoading(true);
    try {
      const data = await api.fetchContactQuestions(id);
      setQuestions(data);
    } catch (err) {
      console.error('[ContactDetailPage] Failed to load questions:', err);
    } finally {
      setQuestionsLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadQuestions(); }, [loadQuestions]);

  const handleCreateQuestion = async () => {
    if (!newQuestionText.trim() || !id) return;
    try {
      const question = await api.createQuestion({
        question: newQuestionText.trim(),
        conversationId: '', // Will be set by backend
        contactId: id,
      });
      setQuestions((prev) => [...prev, question]);
      setNewQuestionText('');
      setShowAddQuestion(false);
    } catch (err) {
      console.error('[ContactDetailPage] Failed to create question:', err);
    }
  };

  const handleAnswerQuestion = async (questionId: string, answer: string) => {
    try {
      const updated = await api.answerQuestion(questionId, answer);
      setQuestions((prev) => prev.map((q) => q.id === questionId ? updated : q));
    } catch (err) {
      console.error('[ContactDetailPage] Failed to answer question:', err);
    }
  };

  const handleDismissQuestion = async (questionId: string) => {
    try {
      const updated = await api.dismissQuestion(questionId);
      setQuestions((prev) => prev.map((q) => q.id === questionId ? updated : q));
    } catch (err) {
      console.error('[ContactDetailPage] Failed to dismiss question:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      // Since there's no file upload API yet, we'll just store them locally for now
      setFiles((prev) => [...prev, ...selectedFiles]);
      console.log('[ContactDetailPage] Files selected:', selectedFiles);
    } catch (err) {
      console.error('[ContactDetailPage] Failed to upload files:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <AppLayout title="Contact" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-[720px] px-5 py-8 md:px-10 md:py-12">
        <Link href="/contacts" className="mb-8 block text-xs font-bold text-[#3159c4] hover:underline">← Back to contacts</Link>

        {loading ? (
          <div className="flex items-center justify-center py-20">Loading contact…</div>
        ) : notFound || !contact ? (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">This contact doesn't exist.</p>
          </div>
        ) : (
          <div className="rounded-[24px] border border-[hsl(var(--card-border))] bg-card p-7 md:p-9">
            <div className="flex items-center gap-4">
              <Avatar contact={contact} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-3xl tracking-tight">{contact.name}</h1>
                  <span className={`h-2 w-2 shrink-0 rounded-full ${contact.online ? 'bg-[#5bc4a3]' : 'bg-[#879a94]'}`} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{contact.business}</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#edf1ec] px-3 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#58645f]">
                {contact.category}
              </span>
              <span className="rounded-full bg-[#edf1ec] px-3 py-1 text-[10px] font-bold uppercase tracking-[.07em] text-[#58645f]">
                {contact.online ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="mt-7 space-y-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Phone</p>
                <p className="mt-1 text-sm">{contact.phone}</p>
              </div>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[.18em] text-muted-foreground">Description</p>
                <p className="mt-1 text-sm leading-6 text-[#34443f]">{contact.note || 'No description yet.'}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && contact && (
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
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!loading && contact && (
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
        )}

        {!loading && contact && (
          <div className="mt-5 rounded-[22px] border border-card-border bg-card p-5">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#e8f4fd] text-[#3b82f6]">
                <Paperclip size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">File Dump</h3>
                <p className="text-[10px] text-[#3b82f6]">{files.length} files</p>
              </div>
            </div>

            <div className="mt-4">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-[#fbfaf6] px-4 py-6 text-center transition-colors hover:border-[#3b82f6] hover:bg-[#f0f7ff]">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <LoaderCircle size={16} className="animate-spin text-[#3b82f6]" />
                ) : (
                  <>
                    <Paperclip size={16} className="text-[#3b82f6]" />
                    <span className="text-xs text-muted-foreground">
                      Drop files here or click to upload (PDF, TXT, Excel, images)
                    </span>
                  </>
                )}
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-border bg-[#fbfaf6] px-3 py-2.5"
                  >
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#e8f4fd] text-[#3b82f6]">
                      <Paperclip size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(index)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-[#fde8e8] hover:text-[#b44343]"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
