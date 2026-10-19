import { useCallback, useMemo, useRef, useState } from "react";
import { Baby, Download, Expand, Heart, Users } from "lucide-react";
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

type TreeNode = FamilyMember & {
  generation: number;
  x: number;
  y: number;
  deceased?: boolean;
};

const CARD_WIDTH = 152;
const CARD_HEIGHT = 112;
const COLUMN_GAP = 34;
const ROW_GAP = 184;

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

const SectionPanel = ({ sectionKey, count, children, className }: {
  sectionKey: SectionKey;
  count: number;
  children: React.ReactNode;
  className?: string;
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
      <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
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

// ---- PDF export (unchanged layout engine) ----

const createLayout = (deceasedName: string, deceasedPhoto: string | null | undefined, members: FamilyMember[]) => {
  const groups = new Map<number, FamilyMember[]>();
  members.forEach((member) => {
    const generation = relationshipGeneration(member.relationship);
    groups.set(generation, [...(groups.get(generation) || []), member]);
  });

  const generations = Array.from(new Set([0, ...groups.keys()])).sort((a, b) => a - b);
  const minGeneration = Math.min(...generations);
  const maxGeneration = Math.max(...generations);
  const rows = generations.map((generation) => {
    const group = sortMembers(generation, groups.get(generation) || []);
    const count = group.length + (generation === 0 ? 1 : 0);
    return { generation, group, width: Math.max(CARD_WIDTH, count * CARD_WIDTH + Math.max(0, count - 1) * COLUMN_GAP) };
  });
  const worldWidth = Math.max(720, ...rows.map((row) => row.width)) + 160;
  const worldHeight = Math.max(560, (maxGeneration - minGeneration) * ROW_GAP + 280);
  const centerX = worldWidth / 2;
  const centerGenerationY = 140 + (0 - minGeneration) * ROW_GAP;
  const nodes: TreeNode[] = [];

  rows.forEach(({ generation, group }) => {
    const rowMembers: Array<FamilyMember & { deceased?: boolean }> = generation === 0
      ? [
          ...group.filter((member) => relationshipLane(0, member.relationship) === 0),
          { id: "deceased-anchor", name: deceasedName, relationship: "In loving memory", photo_url: deceasedPhoto, deceased: true },
          ...group.filter((member) => relationshipLane(0, member.relationship) !== 0),
        ]
      : group;
    const rowWidth = rowMembers.length * CARD_WIDTH + Math.max(0, rowMembers.length - 1) * COLUMN_GAP;
    const startX = centerX - rowWidth / 2 + CARD_WIDTH / 2;
    rowMembers.forEach((member, index) => nodes.push({
      ...member,
      generation,
      x: startX + index * (CARD_WIDTH + COLUMN_GAP),
      y: centerGenerationY + generation * ROW_GAP,
    }));
  });

  return { nodes, rows, worldWidth, worldHeight, centerX, centerGenerationY };
};

const generationLabel = (generation: number) => {
  if (generation <= -3) return "Great-grandchildren";
  if (generation === -2) return "Grandchildren";
  if (generation === -1) return "Children, nieces & nephews";
  if (generation === 0) return "Deceased, partners & siblings";
  if (generation === 1) return "Parents, aunts & uncles";
  if (generation === 2) return "Grandparents";
  return "Great-grandparents";
};

export const FamilyTreeView = ({ deceasedName, deceasedPhoto, members, className, canReorder = false, onSwap, expandedMode = false }: Props) => {
  const draggedMember = useRef<FamilyMember | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  const layout = useMemo(() => createLayout(deceasedName, deceasedPhoto, members), [deceasedName, deceasedPhoto, members]);

  const downloadPdf = useCallback(async () => {
    setExporting(true);
    try {
      const { jsPDF } = await import("jspdf");
      const landscape = layout.worldWidth >= layout.worldHeight;
      const pdf = new jsPDF({ orientation: landscape ? "landscape" : "portrait", unit: "pt", format: "a3" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const titleHeight = 72;
      const legendHeight = 58;
      const scale = Math.min((pageWidth - 56) / layout.worldWidth, (pageHeight - titleHeight - legendHeight - 36) / layout.worldHeight);
      const offsetX = (pageWidth - layout.worldWidth * scale) / 2;
      const offsetY = titleHeight;
      const sx = (value: number) => offsetX + value * scale;
      const sy = (value: number) => offsetY + value * scale;
      const anchor = layout.nodes.find((node) => node.deceased);

      pdf.setTextColor(31, 31, 31);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text(`${deceasedName} — Family Tree`, 28, 34);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text("Automatically arranged by relationship to the deceased", 28, 50);

      if (anchor) {
        pdf.setDrawColor(185, 185, 185);
        pdf.setLineWidth(Math.max(0.6, 1.4 * scale));
        const grouped = new Map<number, TreeNode[]>();
        layout.nodes.forEach((node) => grouped.set(node.generation, [...(grouped.get(node.generation) || []), node]));
        grouped.forEach((nodes, generation) => {
          if (generation === 0) {
            nodes.filter((node) => !node.deceased).forEach((node) => pdf.line(sx(Math.min(node.x, anchor.x) + CARD_WIDTH / 2), sy(anchor.y), sx(Math.max(node.x, anchor.x) - CARD_WIDTH / 2), sy(anchor.y)));
            return;
          }
          const rowY = nodes[0]?.y;
          if (rowY === undefined) return;
          const toward = generation < 0 ? rowY + CARD_HEIGHT / 2 : rowY - CARD_HEIGHT / 2;
          const bus = generation < 0 ? toward + 34 : toward - 34;
          const xs = nodes.map((node) => node.x);
          pdf.line(sx(Math.min(...xs, layout.centerX)), sy(bus), sx(Math.max(...xs, layout.centerX)), sy(bus));
          pdf.line(sx(layout.centerX), sy(bus), sx(layout.centerX), sy(anchor.y + (generation < 0 ? -CARD_HEIGHT / 2 : CARD_HEIGHT / 2)));
          nodes.forEach((node) => pdf.line(sx(node.x), sy(toward), sx(node.x), sy(bus)));
        });
      }

      layout.rows.forEach(({ generation }) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(Math.max(6, 8 * scale));
        pdf.setTextColor(110, 110, 110);
        pdf.text(generationLabel(generation).toUpperCase(), sx(20), sy(layout.centerGenerationY + generation * ROW_GAP - CARD_HEIGHT / 2 - 13));
      });

      layout.nodes.forEach((node) => {
        const left = sx(node.x - CARD_WIDTH / 2);
        const top = sy(node.y - CARD_HEIGHT / 2);
        const width = CARD_WIDTH * scale;
        const height = CARD_HEIGHT * scale;
        if (node.deceased) {
          pdf.setFillColor(255, 247, 242);
          pdf.setDrawColor(239, 91, 28);
          pdf.setLineWidth(2);
        } else {
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(205, 205, 205);
          pdf.setLineWidth(0.8);
        }
        pdf.roundedRect(left, top, width, height, 5, 5, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(Math.max(6, 10 * scale));
        pdf.setTextColor(31, 31, 31);
        const nameLines = pdf.splitTextToSize(node.name, Math.max(34, width - 18));
        pdf.text(nameLines.slice(0, 2), left + 9, top + height / 2 - 3);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(Math.max(5, 7 * scale));
        pdf.setTextColor(node.deceased ? 239 : 100, node.deceased ? 91 : 100, node.deceased ? 28 : 100);
        pdf.text(node.relationship.toUpperCase(), left + 9, top + height - 10);
      });

      const legendY = pageHeight - 42;
      pdf.setFillColor(255, 247, 242);
      pdf.setDrawColor(239, 91, 28);
      pdf.roundedRect(28, legendY - 11, 18, 14, 3, 3, "FD");
      pdf.setTextColor(55, 55, 55);
      pdf.setFontSize(8);
      pdf.text("Highlighted card: deceased anchor", 53, legendY);
      pdf.setDrawColor(185, 185, 185);
      pdf.line(225, legendY - 4, 255, legendY - 4);
      pdf.text("Lines: family relationship connection", 263, legendY);

      pdf.save(`${deceasedName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}-family-tree.pdf`);
    } catch {
      toast.error("The family tree PDF could not be created.");
    } finally {
      setExporting(false);
    }
  }, [deceasedName, layout]);

  const renderSection = (key: SectionKey) => {
    const list = sections[key];
    if (list.length === 0) return null;
    return (
      <SectionPanel sectionKey={key} count={list.length}>
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
      </header>

      <div className={cn("space-y-1 px-3 py-5 sm:px-6", expandedMode && "max-h-[calc(100vh-12rem)] overflow-y-auto")}>
        {/* Descendants of the children sit at the top, like the reference */}
        {renderSection("greatGrandchildren")}
        {sections.greatGrandchildren.length > 0 && <Connector />}
        {renderSection("grandchildren")}
        {(sections.greatGrandchildren.length > 0 || sections.grandchildren.length > 0) && <Connector />}

        {/* Parents — deceased — Partner row */}
        <div className="grid items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col justify-center">
            {renderSection("parents")}
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
            {renderSection("partner")}
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

      <footer className="border-t border-border px-4 py-3 text-center">
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
