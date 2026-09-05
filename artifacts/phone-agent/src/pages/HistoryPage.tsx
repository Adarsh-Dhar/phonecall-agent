import { AppLayout } from '@/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { TasksListSection } from '@/components/history/TasksListSection';
import { CalendarSection } from '@/components/calendar/CalendarSection';

export function HistoryPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();

  return (
    <AppLayout title="Tasks" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <TasksListSection />
      <CalendarSection />
    </AppLayout>
  );
}
