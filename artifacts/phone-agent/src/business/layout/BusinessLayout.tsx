import { Link } from 'wouter';
import { Phone, Users, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Phone Agent - Business</h1>
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
