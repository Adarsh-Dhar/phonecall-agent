import { MessageCircle, Sparkles, Shield, Calendar } from 'lucide-react';
import { Link } from 'wouter';
import { API_BASE_URL } from '@/lib/api/shared';

const perks = [
  {
    icon: <Sparkles size={15} />,
    title: 'AI-powered call summaries',
    description: 'Every call is transcribed and summarized automatically.',
  },
  {
    icon: <Calendar size={15} />,
    title: 'Google Calendar sync',
    description: 'Tasks extracted from calls land straight in your calendar.',
  },
  {
    icon: <Shield size={15} />,
    title: 'Private by default',
    description: 'Your call data is yours — never shared or sold.',
  },
];

export function SignupPage() {
  const handleSignup = () => {
    window.location.href = `${API_BASE_URL}/auth/google/login`;
  };

  return (
    <div className="grain flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <span className="grid h-16 w-16 place-items-center rounded-[22px] bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-md">
            <MessageCircle size={28} strokeWidth={2.5} />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">phone agent</h1>
            <p className="mt-1 text-sm text-muted-foreground">your personal phone call inbox</p>
          </div>
        </div>

        {/* Sign up card */}
        <div className="rounded-[22px] border border-card-border bg-card p-8 shadow-sm">
          <h2 className="mb-1 text-base font-semibold">Create your account</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Get started in seconds — no password required.
          </p>

          <button
            type="button"
            onClick={handleSignup}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            You'll choose your account type right after sign-in.
          </p>
        </div>

        {/* Perks */}
        <ul className="mt-6 space-y-3">
          {perks.map((perk) => (
            <li key={perk.title} className="flex items-start gap-3 rounded-2xl border border-[hsl(var(--border))] bg-card px-4 py-3">
              <span className="mt-0.5 text-[hsl(var(--accent-foreground))]">{perk.icon}</span>
              <div>
                <p className="text-xs font-semibold">{perk.title}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{perk.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-foreground underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
