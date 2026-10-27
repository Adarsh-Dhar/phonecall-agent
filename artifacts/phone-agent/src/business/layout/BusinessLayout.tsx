import { Link } from 'wouter';
import { Phone, Users, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';

export function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
      const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
      const dateStr = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
      const timeStr = new Intl.DateTimeFormat('en-US', timeOptions).format(now);
      setCurrentDateTime(`${dateStr} • ${timeStr}`);
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">Phone Agent - Business</h1>
            <span className="text-sm text-muted-foreground">{currentDateTime}</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/calls">
              <Button variant="ghost" size="sm">
                <Phone className="h-4 w-4 mr-2" />
                Calls
              </Button>
            </Link>
            <Link href="/contacts">
              <Button variant="ghost" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Contacts
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
