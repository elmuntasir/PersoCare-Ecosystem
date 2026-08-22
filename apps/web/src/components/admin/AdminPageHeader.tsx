import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Back",
}: AdminPageHeaderProps) {
  return (
    <div className="space-y-2">
      {eyebrow ? (
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--coral)]">
          {eyebrow}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--sage-200)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--teal-900)] shadow-xs transition-colors hover:bg-[var(--paper)]"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        ) : null}

        <h1 className="font-display text-3xl md:text-4xl text-[var(--teal-900)] tracking-tight font-bold">
          {title}
        </h1>
      </div>

      {description ? (
        <p className="font-body text-sm text-[var(--ink-soft)]">{description}</p>
      ) : null}
    </div>
  );
}
