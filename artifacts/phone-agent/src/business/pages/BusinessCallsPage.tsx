import { useState, useEffect } from 'react';
import { getCalls, acceptCall, declineCall, getCallMessages, type Call } from '../api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, PhoneOff, RefreshCw, FileText } from 'lucide-react';

export function BusinessCallsPage({ onCallAccepted, onDial }: { onCallAccepted: (callId: string) => void; onDial: (contactId: string) => void }) {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [callMessages, setCallMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

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

  const handleAcceptCall = async (callId: string) => {
    try {
      await acceptCall(callId);
      onCallAccepted(callId);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleViewCallLog = async (call: Call) => {
    if (call.status !== 'completed') return;
    setSelectedCall(call);
    setLoadingMessages(true);
    try {
      const messages = await getCallMessages(call.id);
      setCallMessages(messages);
    } catch (error) {
      console.error('Failed to load call messages:', error);
      setCallMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'ringing': return 'text-blue-600';
      case 'missed': return 'text-yellow-600';
      case 'declined': return 'text-red-600';
      case 'in-progress': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getDirectionLabel = (direction: string) => {
    return direction === 'inbound' ? 'Incoming' : 'Outgoing';
  };

  if (loading) {
    return <div className="text-center py-8">Loading calls...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Call History</h2>
        <Button variant="outline" size="sm" onClick={loadCalls}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {calls.length === 0 ? (
          <p className="text-muted-foreground">No calls yet</p>
        ) : (
          calls.map(call => (
            <Card key={call.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => handleViewCallLog(call)}>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{call.contact.displayName || call.contact.name}</h3>
                    <span className={`text-xs font-medium ${getStatusColor(call.status)}`}>
                      {call.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getDirectionLabel(call.direction)}
                    </span>
                    {call.status === 'completed' && (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {new Date(call.createdAt).toLocaleString()}
                  </p>
                  {call.durationSec && (
                    <p className="text-xs text-muted-foreground">
                      Duration: {Math.floor(call.durationSec / 60)}m {call.durationSec % 60}s
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {call.status === 'ringing' && (
                    <>
                      <Button size="sm" onClick={() => handleAcceptCall(call.id)}>
                        <Phone className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => declineCall(call.id)}>
                        <PhoneOff className="h-4 w-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}
                  {call.status !== 'ringing' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDial(call.contactId)}
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Call Again
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Call Log</DialogTitle>
          </DialogHeader>
          {selectedCall && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Called: {selectedCall.contact.displayName || selectedCall.contact.name}</span>
                <span>•</span>
                <span>{new Date(selectedCall.createdAt).toLocaleString()}</span>
                {selectedCall.durationSec && (
                  <>
                    <span>•</span>
                    <span>Duration: {Math.floor(selectedCall.durationSec / 60)}m {selectedCall.durationSec % 60}s</span>
                  </>
                )}
              </div>
              {loadingMessages ? (
                <div className="text-center py-8">Loading call log...</div>
              ) : callMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No call log available</div>
              ) : (
                <div className="space-y-2">
                  {callMessages.map((msg, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg">
                      <div className="text-sm font-medium">{msg.role || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">{msg.content || msg.text || 'No content'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
