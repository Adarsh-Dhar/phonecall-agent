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
      const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      setCurrentDate(new Intl.DateTimeFormat('en-US', options).format(now));
    };
    updateDate();
    const interval = setInterval(updateDate, 60000);
    return () => clearInterval(interval);
  }, []);

  return { prefsOpen, setPrefsOpen, currentDate };
}
