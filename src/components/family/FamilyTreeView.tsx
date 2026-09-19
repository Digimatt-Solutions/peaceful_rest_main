import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed, Maximize2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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

type TreeNode = FamilyMember & {
  generation: number;
  x: number;
  y: number;
  deceased?: boolean;
};

type ViewState = { x: number; y: number; scale: number };

const CARD_WIDTH = 152;
const CARD_HEIGHT = 112;
const COLUMN_GAP = 34;
const ROW_GAP = 184;
const VIEW_HEIGHT = 610;
const MIN_SCALE = 0.35;
const MAX_SCALE = 1.65;

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

const generationLabel = (generation: number) => {
  if (generation <= -3) return "Great-grandchildren";
  if (generation === -2) return "Grandchildren";
  if (generation === -1) return "Children, nieces & nephews";
  if (generation === 0) return "Deceased, partners & siblings";
  if (generation === 1) return "Parents, aunts & uncles";
  if (generation === 2) return "Grandparents";
  return "Great-grandparents";
};

const sortGeneration = (generation: number, nodes: FamilyMember[]) => {
  const rank = (relationship: string) => {
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
  return [...nodes].sort((a, b) => rank(a.relationship) - rank(b.relationship) || a.name.localeCompare(b.name));
};

const NodeCard = ({ node }: { node: TreeNode }) => {
  const initials = node.name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  return (
    <article
      className={cn(
        "absolute flex h-28 w-[152px] -translate-x-1/2 -translate-y-1/2 items-center gap-3 rounded-xl border bg-card px-3 shadow-soft transition-shadow hover:shadow-elegant",
        node.deceased ? "z-20 border-brand-orange ring-4 ring-brand-orange/15" : "z-10 border-border",
      )}
      style={{ left: node.x, top: node.y }}
    >
      <div className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-semibold",
        node.deceased ? "bg-brand-orange text-brand-white ring-2 ring-brand-orange/20" : "bg-foreground text-background",
      )}>
        {node.photo_url ? <img src={node.photo_url} alt="" className="h-full w-full object-cover" /> : initials}
      </div>
      <div className="min-w-0 text-left">
        {node.deceased && <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-brand-orange">In memory</span>}
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{node.name}</p>
        <p className="mt-1 line-clamp-2 text-[10px] uppercase tracking-wide text-muted-foreground">{node.relationship}</p>
      </div>
    </article>
  );
};

const TreeConnectors = ({ nodes, centerX }: { nodes: TreeNode[]; centerX: number }) => {
  const anchor = nodes.find((node) => node.deceased);
  if (!anchor) return null;

  const grouped = new Map<number, TreeNode[]>();
  nodes.forEach((node) => {
    const group = grouped.get(node.generation) || [];
    group.push(node);
    grouped.set(node.generation, group);
  });

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
      {Array.from(grouped.entries()).map(([generation, generationNodes]) => {
        if (generation === 0) {
          const peers = generationNodes.filter((node) => !node.deceased);
          return peers.map((node) => {
            const startX = node.x < anchor.x ? node.x + CARD_WIDTH / 2 : anchor.x + CARD_WIDTH / 2;
            const endX = node.x < anchor.x ? anchor.x - CARD_WIDTH / 2 : node.x - CARD_WIDTH / 2;
            return <path key={node.id} d={`M ${startX} ${anchor.y} H ${endX}`} className="stroke-border" strokeWidth="2" fill="none" />;
          });
        }

        const rowY = generationNodes[0]?.y;
        if (rowY === undefined) return null;
        const towardAnchor = generation < 0 ? rowY + CARD_HEIGHT / 2 : rowY - CARD_HEIGHT / 2;
        const busY = generation < 0 ? towardAnchor + 34 : towardAnchor - 34;
        const nearestY = anchor.y + (generation < 0 ? -CARD_HEIGHT / 2 : CARD_HEIGHT / 2);
        const xs = generationNodes.map((node) => node.x);
        const minX = Math.min(...xs, centerX);
        const maxX = Math.max(...xs, centerX);

        return (
          <g key={generation}>
            <path d={`M ${minX} ${busY} H ${maxX}`} className="stroke-border" strokeWidth="2" fill="none" />
            <path d={`M ${centerX} ${busY} V ${nearestY}`} className="stroke-border" strokeWidth="2" fill="none" />
            {generationNodes.map((node) => (
              <path key={node.id} d={`M ${node.x} ${towardAnchor} V ${busY}`} className="stroke-border" strokeWidth="2" fill="none" />
            ))}
          </g>
        );
      })}
      <circle cx={centerX} cy={anchor.y} r="4" className="fill-brand-orange" />
    </svg>
  );
};

