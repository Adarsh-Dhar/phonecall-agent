import { useState, useEffect } from 'react';
import { getCalls, dialCall, acceptCall, declineCall, type Call } from '../api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff } from 'lucide-react';

export function BusinessCallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalls();
  }, []);

  const loadCalls = async () => {
    try {
      const data = await getCalls();
      setCalls(data);
    } catch (error) {
      console.error('Failed to load calls:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading calls...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Calls</h2>
      <div className="space-y-4">
        {calls.length === 0 ? (
          <p className="text-muted-foreground">No calls yet</p>
        ) : (
          calls.map(call => (
            <Card key={call.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{call.contact.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {call.direction} • {call.status} • {new Date(call.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  {call.status === 'ringing' && (
                    <>
                      <Button size="sm" onClick={() => acceptCall(call.id)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => declineCall(call.id)}>
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
