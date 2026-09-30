import type { ComponentChildren } from "preact";

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ComponentChildren;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        {eyebrow && <p class="mb-2 text-xs font-medium text-muted">{eyebrow}</p>}
        <h1 class="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ink">{title}</h1>
        {description && <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div class="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
