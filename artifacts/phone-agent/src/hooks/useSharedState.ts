import { useEffect, useState } from 'react';

/**
 * Shared layout state hook — manages the header's live date string and
 * whether the preferences modal is open. Used by every top-level page so
 * the header stays consistent across the app.
 */
export function useSharedState() {
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
      const dateStr = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
      const timeStr = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
      setCurrentDate(`${dateStr} • ${timeStr}`);
    };
    updateDate();
    const interval = setInterval(updateDate, 1000);
    return () => clearInterval(interval);
  }, []);

  return { prefsOpen, setPrefsOpen, currentDate };
}
