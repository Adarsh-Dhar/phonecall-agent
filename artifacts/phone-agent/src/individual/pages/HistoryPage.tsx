import { AppLayout } from '@/individual/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { TasksListSection } from '@/individual/components/history/TasksListSection';
import { CalendarSection } from '@/individual/components/calendar/CalendarSection';

export function HistoryPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();

  return (
    <AppLayout title="Tasks" onPrefsOpen={() => setPrefsOpen(true)} currentDate={currentDate} prefsOpen={prefsOpen} onPrefsClose={() => setPrefsOpen(false)}>
      <TasksListSection />
      <CalendarSection />
    </AppLayout>
  );
}
