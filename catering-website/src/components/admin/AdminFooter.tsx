import Link from "next/link";

export function AdminFooter() {
  return (
    <footer className="border-t border-slate-200/90 bg-white px-4 py-3 md:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Bharat Catering · Admin console. Internal use only.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
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
