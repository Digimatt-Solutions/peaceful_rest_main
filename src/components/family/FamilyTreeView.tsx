import { useCallback, useMemo, useRef, useState } from "react";
import { Baby, ChevronDown, Download, Expand, Heart, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import makiwaMark from "@/assets/makiwa-mark.png";

export type FamilyMember = {
  id: string;
  name: string;
  relationship: string;
  photo_url?: string | null;
  display_order?: number | null;
};

type Props = {
  deceasedName: string;
  deceasedPhoto?: string | null;
  members: FamilyMember[];
  className?: string;
  canReorder?: boolean;
  onSwap?: (first: FamilyMember, second: FamilyMember, orderedLane: FamilyMember[]) => Promise<void> | void;
  expandedMode?: boolean;
};

const relationshipGeneration = (relationship: string) => {
  const value = relationship.toLowerCase().replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();

  if (/great\s*grand\s*(son|daughter|child)/.test(value)) return -3;
  if (/grand\s*(son|daughter|child)/.test(value)) return -2;
  if (/great\s*grand\s*(father|mother|parent)/.test(value)) return 3;
  if (/grand\s*(father|mother|parent)/.test(value)) return 2;
  if (/^(son|daughter|child|step child)$/.test(value)) return -1;
  if (/^(niece|nephew)$/.test(value)) return -1;
  if (/^(father|mother|parent|step father|step mother|father in law|mother in law|uncle|aunt)$/.test(value)) return 1;
  return 0;
};

const relationshipLane = (generation: number, relationship: string) => {
  const value = relationship.toLowerCase();
  if (generation === 0) {
    if (/brother|sister|sibling/.test(value) && !/in law/.test(value)) return 0;
    if (/spouse|wife|husband|partner|co\s*-?\s*wife/.test(value)) return 2;
    if (/in law/.test(value)) return 3;
  }
  if (/father|grandfather|son|grandson|brother|nephew|uncle/.test(value)) return 0;
  if (/mother|grandmother|daughter|granddaughter|sister|niece|aunt/.test(value)) return 2;
  return 1;
};

const sortMembers = (generation: number, nodes: FamilyMember[]) => [...nodes].sort((a, b) => {
  const laneDifference = relationshipLane(generation, a.relationship) - relationshipLane(generation, b.relationship);
  if (laneDifference) return laneDifference;
  const aOrder = a.display_order ?? Number.MAX_SAFE_INTEGER;
  const bOrder = b.display_order ?? Number.MAX_SAFE_INTEGER;
  return aOrder - bOrder || a.name.localeCompare(b.name);
});

const initialsOf = (name: string) =>
  name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

/** Small white member card: circular avatar, name, relationship — matches the reference infographic. */
const MemberCard = ({ member, canReorder, onDragStart, onDrop }: {
  member: FamilyMember;
  canReorder?: boolean;
  onDragStart?: (member: FamilyMember) => void;
  onDrop?: (member: FamilyMember) => void;
}) => (
  <article
    className={cn(
      "flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2.5 shadow-soft transition-shadow hover:shadow-elegant",
      canReorder && "cursor-move active:opacity-60",
    )}
    draggable={canReorder}
    onDragStart={(event) => {
      event.stopPropagation();
      onDragStart?.(member);
    }}
    onDragOver={(event) => {
      if (canReorder) event.preventDefault();
    }}
    onDrop={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onDrop?.(member);
    }}
  >
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-foreground text-[11px] font-semibold text-background">
      {member.photo_url ? <img src={member.photo_url} alt="" className="h-full w-full object-cover" /> : initialsOf(member.name)}
    </div>
    <div className="min-w-0 text-left">
      <p className="truncate text-sm font-semibold leading-snug">{member.name}</p>
      <p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{member.relationship}</p>
    </div>
  </article>
);

type SectionKey = "greatGrandchildren" | "grandchildren" | "grandparents" | "parents" | "partner" | "children" | "siblings" | "extended";

