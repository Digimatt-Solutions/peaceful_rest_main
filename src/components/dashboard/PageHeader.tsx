import { ReactNode } from "react";

export const PageHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) => (
  <div className="flex items-end justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-border">
    <div>
      <h1 className="font-serif text-3xl lg:text-4xl font-medium">{title}</h1>
      {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const EmptyState = ({ icon: Icon, title, description, action }: { icon: any; title: string; description?: string; action?: ReactNode }) => (
  <div className="text-center py-16 px-6 rounded-2xl border border-dashed border-border bg-card">
    <div className="mx-auto h-14 w-14 rounded-full bg-cream flex items-center justify-center">
      <Icon className="h-6 w-6 text-brand-orange" />
    </div>
    <h3 className="mt-5 font-serif text-xl">{title}</h3>
    {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">{description}</p>}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
