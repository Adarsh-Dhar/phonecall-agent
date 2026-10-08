import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { addContactFromAccount } from '../api';
import { Plus } from 'lucide-react';
import { searchAccounts } from '../api';

interface BusinessAddContactModalProps {
  onContactAdded: () => void;
}

export function BusinessAddContactModal({ onContactAdded }: BusinessAddContactModalProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const results = await searchAccounts(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (accountId: string) => {
    try {
      await addContactFromAccount(accountId);
      setOpen(false);
      setSearchQuery('');
      setSearchResults([]);
      onContactAdded();
    } catch (error) {
      console.error('Failed to add contact:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Individual Contact</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {loading ? (
              <p className="text-center text-muted-foreground">Searching...</p>
            ) : searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground">
                {searchQuery.length < 2 ? 'Type at least 2 characters to search' : 'No results found'}
              </p>
            ) : (
              searchResults.map(account => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-2 rounded hover:bg-muted cursor-pointer"
                  onClick={() => handleAddContact(account.id)}
                >
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-muted-foreground">{account.email}</p>
                  </div>
                  <Button size="sm">Add</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
