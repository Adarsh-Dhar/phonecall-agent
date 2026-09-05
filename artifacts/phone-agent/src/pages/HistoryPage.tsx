import { useCallback, useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, ListTodo, LoaderCircle, RefreshCw,
} from 'lucide-react';
import { Link } from 'wouter';
import * as api from '@/lib/api';
import { AppLayout } from '@/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { TaskRowWithContact, ACTIVE_STATUSES } from '@/components/tasks';

export function HistoryPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [tasks, setTasks] = useState<api.Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  // Calendar state
  const [calendarItems, setCalendarItems] = useState<api.Task[]>([]);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<api.GoogleCalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [googleAuthStatus, setGoogleAuthStatus] = useState<api.GoogleAuthStatus | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      // Load tasks with due dates
      const allTasks = await api.fetchTasks();
      const dated = allTasks
        .filter((t) => t.dueDate && t.status !== 'cancelled')
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
      setCalendarItems(dated);
      console.log('[HistoryPage] Loaded calendar items:', dated.length);

      // Load Google Calendar events if connected
      const status = await api.fetchGoogleAuthStatus();
      setGoogleAuthStatus(status);
      console.log('[HistoryPage] Google auth status:', status);

      if (status.connected) {
        try {
          const { events } = await api.fetchGoogleCalendarEvents();
          console.log('[HistoryPage] Loaded Google Calendar events:', events.length);
          setGoogleCalendarEvents(events);
        } catch (err) {
          console.error('[HistoryPage] Failed to load Google Calendar events:', err);
          setGoogleCalendarEvents([]);
        }
      } else {
        console.log('[HistoryPage] Google Calendar not connected');
        setGoogleCalendarEvents([]);
      }
    } catch (err) {
      console.error('[HistoryPage] Failed to load calendar items:', err);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  const loadGoogleAuthStatus = useCallback(async () => {
    try {
      const status = await api.fetchGoogleAuthStatus();
      setGoogleAuthStatus(status);
    } catch (err) {
      console.error('[HistoryPage] Failed to load Google auth status:', err);
    }
  }, []);

  const handleConnectGoogleCalendar = async () => {
    await api.connectGoogleCalendar();
  };

  const handleSyncCalendar = async () => {
    setSyncing(true);
    try {
      await api.syncCalendar();
      await loadCalendar();
      await loadGoogleAuthStatus();
    } catch (err) {
      console.error('[HistoryPage] Failed to sync calendar:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      await api.disconnectGoogleCalendar();
      setGoogleAuthStatus(null);
    } catch (err) {
      console.error('[HistoryPage] Failed to disconnect Google Calendar:', err);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const targetYear = date.getFullYear();
    const targetMonth = date.getMonth();
    const targetDay = date.getDate();

    const taskEvents = calendarItems.filter(t => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      return taskDate.getFullYear() === targetYear &&
             taskDate.getMonth() === targetMonth &&
             taskDate.getDate() === targetDay;
    }).map(t => ({ id: t.id, title: t.title, summary: t.title, type: 'task' as const }));

    const googleEvents = googleCalendarEvents.filter(e => {
      let eventDate: Date | undefined;
      if (e.start?.date) {
        // All-day event - parse the date string directly
        const [year, month, day] = e.start.date.split('-').map(Number);
        eventDate = new Date(year, month - 1, day); // month is 0-indexed in JS
      } else if (e.start?.dateTime) {
        // Time-based event - parse the datetime
        eventDate = new Date(e.start.dateTime);
      }

      if (!eventDate) return false;

      return eventDate.getFullYear() === targetYear &&
             eventDate.getMonth() === targetMonth &&
             eventDate.getDate() === targetDay;
    }).map(e => ({ id: e.id, title: e.summary, summary: e.summary, type: 'google' as const }));

    return [...taskEvents, ...googleEvents];
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  useEffect(() => { void loadTasks(); }, [loadTasks]);
  useEffect(() => { void loadCalendar(); }, [loadCalendar]);

  const handleStatusChange = async (taskId: string, status: api.TaskStatus) => {
    try {
      const updated = await api.updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => t.id === taskId ? updated : t));
    } catch { /* no-op */ }
  };

  const visible = filter === 'active'
    ? tasks.filter((t) => ACTIVE_STATUSES.includes(t.status as api.TaskStatus))
    : tasks;

  const suggestedCount = tasks.filter((t) => t.status === 'suggested').length;

  return (
    <AppLayout title="Tasks" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12">
        <Link href="/contacts" className="mb-8 block text-xs font-bold text-[#3159c4] hover:underline">← Back to contacts</Link>
        <div className="mb-8">
          <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">All contacts</p>
          <h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Tasks</h1>
        </div>

        {/* Header row: filter tabs + refresh */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {(['active', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.08em] transition-colors ${
                  filter === f ? 'bg-[#2854cc] text-white' : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
                }`}
              >
                {f === 'active' ? 'Active' : 'All'}
              </button>
            ))}
            {suggestedCount > 0 && (
              <span className="ml-1 text-[10px] text-[#995500]">{suggestedCount} suggested</span>
            )}
          </div>
          <button
            type="button"
            aria-label="Refresh tasks"
            onClick={() => void loadTasks()}
            className="grid h-7 w-7 place-items-center rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <LoaderCircle size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#eef4f0] text-[#4a8978]">
              <ListTodo size={24} />
            </div>
            <p className="mt-4 font-bold text-[#203039]">
              {filter === 'active' ? 'No active tasks' : 'No tasks yet'}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              {filter === 'active' ? 'Switch to All to see completed tasks.' : 'Tasks will appear here after your first conversation.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visible.map((task) => (
              <TaskRowWithContact key={task.id} task={task} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>

      {/* Calendar Section */}
      <div className="mt-8 rounded-[22px] border border-card-border bg-card p-5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff0df] text-[#af5c1c]">
            <CalendarIcon size={15} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Calendar</h3>
            <p className="text-[10px] text-[#af5c1c]">{calendarItems.filter((t) => t.status !== 'done').length + googleCalendarEvents.length} upcoming</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {!googleAuthStatus?.connected ? (
              <button
                type="button"
                onClick={handleConnectGoogleCalendar}
                className="flex items-center gap-1.5 rounded-full bg-[#3f8274] px-3 py-1.5 text-[10px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#356c61]"
              >
                <CalendarIcon size={11} />
                Connect Google Calendar
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSyncCalendar}
                  disabled={syncing}
                  className="grid h-7 w-7 place-items-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={handleDisconnectGoogleCalendar}
                  className="text-[10px] font-bold text-muted-foreground hover:text-foreground"
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="mt-4">
          {/* Calendar Header with Navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="text-lg font-bold">
              {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </h2>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="mb-2 grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-[10px] font-bold text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {calendarLoading && calendarItems.length === 0 && googleCalendarEvents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <LoaderCircle size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="h-20" />;
                }

                const events = getEventsForDate(date);
                const today = isToday(date);

                return (
                  <div
                    key={date.toISOString()}
                    className={`min-h-20 rounded-lg border p-1 transition-colors ${
                      today
                        ? 'bg-[#eef1fb] border-[#3159c4]'
                        : 'bg-card border-border hover:bg-muted'
                    }`}
                  >
                    <div className={`text-center text-xs font-medium ${
                      today ? 'text-[#3159c4]' : 'text-muted-foreground'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      {events.slice(0, 3).map((event, i) => (
                        <div
                          key={i}
                          className={`truncate rounded px-1 py-0.5 text-[8px] font-medium ${
                            event.type === 'task'
                              ? 'bg-[#fbfaf6] text-[#3f8274]'
                              : 'bg-[#f0f7ff] text-[#3159c4]'
                          }`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <div className="text-[8px] text-muted-foreground">
                          +{events.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
