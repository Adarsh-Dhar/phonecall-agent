import { useCallback, useEffect, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, LoaderCircle, Phone, RefreshCw, X, Clock, Info } from 'lucide-react';
import * as api from '@/lib/api';
import { getDaysInMonth, isToday } from './calendarDateUtils';
import { TestCallWidget } from '@/individual/components/TestCallWidget';

type CalendarEvent = { id: string; title: string; type: 'task' | 'google'; contactId?: string; start?: string | null; end?: string | null; description?: string | null };

/**
 * Calendar card on the History ("Tasks") page: task due-dates + connected
 * Google Calendar events shown in a month grid, plus connect/sync/disconnect
 * controls. Manages its own state — split out of HistoryPage.tsx, which
 * also owned the unrelated task-list section.
 */
export function CalendarSection() {
  const [calendarItems, setCalendarItems] = useState<api.Task[]>([]);
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState<api.GoogleCalendarEvent[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(true);
  const [googleAuthStatus, setGoogleAuthStatus] = useState<api.GoogleAuthStatus | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [callingTask, setCallingTask] = useState<api.Task | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDateTime, setEditedDateTime] = useState('');
  const [editError, setEditError] = useState('');

  const loadCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      // Check Google Calendar auth status
      try {
        const status = await api.fetchGoogleAuthStatus();
        setGoogleAuthStatus(status);
      } catch (err) {
        console.log('[CalendarSection] Failed to fetch Google auth status');
        setGoogleAuthStatus({ connected: false, hasAuth: false, expired: false });
      }

      // Load tasks with due dates (handle 404 gracefully if no contacts exist)
      let dated: api.Task[] = [];
      try {
        const allTasks = await api.fetchTasks();
        console.log('[CalendarSection] All tasks fetched:', allTasks.length, allTasks);
        dated = allTasks
          .filter((t) => t.dueDate && t.status !== 'cancelled')
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
        console.log('[CalendarSection] Loaded calendar items:', dated.length, dated);
      } catch (err) {
        console.log('[CalendarSection] No tasks found or no contacts yet');
        dated = [];
      }
      setCalendarItems(dated);

      // Load Google Calendar events (all users are connected via Google OAuth)
      try {
        const { events } = await api.fetchGoogleCalendarEvents();
        console.log('[CalendarSection] Loaded Google Calendar events:', events.length);
        setGoogleCalendarEvents(events);
      } catch (err: any) {
        console.error('[CalendarSection] Failed to load Google Calendar events:', err);
        console.error('[CalendarSection] Error details:', err.message, err?.response?.status);
        // If unauthorized (401), it means the session expired - don't show error
        // If other error, still show empty calendar
        setGoogleCalendarEvents([]);
      }
    } catch (err) {
      console.error('[CalendarSection] Failed to load calendar items:', err);
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  useEffect(() => { void loadCalendar(); }, [loadCalendar]);

  const handleSyncCalendar = async () => {
    setSyncing(true);
    try {
      await api.syncCalendar();
      await loadCalendar();
    } catch (err) {
      console.error('[CalendarSection] Failed to sync calendar:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnectGoogleCalendar = async () => {
    try {
      await api.disconnectGoogleCalendar();
      await loadCalendar();
    } catch (err) {
      console.error('[CalendarSection] Failed to disconnect Google Calendar:', err);
    }
  };

  const handleConnectGoogleCalendar = async () => {
    try {
      await api.connectGoogleCalendar();
    } catch (err) {
      console.error('[CalendarSection] Failed to connect Google Calendar:', err);
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

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const targetYear = date.getUTCFullYear();
    const targetMonth = date.getUTCMonth();
    const targetDay = date.getUTCDate();

    const taskEvents = calendarItems.filter(t => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      return taskDate.getUTCFullYear() === targetYear &&
             taskDate.getUTCMonth() === targetMonth &&
             taskDate.getUTCDate() === targetDay;
    }).map(t => ({ id: t.id, title: t.title, type: 'task' as const, contactId: t.contactId, start: t.dueDate, description: t.description }));

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

      return eventDate.getUTCFullYear() === targetYear &&
             eventDate.getUTCMonth() === targetMonth &&
             eventDate.getUTCDate() === targetDay;
    }).map(e => ({ id: e.id, title: e.summary, type: 'google' as const, start: e.start?.dateTime || e.start?.date || undefined, end: e.end?.dateTime || e.end?.date || undefined, description: e.description }));

    // Deduplicate: if a Google Calendar event matches a task by title and time, prefer the task
    // (tasks have more detail like contactId, description, and are editable)
    const taskSignatures = new Set(
      taskEvents.map(t => {
        const taskDate = new Date(t.start!);
        return `${t.title.toLowerCase()}-${taskDate.toISOString()}`;
      })
    );

    const deduplicatedGoogleEvents = googleEvents.filter(e => {
      const eventDate = new Date(e.start!);
      const signature = `${e.title.toLowerCase()}-${eventDate.toISOString()}`;
      return !taskSignatures.has(signature);
    });

    return [...taskEvents, ...deduplicatedGoogleEvents];
  };

  // Get total count of deduplicated upcoming events
  const getUpcomingCount = useCallback(() => {
    const activeTasks = calendarItems.filter(t => t.status !== 'done' && t.dueDate);
    const taskSignatures = new Set(
      activeTasks.map(t => {
        const taskDate = new Date(t.dueDate!);
        return `${t.title.toLowerCase()}-${taskDate.toISOString()}`;
      })
    );

    const deduplicatedGoogleEvents = googleCalendarEvents.filter(e => {
      const eventDate = new Date(e.start?.dateTime || e.start?.date || '');
      const signature = `${e.summary.toLowerCase()}-${eventDate.toISOString()}`;
      return !taskSignatures.has(signature);
    });

    return activeTasks.length + deduplicatedGoogleEvents.length;
  }, [calendarItems, googleCalendarEvents]);

  return (
    <div className="mt-8 rounded-[22px] border border-card-border bg-card p-5">
      <div className="flex items-center gap-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff0df] text-[#af5c1c]">
          <CalendarIcon size={15} />
        </div>
        <div>
          <h3 className="text-sm font-bold tracking-tight">Calendar</h3>
          <p className="text-[10px] text-[#af5c1c]">{getUpcomingCount()} upcoming</p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          {googleAuthStatus?.connected ? (
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
          ) : (
            <button
              type="button"
              onClick={handleConnectGoogleCalendar}
              className="text-[10px] font-bold text-[#3159c4] hover:text-[#2a4aa3]"
            >
              Connect Google Calendar
            </button>
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
                    {events.slice(0, 3).map((event, i) => {
                      const callable = event.type === 'task' && event.contactId;
                      return (
                        <div
                          key={i}
                          role="button"
                          onClick={() => setSelectedEvent(event)}
                          className={`group flex items-center gap-1 truncate rounded px-1 py-0.5 text-[8px] font-medium cursor-pointer ${
                            event.type === 'task'
                              ? 'bg-[#fbfaf6] text-[#3f8274] hover:bg-[#edf9f5]'
                              : 'bg-[#f0f7ff] text-[#3159c4] hover:bg-[#e0efff]'
                          }`}
                          title={event.title}
                        >
                          {callable && <Phone size={8} className="shrink-0 opacity-60 group-hover:opacity-100" />}
                          <span className="truncate">{event.title}</span>
                        </div>
                      );
                    })}
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

      {callingTask && callingTask.contactId && (
        <TestCallWidget
          contactId={callingTask.contactId}
          taskId={callingTask.id}
          taskTitle={callingTask.title}
          onClose={() => setCallingTask(null)}
        />
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="grid h-8 w-8 place-items-center rounded-xl bg-[#fff0df] text-[#af5c1c]">
                  <Info size={15} />
                </div>
                <h3 className="text-lg font-bold">{isEditing ? 'Edit Date & Time' : 'Event Details'}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedEvent(null);
                  setIsEditing(false);
                  setEditedDateTime('');
                }}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground"
              >
                <X size={20} />
              </button>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">New Date & Time</label>
                  <input
                    type="datetime-local"
                    value={editedDateTime}
                    onChange={(e) => {
                      setEditedDateTime(e.target.value);
                      setEditError('');
                    }}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  {editError && (
                    <p className="mt-1 text-xs text-red-500">{editError}</p>
                  )}
                </div>
                <div className="flex gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditError('');
                    }}
                    className="flex-1 rounded-xl border border-card-border py-3 text-sm font-bold text-foreground transition-all hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!editedDateTime || selectedEvent.type !== 'task') return;
                      
                      const newDate = new Date(editedDateTime);
                      const now = new Date();
                      
                      if (newDate <= now) {
                        setEditError('Date and time must be in the future');
                        return;
                      }
                      
                      try {
                        const task = calendarItems.find((t) => t.id === selectedEvent.id);
                        if (!task) {
                          setEditError('Task not found in calendar');
                          return;
                        }
                        if (!task.contactId) {
                          setEditError('Task must have a contact to be edited');
                          return;
                        }
                        
                        await api.updateTask(task.id, { dueDate: newDate.toISOString() });
                        await loadCalendar();
                        setSelectedEvent(null);
                        setIsEditing(false);
                        setEditedDateTime('');
                        setEditError('');
                      } catch (err: any) {
                        console.error('Failed to update task:', err);
                        setEditError(err.message || 'Failed to update. Please try again.');
                      }
                    }}
                    className="flex-1 rounded-xl bg-[#2854cc] py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4] active:translate-y-0"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Subject</p>
                <p className="text-sm font-semibold">{selectedEvent.title}</p>
              </div>

              {selectedEvent.start && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                    <Clock size={12} />
                    Time
                  </p>
                  <p className="text-sm">
                    {selectedEvent.start.includes('T')
                      ? new Date(selectedEvent.start).toLocaleString(undefined, {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })
                      : new Date(selectedEvent.start).toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                    {selectedEvent.end && selectedEvent.start !== selectedEvent.end && (
                      <span className="text-muted-foreground">
                        {' – '}
                        {selectedEvent.end.includes('T')
                          ? new Date(selectedEvent.end).toLocaleString(undefined, {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })
                          : ''}
                      </span>
                    )}
                  </p>
                </div>
              )}

              {selectedEvent.description && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedEvent.description}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Type</p>
                <p className="text-sm">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${
                    selectedEvent.type === 'task'
                      ? 'bg-[#fbfaf6] text-[#3f8274]'
                      : 'bg-[#f0f7ff] text-[#3159c4]'
                  }`}>
                    {selectedEvent.type === 'task' ? 'Call' : 'Google Calendar Event'}
                  </span>
                  {selectedEvent.type === 'task' && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (Agent will call automatically at scheduled time)
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Status</p>
                <p className="text-sm">
                  {(() => {
                    const now = new Date();
                    const eventTime = selectedEvent.start ? new Date(selectedEvent.start) : null;
                    const task = selectedEvent.type === 'task' ? calendarItems.find((t) => t.id === selectedEvent.id) : null;
                    
                    // For tasks, use the actual task status
                    if (task) {
                      if (task.status === 'done') {
                        return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">Done</span>;
                      } else if (task.status === 'cancelled') {
                        return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">Cancelled</span>;
                      } else if (task.status === 'in_progress') {
                        return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">In Progress</span>;
                      }
                    }
                    
                    // For tasks without explicit status or Google events, check time
                    if (eventTime) {
                      if (eventTime < now) {
                        return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">Past</span>;
                      } else {
                        return <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-700">Pending</span>;
                      }
                    }
                    
                    return <span className="text-muted-foreground">Unknown</span>;
                  })()}
                </p>
              </div>

              {selectedEvent.type === 'task' && selectedEvent.contactId && (
                <div className="pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      const task = calendarItems.find((t) => t.id === selectedEvent.id);
                      if (task) {
                        setSelectedEvent(null);
                        setCallingTask(task);
                      }
                    }}
                    className="w-full rounded-xl bg-[#2854cc] py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#2148b4] active:translate-y-0 flex items-center justify-center gap-2"
                  >
                    <Phone size={16} />
                    Call Now
                  </button>
                </div>
              )}

              {/* Edit button for pending events - only for task events, not Google Calendar events */}
              {(() => {
                console.log('[CalendarSection] Checking edit button for event:', selectedEvent);
                
                if (selectedEvent.type !== 'task') {
                  console.log('[CalendarSection] Not a task event, skipping edit button');
                  return null;
                }
                
                const task = calendarItems.find((t) => t.id === selectedEvent.id);
                
                // Only show edit button if task exists
                if (!task) {
                  console.log('[CalendarSection] Task not found in calendarItems:', selectedEvent.id, 'Available tasks:', calendarItems.map(t => t.id));
                  return null;
                }
                
                // Show edit button if task is not done/cancelled/in_progress
                const isTaskEditable = task.status !== 'done' && task.status !== 'cancelled' && task.status !== 'in_progress';
                
                if (!isTaskEditable) {
                  console.log('[CalendarSection] Task is not editable:', task.status);
                  return null;
                }
                
                console.log('[CalendarSection] Showing edit button for task:', task.id);
                
                return (
                  <div className="pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setEditedDateTime(selectedEvent.start || '');
                        setIsEditing(true);
                      }}
                      className="w-full rounded-xl border border-card-border bg-muted py-3 text-sm font-bold text-foreground transition-all hover:bg-accent hover:text-accent-foreground flex items-center justify-center gap-2"
                    >
                      Edit Date & Time
                    </button>
                  </div>
                );
              })()}
            </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
