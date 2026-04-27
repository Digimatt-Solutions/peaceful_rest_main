import { cn } from "@/lib/utils";

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  photo_url?: string | null;
};

type Props = {
  deceasedName: string;
  deceasedPhoto?: string | null;
  members: FamilyMember[];
  className?: string;
};

const NodeCard = ({
  name, role, photo, accent = false, deceased = false, size = "md",
}: { name: string; role: string; photo?: string | null; accent?: boolean; deceased?: boolean; size?: "sm" | "md" | "lg" }) => {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const sizes = {
    sm: { card: "w-32 sm:w-36", img: "h-14 w-14", title: "text-xs", role: "text-[10px]" },
    md: { card: "w-36 sm:w-40", img: "h-16 w-16", title: "text-sm", role: "text-[10px]" },
    lg: { card: "w-44 sm:w-52", img: "h-20 w-20", title: "text-base", role: "text-[11px]" },
  }[size];

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-card text-center px-4 py-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-elegant",
        sizes.card,
        deceased && "border-brand-orange/40 ring-2 ring-brand-orange/20 bg-gradient-to-b from-brand-orange/[0.04] to-card",
        accent && !deceased && "border-foreground/15",
      )}
    >
      <div
        className={cn(
          "mx-auto rounded-full overflow-hidden flex items-center justify-center font-serif",
          sizes.img,
          deceased
            ? "bg-gradient-to-br from-brand-orange to-[hsl(28_95%_62%)] text-brand-white ring-4 ring-brand-orange/20"
            : "bg-foreground text-background"
        )}
      >
        {photo ? (
          <img src={photo} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span className={size === "lg" ? "text-2xl" : "text-lg"}>{initials}</span>
        )}
      </div>
      <p className={cn("mt-3 font-medium leading-tight truncate", sizes.title)}>{name}</p>
      <p className={cn("uppercase tracking-wider text-muted-foreground mt-1", sizes.role)}>
        {role}
      </p>
      {deceased && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-brand-orange text-brand-white text-[9px] uppercase tracking-widest font-semibold whitespace-nowrap">
          In Memory
        </span>
      )}
    </div>
  );
};

const Connector = ({ orientation = "down", className }: { orientation?: "down" | "horizontal"; className?: string }) => {
  if (orientation === "horizontal") {
    return <div className={cn("h-px border-t border-dashed border-foreground/30", className)} />;
  }
  return <div className={cn("w-px border-l border-dashed border-foreground/30", className)} />;
};

export const FamilyTreeView = ({ deceasedName, deceasedPhoto, members, className }: Props) => {
  const father = members.find(m => /father|dad/i.test(m.relationship));
  const mother = members.find(m => /mother|mom/i.test(m.relationship));
  const spouse = members.find(m => /spouse|wife|husband|partner/i.test(m.relationship));
  const siblings = members.filter(m => /sibling|brother|sister/i.test(m.relationship));
  const children = members.filter(m => /child|son|daughter/i.test(m.relationship));

  return (
    <div className={cn("rounded-3xl border border-border bg-gradient-to-b from-muted/30 to-card p-6 sm:p-10 overflow-x-auto", className)}>
      <div className="min-w-[640px] flex flex-col items-center gap-2">
        {/* Parents row */}
        {(father || mother) && (
          <>
            <div className="flex items-end justify-center gap-12 sm:gap-16">
              {father ? <NodeCard name={father.name} role="Father" photo={father.photo_url} /> : <div className="w-36 sm:w-40 opacity-0" />}
              {mother ? <NodeCard name={mother.name} role="Mother" photo={mother.photo_url} /> : <div className="w-36 sm:w-40 opacity-0" />}
            </div>
            {/* horizontal between parents */}
            <div className="flex items-center justify-center" style={{ width: "calc(2 * 10rem + 4rem)" }}>
              <div className="flex-1 border-t border-dashed border-foreground/30" />
              <div className="h-2 w-2 rounded-full bg-brand-orange/70 mx-1" />
              <div className="flex-1 border-t border-dashed border-foreground/30" />
            </div>
            <Connector className="h-6" />
          </>
        )}

        {/* Deceased + spouse row */}
        <div className="flex items-end justify-center gap-12 sm:gap-16">
          <NodeCard name={deceasedName} role="In Loving Memory" photo={deceasedPhoto} deceased size="lg" />
          {spouse && <NodeCard name={spouse.name} role={spouse.relationship} photo={spouse.photo_url} size="lg" accent />}
        </div>

        {spouse && (
          <div className="flex items-center -mt-1" style={{ width: "calc(2 * 13rem + 4rem)" }}>
            <div className="flex-1" />
            <div className="flex-1 border-t border-dashed border-brand-orange/50" />
            <div className="flex-1 border-t border-dashed border-brand-orange/50" />
            <div className="flex-1" />
          </div>
        )}

        {/* Siblings row (alongside deceased, drawn below parents row) */}
        {siblings.length > 0 && (
          <>
            <Connector className="h-4" />
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Siblings</p>
            <div className="flex flex-wrap items-start justify-center gap-4 mt-2">
              {siblings.map(s => (
                <NodeCard key={s.id} name={s.name} role={s.relationship} photo={s.photo_url} size="sm" />
              ))}
            </div>
          </>
        )}

        {/* Children row */}
        {children.length > 0 && (
          <>
            <Connector className="h-6 mt-2" />
            {children.length > 1 && (
              <div className="flex items-center" style={{ width: `calc(${children.length} * 10rem + ${(children.length - 1)} * 1rem)` }}>
                <div className="flex-1 border-t border-dashed border-foreground/30" />
              </div>
            )}
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-2">Children</p>
            <div className="flex flex-wrap items-start justify-center gap-4 mt-2">
              {children.map(c => (
                <NodeCard key={c.id} name={c.name} role={c.relationship} photo={c.photo_url} />
              ))}
            </div>
          </>
        )}

        {members.length === 0 && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            Add parents, spouse, siblings, and children to build the family tree.
          </div>
        )}
      </div>
    </div>
  );
};