const SECTIONS: Record<SectionKey, { title: string; icon: typeof Users; panel: string; chip: string }> = {
  greatGrandchildren: { title: "Great-grandchildren", icon: Baby, panel: "bg-cream/60 border-border", chip: "bg-foreground text-background" },
  grandchildren: { title: "Grandchildren", icon: Baby, panel: "bg-cream/60 border-border", chip: "bg-foreground text-background" },
  grandparents: { title: "Grandparents", icon: Users, panel: "bg-muted/40 border-border", chip: "bg-brand-orange text-brand-white" },
  parents: { title: "Parents", icon: Users, panel: "bg-muted/40 border-border", chip: "bg-brand-orange text-brand-white" },
  partner: { title: "Partner", icon: Heart, panel: "bg-brand-orange/5 border-brand-orange/20", chip: "bg-brand-orange text-brand-white" },
  children: { title: "Children, Nieces & Nephews", icon: Baby, panel: "bg-brand-orange/5 border-brand-orange/20", chip: "bg-brand-orange text-brand-white" },
  siblings: { title: "Siblings", icon: Users, panel: "bg-muted/40 border-border", chip: "bg-foreground text-background" },
  extended: { title: "Extended Family", icon: Users, panel: "bg-muted/40 border-border", chip: "bg-foreground text-background" },
};

const SectionPanel = ({ sectionKey, count, children, className, compact = false }: {
  sectionKey: SectionKey;
  count: number;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
}) => {
  const section = SECTIONS[sectionKey];
  const Icon = section.icon;
  return (
    <div className={cn("rounded-2xl border p-3 sm:p-4", section.panel, className)}>
      <div className="mb-3 flex items-center gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", section.chip)}>
          <Icon className="h-3.5 w-3.5" />
        </span>
        <h3 className="text-xs font-bold uppercase tracking-widest">{section.title}</h3>
        <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">{count}</span>
      </div>
      <div className={cn("grid grid-cols-1 gap-2 min-[420px]:grid-cols-2", !compact && "sm:grid-cols-3 lg:grid-cols-4")}>
        {children}
      </div>
    </div>
  );
};

/** Short vertical connector line between sections, echoing the reference's linking lines. */
const Connector = () => (
  <div className="flex justify-center py-1" aria-hidden="true">
    <span className="h-6 w-px bg-border" />
  </div>
);

// ---- PDF export: mirrors the on-screen sectioned layout ----