export const FamilyTreeView = ({ deceasedName, deceasedPhoto, members, className }: Props) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<ViewState>({ x: 0, y: 0, scale: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinch = useRef<{ distance: number; centerX: number; centerY: number } | null>(null);
  const [view, setView] = useState<ViewState>(viewRef.current);

  const layout = useMemo(() => {
    const groups = new Map<number, FamilyMember[]>();
    members.forEach((member) => {
      const generation = relationshipGeneration(member.relationship);
      groups.set(generation, [...(groups.get(generation) || []), member]);
    });

    const generations = Array.from(new Set([0, ...groups.keys()])).sort((a, b) => a - b);
    const minGeneration = Math.min(...generations);
    const maxGeneration = Math.max(...generations);
    const rows = generations.map((generation) => {
      const group = sortGeneration(generation, groups.get(generation) || []);
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
            ...group.filter((member) => /brother|sister|sibling/i.test(member.relationship) && !/in law/i.test(member.relationship)),
            { id: "deceased-anchor", name: deceasedName, relationship: "In loving memory", photo_url: deceasedPhoto, deceased: true },
            ...group.filter((member) => !(/brother|sister|sibling/i.test(member.relationship) && !/in law/i.test(member.relationship))),
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
  }, [deceasedName, deceasedPhoto, members]);

  const updateView = useCallback((next: ViewState) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const fitToScreen = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const padding = 48;
    const scale = Math.min(1, Math.max(MIN_SCALE, Math.min(
      (viewport.clientWidth - padding) / layout.worldWidth,
      (viewport.clientHeight - padding) / layout.worldHeight,
    )));
    updateView({
      scale,
      x: (viewport.clientWidth - layout.worldWidth * scale) / 2,
      y: (viewport.clientHeight - layout.worldHeight * scale) / 2,
    });
  }, [layout.worldHeight, layout.worldWidth, updateView]);

  const resetView = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    updateView({
      scale: 1,
      x: viewport.clientWidth / 2 - layout.centerX,
      y: viewport.clientHeight / 2 - layout.centerGenerationY,
    });
  }, [layout.centerGenerationY, layout.centerX, updateView]);

  const zoomAt = useCallback((nextScale: number, pointX?: number, pointY?: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const current = viewRef.current;
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, nextScale));
    const px = pointX ?? viewport.clientWidth / 2;
    const py = pointY ?? viewport.clientHeight / 2;
    const factor = scale / current.scale;
    updateView({ scale, x: px - (px - current.x) * factor, y: py - (py - current.y) * factor });
  }, [updateView]);

  useEffect(() => {
    fitToScreen();
  }, [fitToScreen]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      zoomAt(viewRef.current.scale * Math.exp(-delta * 0.0015), event.clientX - rect.left, event.clientY - rect.top);
    };
    viewport.addEventListener("wheel", wheel, { passive: false });
    const observer = new ResizeObserver(fitToScreen);
    observer.observe(viewport);
    return () => {
      viewport.removeEventListener("wheel", wheel);
      observer.disconnect();
    };
  }, [fitToScreen, zoomAt]);

  const pointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  };

  const pointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const active = Array.from(pointers.current.values());
    if (active.length === 1) {
      const current = viewRef.current;
      updateView({ ...current, x: current.x + event.clientX - previous.x, y: current.y + event.clientY - previous.y });
      return;
    }
    if (active.length === 2) {
      const [a, b] = active;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = event.currentTarget.getBoundingClientRect();
      const centerX = (a.x + b.x) / 2 - rect.left;
      const centerY = (a.y + b.y) / 2 - rect.top;
      if (lastPinch.current) zoomAt(viewRef.current.scale * (distance / lastPinch.current.distance), centerX, centerY);
      lastPinch.current = { distance, centerX, centerY };
    }
  };

  const pointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) lastPinch.current = null;
  };

  return (
    <section className={cn("overflow-hidden rounded-xl border border-border bg-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Family relationships</p>
          <p className="text-xs text-muted-foreground">{members.length + 1} people · drag to explore</p>
        </div>
        <div className="flex items-center gap-1" aria-label="Family tree view controls">
          <Button type="button" size="icon" variant="ghost" onClick={() => zoomAt(view.scale / 1.2)} aria-label="Zoom out" title="Zoom out"><Minus /></Button>
          <span className="w-12 text-center text-xs font-medium tabular-nums text-muted-foreground">{Math.round(view.scale * 100)}%</span>
          <Button type="button" size="icon" variant="ghost" onClick={() => zoomAt(view.scale * 1.2)} aria-label="Zoom in" title="Zoom in"><Plus /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={fitToScreen} aria-label="Fit tree to screen" title="Fit to screen"><Maximize2 /></Button>
          <Button type="button" size="icon" variant="ghost" onClick={resetView} aria-label="Reset view" title="Center at actual size"><LocateFixed /></Button>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="relative h-[520px] cursor-grab select-none overflow-hidden bg-muted/20 active:cursor-grabbing sm:h-[610px]"
        style={{ touchAction: "none" }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            width: layout.worldWidth,
            height: layout.worldHeight,
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {layout.rows.map(({ generation }) => {
            const rowY = layout.centerGenerationY + generation * ROW_GAP;
            return (
              <span key={generation} className="absolute left-5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70" style={{ top: rowY - CARD_HEIGHT / 2 - 26 }}>
                {generationLabel(generation)}
              </span>
            );
          })}
          <TreeConnectors nodes={layout.nodes} centerX={layout.centerX} />
          {layout.nodes.map((node) => <NodeCard key={node.id} node={node} />)}
        </div>
      </div>
    </section>
  );
};