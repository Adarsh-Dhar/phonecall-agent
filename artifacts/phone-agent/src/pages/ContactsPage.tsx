import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { UserPlus } from 'lucide-react';
import * as api from '@/lib/api';
import type { Contact } from '@/lib/api';
import { AppLayout } from '@/components/layout';
import { useSharedState } from '@/hooks/useSharedState';
import { Avatar } from '@/components/shared';
import { AddContactModal } from '@/components/contact/AddContactModal';

export function ContactsPage() {
  const { prefsOpen, setPrefsOpen, currentDate } = useSharedState();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    api.fetchContacts().then(setContacts).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleContactAdded = (contact: Contact) => {
    setContacts((prev) => [contact, ...prev]);
  };

  return (
    <AppLayout
      title="Contacts"
      onPrefsOpen={() => setPrefsOpen(true)}
      currentDate={currentDate}
      prefsOpen={prefsOpen}
      onPrefsClose={() => setPrefsOpen(false)}
    >
      <div className="mx-auto max-w-[980px] px-5 py-8 md:px-10 md:py-12">
        {/* ── Page header ── */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[.2em] text-[#e26951]">Your network</p>
            <h1 className="mt-2 font-serif text-5xl tracking-[-.04em]">Contacts</h1>
          </div>

          {/* Add contact button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <UserPlus size={15} />
            Add contact
          </button>
        </div>

        {/* ── Contact list ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">Loading contacts…</div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <p className="text-sm text-muted-foreground">No contacts yet.</p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <UserPlus size={14} />
              Add your first contact
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <Link
                key={contact.id}
                href={`/contacts/${contact.id}`}
                className="flex w-full items-center gap-4 rounded-2xl border border-[hsl(var(--border))] bg-card p-5 transition-transform hover:-translate-y-0.5"
              >
                <Avatar contact={contact} />
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="font-bold">{contact.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{contact.business}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      contact.online ? 'bg-[#5bc4a3]' : 'bg-[#879a94]'
                    }`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {contact.online ? 'Online' : 'Offline'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ── Add contact modal ── */}
      {showAddModal && (
        <AddContactModal
          onClose={() => setShowAddModal(false)}
          onAdded={(contact) => {
            handleContactAdded(contact);
            setShowAddModal(false);
          }}
        />
      )}
    </AppLayout>
  );
}
