import Link from "next/link";

export function WorkspaceFooter() {
  return (
    <footer className="border-t border-stone-200/80 bg-white px-4 py-3 md:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="text-xs text-stone-500">
          Workspace theme based on admin panel design. Build profile, menu, orders and analytics modules in
          this shell.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-stone-600">
          <Link href="/privacy" className="transition-colors hover:text-brand-red">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-brand-red">
            Terms &amp; Conditions
          </Link>
        </nav>
      </div>
    </footer>
  );
}
