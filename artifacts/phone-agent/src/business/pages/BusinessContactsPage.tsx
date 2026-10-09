import { useState, useEffect } from 'react';
import { getContacts, deleteContact, type Contact } from '../api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Phone } from 'lucide-react';
import { BusinessAddContactModal } from '../components/BusinessAddContactModal';

export function BusinessContactsPage({ onCall }: { onCall: (contactId: string) => void }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState<string | null>(null);
  const [callError, setCallError] = useState<string | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      await deleteContact(contactId);
      loadContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
    }
  };

  const handleCall = async (contactId: string) => {
    setCalling(contactId);
    setCallError(null);
    try {
      await onCall(contactId);
    } catch (error) {
      console.error('Failed to call:', error);
      setCallError(error instanceof Error ? error.message : 'Failed to initiate call');
    } finally {
      setCalling(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contacts</h2>
        <BusinessAddContactModal onContactAdded={loadContacts} />
      </div>

      {callError && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
          {callError}
        </div>
      )}

      <div className="space-y-4">
        {contacts.length === 0 ? (
          <p className="text-muted-foreground">No contacts yet</p>
        ) : (
          contacts.map(contact => (
            <Card key={contact.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{contact.name}</h3>
                  <p className="text-sm text-muted-foreground">{contact.business}</p>
                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {contact.online ? (
                      <span className="text-green-600">Online</span>
                    ) : (
                      <span className="text-yellow-600">Offline (call will be marked as missed)</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleCall(contact.id)}
                    disabled={calling === contact.id}
                    title={contact.online ? 'Contact is online' : 'Contact is offline - call will be marked as missed'}
                  >
                    {calling === contact.id ? 'Calling...' : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteContact(contact.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
