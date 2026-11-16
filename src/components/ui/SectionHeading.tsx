import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  action,
  className,
  as: Tag = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14", className)}>
      <div>
        {eyebrow && (
          <p className="eyebrow mb-4 flex items-center gap-3">
            <span className="h-px w-8 bg-blood" aria-hidden />
            {eyebrow}
          </p>
        )}
        <Tag className="display text-5xl md:text-7xl">{title}</Tag>
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: ReactNode }) {
  return (
    <header className="relative overflow-hidden border-b border-smoke pt-36 pb-14 md:pt-44 md:pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[28rem] w-[28rem] rounded-full bg-blood/20 blur-[120px]"
      />
      <div className="container-site relative">
        <p className="eyebrow mb-5 flex items-center gap-3">
          <span className="h-px w-8 bg-blood" aria-hidden />
          {eyebrow}
        </p>
        <h1 className="display text-[clamp(3.5rem,12vw,10rem)]">{title}</h1>
        {intro && <div className="mt-6 max-w-2xl text-mist">{intro}</div>}
      </div>
    </header>
  );
}
