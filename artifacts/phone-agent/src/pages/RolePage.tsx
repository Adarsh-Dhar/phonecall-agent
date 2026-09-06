import { useState } from 'react';
import { useLocation } from 'wouter';
import { MessageCircle, User, Building2, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { setAccountRole } from '@/lib/api/auth';
import { useAuth } from '@/hooks/useAuth';

type Role = 'user' | 'service';

const ROLES: {
  id: Role;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  bullets: string[];
  accent: string;
}[] = [
  {
    id: 'user',
    icon: <User size={22} strokeWidth={2} />,
    title: 'Personal User',
    subtitle: 'I want to manage calls and tasks for myself',
    bullets: [
      'Add businesses and contacts to call on your behalf',
      'Get AI call summaries and task extraction',
      'Sync tasks straight to Google Calendar',
    ],
    accent: 'hsl(var(--accent))',
  },
  {
    id: 'service',
    icon: <Building2 size={22} strokeWidth={2} />,
    title: 'Service Provider',
    subtitle: 'I represent a business that others can call',
    bullets: [
      'Listed as a dialable contact for other users',
      'Receive and manage inbound call requests',
      'No personal contact list or calendar sync',
    ],
    accent: 'hsl(var(--muted-foreground))',
  },
];

export function RolePage() {
  const [selected, setSelected] = useState<Role | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const { refresh, user } = useAuth();
  const [, navigate] = useLocation();

  const handleContinue = () => {
    if (!selected) return;
    setStep(2);
    // Pre-fill name from Google account if available
    if (user?.name && !name) {
      setName(user.name);
    }
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
    setNameError(null);
    setDescriptionError(null);
  };

  const handleFinishSetup = async () => {
    if (!selected) return;
    
    // Client-side validation
    setNameError(null);
    setDescriptionError(null);
    setError(null);

    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }

    if (selected === 'service' && !description.trim()) {
      setDescriptionError('Description is required for service accounts');
      return;
    }

    setLoading(true);
    try {
      await setAccountRole({
        isService: selected === 'service',
        name: name.trim(),
        description: selected === 'service' ? description.trim() : undefined,
      });
      await refresh();
      navigate('/contacts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="grain flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-[20px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-md">
            <MessageCircle size={24} strokeWidth={2.5} />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {step === 1 ? 'Choose your role' : 'Tell us about yourself'}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {step === 1 
                ? 'This sets up your account. You can always change it later in settings.'
                : selected === 'service' 
                  ? 'What should callers know about your service?'
                  : 'How should we address you?'
              }
            </p>
          </div>
        </div>

        {step === 1 ? (
          <>
            {/* Role cards */}
            <div className="space-y-3">
              {ROLES.map((role) => {
                const isSelected = selected === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelected(role.id)}
                    className={`w-full rounded-[20px] border p-5 text-left transition-all duration-150 ${
                      isSelected
                        ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent)/0.06)] shadow-sm'
                        : 'border-border bg-card hover:border-foreground/20 hover:bg-card/80'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon + radio */}
                      <span
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
                          isSelected
                            ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {role.icon}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold leading-snug">{role.title}</p>
                          {/* Radio indicator */}
                          <span
                            className={`ml-auto flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              isSelected
                                ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]'
                                : 'border-muted-foreground/40 bg-transparent'
                            }`}
                          >
                            {isSelected && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent-foreground))]" />
                            )}
                          </span>
                        </div>

                        <p className="mt-0.5 text-xs text-muted-foreground">{role.subtitle}</p>

                        {/* Bullets — animate in when selected */}
                        {isSelected && (
                          <ul className="mt-3 space-y-1.5">
                            {role.bullets.map((b) => (
                              <li key={b} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--accent))]" />
                                {b}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Error */}
            {error && (
              <p className="mt-4 text-center text-xs text-destructive">{error}</p>
            )}

            {/* Continue button */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={!selected}
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                selected
                  ? 'bg-foreground text-background hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'
                  : 'cursor-not-allowed bg-muted text-muted-foreground'
              }`}
            >
              Continue
              <ArrowRight size={15} />
            </button>
          </>
        ) : (
          <>
            {/* Step 2: Details form */}
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold text-muted-foreground">
                  {selected === 'service' ? 'Service title' : 'Your name'}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={selected === 'service' ? 'e.g., Bright Smile Dental Clinic' : 'e.g., John Doe'}
                  className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors ${
                    nameError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-[#a7d0c1]'
                  }`}
                />
                {nameError && <p className="mt-1 text-xs text-destructive">{nameError}</p>}
              </div>

              {selected === 'service' && (
                <div>
                  <label className="mb-2 block text-xs font-bold text-muted-foreground">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does your service offer? What should callers know?"
                    rows={3}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-colors resize-none ${
                      descriptionError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-[#a7d0c1]'
                    }`}
                  />
                  {descriptionError && <p className="mt-1 text-xs text-destructive">{descriptionError}</p>}
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-center text-xs text-destructive">{error}</p>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft size={12} />
                Back
              </button>
              <button
                type="button"
                onClick={handleFinishSetup}
                disabled={loading}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#3f8274] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#356c61] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    Setting up…
                  </>
                ) : (
                  <>
                    Finish setup
                    <ArrowRight size={12} />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
