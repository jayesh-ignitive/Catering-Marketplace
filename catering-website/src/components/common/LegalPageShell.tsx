import Link from "next/link";

type LegalPageShellProps = {
  title: string;
  lastUpdatedLabel: string;
  children: React.ReactNode;
};

export function LegalPageShell({ title, lastUpdatedLabel, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-[#faf7f4] text-gray-800">
      <div className="border-b border-stone-200/80 bg-white shadow-sm shadow-stone-200/30">
        <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
          <nav className="mb-6 text-sm text-gray-500">
            <Link href="/" className="transition-colors hover:text-brand-red">
              Home
            </Link>
            <span className="mx-2 text-gray-300" aria-hidden>
              /
            </span>
            <span className="font-medium text-gray-800">{title}</span>
          </nav>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-brand-dark sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-gray-500">{lastUpdatedLabel}</p>
        </div>
      </div>
      <article className="mx-auto max-w-3xl px-6 py-10 pb-16 text-[15px] leading-relaxed text-gray-700 sm:py-14 sm:pb-20">
        <div className="space-y-8 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-brand-dark [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-gray-900 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:font-medium [&_a]:text-brand-red [&_a]:underline-offset-2 hover:[&_a]:underline [&_p+p]:mt-4">
          {children}
        </div>
      </article>
    </div>
  );
}