export const FamilyTreeView = ({ deceasedName, deceasedPhoto, members, className, canReorder = false, onSwap, expandedMode = false }: Props) => {
  const draggedMember = useRef<FamilyMember | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sections = useMemo(() => {
    const grouped: Record<SectionKey, FamilyMember[]> = {
      greatGrandchildren: [], grandchildren: [], grandparents: [], parents: [],
      partner: [], children: [], siblings: [], extended: [],
    };
    members.forEach((member) => {
      const generation = relationshipGeneration(member.relationship);
      if (generation <= -3) grouped.greatGrandchildren.push(member);
      else if (generation === -2) grouped.grandchildren.push(member);
      else if (generation >= 2) grouped.grandparents.push(member);
      else if (generation === 1) grouped.parents.push(member);
      else if (generation === -1) grouped.children.push(member);
      else {
        const lane = relationshipLane(0, member.relationship);
        if (lane === 2) grouped.partner.push(member);
        else if (lane === 0) grouped.siblings.push(member);
        else grouped.extended.push(member);
      }
    });
    (Object.keys(grouped) as SectionKey[]).forEach((key) => {
      const generation = key === "greatGrandchildren" ? -3 : key === "grandchildren" ? -2 : key === "grandparents" ? 2 : key === "parents" ? 1 : key === "children" ? -1 : 0;
      grouped[key] = sortMembers(generation, grouped[key]);
    });
    return grouped;
  }, [members]);

  const dropOn = async (target: FamilyMember) => {
    const source = draggedMember.current;
    draggedMember.current = null;
    if (!source || source.id === target.id) return;
    const sourceGeneration = relationshipGeneration(source.relationship);
    const targetGeneration = relationshipGeneration(target.relationship);
    if (sourceGeneration !== targetGeneration || relationshipLane(sourceGeneration, source.relationship) !== relationshipLane(targetGeneration, target.relationship)) {
      toast.error("That position is reserved for a different relationship group.");
      return;
    }
    const orderedLane = members
      .filter((member) => relationshipGeneration(member.relationship) === sourceGeneration && relationshipLane(sourceGeneration, member.relationship) === relationshipLane(sourceGeneration, source.relationship))
      .sort((a, b) => (a.display_order ?? Number.MAX_SAFE_INTEGER) - (b.display_order ?? Number.MAX_SAFE_INTEGER) || a.name.localeCompare(b.name));
    const sourceIndex = orderedLane.findIndex((member) => member.id === source.id);
    const targetIndex = orderedLane.findIndex((member) => member.id === target.id);
    if (sourceIndex < 0 || targetIndex < 0) return;
    [orderedLane[sourceIndex], orderedLane[targetIndex]] = [orderedLane[targetIndex], orderedLane[sourceIndex]];
    await onSwap?.(source, target, orderedLane);
  };

  const downloadPdf = useCallback(async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 36;
      let y = margin;

      // Header — mirrors the on-screen header
      pdf.setFont("times", "bold");
      pdf.setFontSize(22);
      pdf.setTextColor(31, 31, 31);
      pdf.text("Makiwa", margin, y);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(120, 120, 120);
      pdf.text("REMEMBER · HONOUR · TOGETHER", margin, y + 11);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      pdf.text("FAMILY TREE", pageWidth - margin, y, { align: "right" });
      y += 36;
      pdf.setFont("times", "bold");
      pdf.setFontSize(26);
      pdf.setTextColor(31, 31, 31);
      pdf.text(deceasedName, pageWidth / 2, y, { align: "center" });
      y += 16;
      pdf.setFont("times", "italic");
      pdf.setFontSize(10);
      pdf.setTextColor(120, 120, 120);
      pdf.text("“Forever in our hearts, always in our family.”", pageWidth / 2, y, { align: "center" });
      y += 22;
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.8);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 22;

      const cardHeight = 46;
      const gap = 8;
      const cols = 3;
      const cardWidth = (pageWidth - margin * 2 - gap * (cols - 1)) / cols;

      const ensureSpace = (needed: number) => {
        if (y + needed > pageHeight - margin - 16) {
          pdf.addPage();
          y = margin;
        }
      };

      const drawCard = (name: string, relationship: string, left: number, top: number, width: number, deceased = false) => {
        if (deceased) {
          pdf.setFillColor(255, 247, 242);
          pdf.setDrawColor(243, 112, 33);
          pdf.setLineWidth(1.6);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(205, 205, 205);
          pdf.setLineWidth(0.8);
        }
        pdf.roundedRect(left, top, width, cardHeight, 5, 5, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(31, 31, 31);
        const nameLines = pdf.splitTextToSize(name, width - 14);
        pdf.text(nameLines.slice(0, 2), left + 7, top + 16);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        if (deceased) pdf.setTextColor(243, 112, 33);
        else pdf.setTextColor(110, 110, 110);
        pdf.text(relationship.toUpperCase(), left + 7, top + cardHeight - 7);
      };

      const drawConnector = () => {
        pdf.setDrawColor(210, 210, 210);
        pdf.setLineWidth(0.8);
        pdf.line(pageWidth / 2, y, pageWidth / 2, y + 12);
        y += 20;
      };

      const drawSection = (key: SectionKey) => {
        const list = sections[key];
        if (list.length === 0) return;
        const rows = Math.ceil(list.length / cols);
        ensureSpace(24 + rows * (cardHeight + gap));
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8);
        pdf.setTextColor(243, 112, 33);
        pdf.text(`${SECTIONS[key].title.toUpperCase()} (${list.length})`, margin, y);
        y += 10;
        list.forEach((member, index) => {
          const row = Math.floor(index / cols);
          const col = index % cols;
          drawCard(member.name, member.relationship, margin + col * (cardWidth + gap), y + row * (cardHeight + gap), cardWidth);
        });
        y += rows * (cardHeight + gap) + 4;
        drawConnector();
      };

      // Same order as on screen: descendants top, parents → deceased → partner, then children, siblings, extended
      drawSection("greatGrandchildren");
      drawSection("grandchildren");
      drawSection("parents");

      const anchorWidth = cardWidth * 1.4;
      ensureSpace(cardHeight + 10);
      drawCard(deceasedName, "† Deceased", (pageWidth - anchorWidth) / 2, y, anchorWidth, true);
      y += cardHeight + 4;
      drawConnector();

      drawSection("partner");
      drawSection("children");
      drawSection("siblings");
      drawSection("extended");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.setTextColor(140, 140, 140);
      pdf.text("FAMILY · LEGACY · LOVE — MAKIWA", pageWidth / 2, pageHeight - 20, { align: "center" });

      pdf.save(`${deceasedName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-family-tree.pdf`);
    } catch {
      toast.error("The family tree PDF could not be created.");
    } finally {
      setExporting(false);
    }
  }, [deceasedName, sections]);

  const renderSection = (key: SectionKey, compact = false) => {
    const list = sections[key];
    if (list.length === 0) return null;
    return (
      <SectionPanel sectionKey={key} count={list.length} compact={compact}>
        {list.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            canReorder={canReorder}
            onDragStart={(next) => { draggedMember.current = next; }}
            onDrop={dropOn}
          />
        ))}
      </SectionPanel>
    );
  };

  const deceasedInitials = initialsOf(deceasedName);

  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      {/* Header — mirrors the reference: Makiwa logo, FAMILY TREE eyebrow, deceased name, remembrance quote */}
      <header className="border-b border-border px-4 py-6 sm:px-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <img src={makiwaMark} alt="Makiwa logo" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-serif text-xl font-semibold leading-none">Makiwa</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">Remember · Honour · Together</p>
            </div>
          </div>
          <div className="sm:text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Family Tree</p>
            <h2 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">{deceasedName}</h2>
            <p className="mt-1 text-xs text-muted-foreground">Automatically arranged by relationship to the deceased</p>
          </div>
          <p className="hidden max-w-[180px] font-serif text-sm italic text-muted-foreground sm:block sm:text-right">
            “Forever in our hearts, always in our family.”
          </p>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={downloadPdf} disabled={exporting}>
            <Download className="mr-1.5 h-3.5 w-3.5" /> {exporting ? "Preparing…" : "Download PDF"}
          </Button>
          {!expandedMode && (
            <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => setExpanded(true)}>
              <Expand className="mr-1.5 h-3.5 w-3.5" /> Expand
            </Button>
          )}
        </div>
        {canReorder && (
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Drag a card onto another in the same section to swap positions.</p>
        )}
        {!expandedMode && (
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full border border-border py-2 text-xs font-semibold transition-colors hover:bg-muted/50 sm:hidden"
          >
            {mobileOpen ? "Hide family tree" : "View family tree"}
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", mobileOpen && "rotate-180")} />
          </button>
        )}
      </header>

      <div className={cn("space-y-1 px-3 py-5 sm:px-6", expandedMode && "max-h-[calc(100vh-12rem)] overflow-y-auto", !mobileOpen && !expandedMode && "hidden sm:block")}>
        {/* Descendants of the children sit at the top, like the reference */}
        {renderSection("greatGrandchildren")}
        {sections.greatGrandchildren.length > 0 && <Connector />}
        {renderSection("grandchildren")}
        {(sections.greatGrandchildren.length > 0 || sections.grandchildren.length > 0) && <Connector />}

        {/* Parents — deceased — Partner row */}
        <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col justify-center">
            {renderSection("parents", true)}
          </div>

          <div className="flex items-center justify-center">
            <article className="relative flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border-2 border-brand-orange bg-card px-6 py-5 text-center shadow-elegant ring-4 ring-brand-orange/10">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-orange text-xl font-semibold text-brand-white ring-4 ring-brand-orange/20">
                {deceasedPhoto ? <img src={deceasedPhoto} alt="" className="h-full w-full object-cover" /> : deceasedInitials}
              </div>
              <div>
                <p className="font-serif text-lg font-semibold leading-snug">{deceasedName}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-brand-orange">† Deceased</p>
              </div>
            </article>
          </div>

          <div className="flex flex-col justify-center">
            {renderSection("partner", true)}
          </div>
        </div>

        {(sections.children.length > 0 || sections.siblings.length > 0 || sections.extended.length > 0) && <Connector />}
        {renderSection("children")}
        {sections.children.length > 0 && (sections.siblings.length > 0 || sections.extended.length > 0) && <Connector />}
        {renderSection("siblings")}
        {sections.siblings.length > 0 && sections.extended.length > 0 && <Connector />}
        {renderSection("extended")}

        {members.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No family members added yet.</p>
        )}
      </div>

      <footer className={cn("border-t border-border px-4 py-3 text-center", !mobileOpen && !expandedMode && "hidden sm:block")}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Family · Legacy · Love</p>
      </footer>

      {!expandedMode && (
        <Dialog open={expanded} onOpenChange={setExpanded}>
          <DialogContent className="h-[94vh] w-[calc(100%-1rem)] max-w-[96vw] gap-3 overflow-hidden p-3 sm:p-5">
            <DialogHeader className="pr-8">
              <DialogTitle>{deceasedName}'s family tree</DialogTitle>
              <DialogDescription>The complete family tree, arranged by relationship.</DialogDescription>
            </DialogHeader>
            <FamilyTreeView
              deceasedName={deceasedName}
              deceasedPhoto={deceasedPhoto}
              members={members}
              canReorder={canReorder}
              onSwap={onSwap}
              expandedMode
              className="min-h-0"
            />
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
};
