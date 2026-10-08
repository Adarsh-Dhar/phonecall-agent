import { useState, useEffect } from 'react';
import { getContacts, deleteContact, type Contact } from '../api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { BusinessAddContactModal } from '../components/BusinessAddContactModal';

export function BusinessContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center py-8">Loading contacts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Contacts</h2>
        <BusinessAddContactModal onContactAdded={loadContacts} />
      </div>

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
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteContact(contact.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
