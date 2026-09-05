import type { ReactNode } from 'react';

export function IconButton({
  label,
  children,
  onClick,
  className = '',
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      data-testid={`button-${label.toLowerCase().replaceAll(' ', '-')}`}
      onClick={onClick}
      className={`grid place-items-center transition-transform duration-200 hover:-translate-y-0.5 ${className}`}
    >
      {children}
    </button>
  );
}
