import Link from "next/link";

export function AdminFooter() {
  return (
    <footer className="shrink-0 border-t border-gray-100 bg-white/90 px-4 py-3 backdrop-blur-sm md:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-brand-text-muted">
          Bharat Cater Hub · Admin console. Internal use only.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-brand-text-dark">
          <Link href="/privacy" className="transition-colors hover:text-brand-red">
            Privacy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-brand-red">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
