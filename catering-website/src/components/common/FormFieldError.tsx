type FormFieldErrorProps = {
  id: string;
  message?: string;
  /** `light` for marketing forms on white; `dark` for admin zinc UI */
  variant?: "light" | "dark";
};

export function FormFieldError({ id, message, variant = "light" }: FormFieldErrorProps) {
  if (!message) return null;
  const color = variant === "dark" ? "text-red-400" : "text-red-600";
  return (
    <p id={id} className={`mt-1.5 text-sm font-medium ${color}`} role="alert">
      {message}
    </p>
  );
}
