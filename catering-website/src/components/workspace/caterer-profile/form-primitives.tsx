export function InputLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-[#374151]">
      {children}
    </label>
  );
}

export function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-xs font-medium text-brand-red" role="alert">
      {message}
    </p>
  );
}

export function ChoiceChip({
  selected,
  onClick,
  title,
  subtitle,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full cursor-pointer flex-col gap-0.5 rounded-sm border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1 sm:w-auto sm:min-w-[11rem] ${
        selected
          ? "border-brand-red bg-red-50 text-brand-red"
          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-brand-red/60"
      }`}
    >
      <span className="text-sm font-semibold">{title}</span>
      {subtitle ? <span className="text-xs font-normal text-[#6B7280]">{subtitle}</span> : null}
    </button>
  );
}

export function ToggleChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`cursor-pointer rounded-sm border px-3.5 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-1 ${
        selected
          ? "border-brand-red bg-red-50 text-brand-red"
          : "border-[#E5E7EB] bg-white text-[#374151] hover:border-brand-red/60"
      }`}
    >
      {children}
    </button>
  );
}
