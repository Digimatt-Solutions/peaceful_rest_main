import { cn } from "@/lib/utils";

/**
 * Renders free-text content (biography, service schedule, burial details)
 * in a neat, systematic layout:
 *  - blank lines separate paragraphs
 *  - lines starting with -, *, • or "1." become bullet / numbered lists
 *  - "Label: value" lines become a clean definition row
 *  - short standalone lines in ALL CAPS or ending with ":" become sub-headings
 */
interface Props {
  text?: string | null;
  className?: string;
  variant?: "prose" | "compact";
}

type Block =
  | { type: "heading"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "detail"; rows: [string, string][] }
  | { type: "paragraph"; text: string };

const BULLET = /^\s*(?:[-*•–]|\d+[.)])\s+/;
const ORDERED = /^\s*\d+[.)]\s+/;
const DETAIL = /^\s*([A-Za-z][A-Za-z0-9 /'&()-]{1,32}):\s*(.+)$/;

const parse = (raw: string): Block[] => {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let detail: [string, string][] | null = null;

  const flush = () => {
    if (para.length) { blocks.push({ type: "paragraph", text: para.join(" ").trim() }); para = []; }
    if (list) { blocks.push({ type: "list", ...list }); list = null; }
    if (detail) { blocks.push({ type: "detail", rows: detail }); detail = null; }
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { flush(); continue; }

    if (BULLET.test(t)) {
      if (para.length || detail) { const l = list; list = null; flush(); list = l; }
      const ordered = ORDERED.test(t);
      if (!list || list.ordered !== ordered) { if (list) blocks.push({ type: "list", ...list }); list = { ordered, items: [] }; }
      list.items.push(t.replace(BULLET, "").trim());
      continue;
    }

    const m = t.match(DETAIL);
    if (m && m[2].length <= 160) {
      if (para.length || list) { const d = detail; detail = null; flush(); detail = d; }
      detail = detail || [];
      detail.push([m[1].trim(), m[2].trim()]);
      continue;
    }

    if (t.length <= 60 && (t === t.toUpperCase() && /[A-Z]/.test(t) || t.endsWith(":"))) {
      flush();
      blocks.push({ type: "heading", text: t.replace(/:$/, "") });
      continue;
    }

    if (list || detail) flush();
    para.push(t);
  }
  flush();
  return blocks;
};

export const FormattedText = ({ text, className, variant = "prose" }: Props) => {
  if (!text || !text.trim()) return null;
  const blocks = parse(text);
  const compact = variant === "compact";

  return (
    <div className={cn(compact ? "space-y-3" : "space-y-5", className)}>
      {blocks.map((b, i) => {
        if (b.type === "heading") {
          return (
            <h4
              key={i}
              className={cn(
                "font-semibold tracking-wide text-brand-orange",
                compact ? "text-xs uppercase tracking-[0.18em]" : "text-sm uppercase tracking-[0.2em]"
              )}
            >
              {b.text}
            </h4>
          );
        }
        if (b.type === "list") {
          const Tag = b.ordered ? "ol" : "ul";
          return (
            <Tag key={i} className={cn("space-y-2", compact ? "text-sm" : "text-base")}>
              {b.items.map((it, j) => (
                <li key={j} className="flex gap-3 text-foreground/85 leading-relaxed">
                  <span className={cn("mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-orange", b.ordered && "hidden")} />
                  {b.ordered && (
                    <span className="mt-[0.05em] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-orange/10 text-[11px] font-semibold text-brand-orange">
                      {j + 1}
                    </span>
                  )}
                  <span>{it}</span>
                </li>
              ))}
            </Tag>
          );
        }
        if (b.type === "detail") {
          return (
            <dl key={i} className="grid gap-px overflow-hidden rounded-xl border border-brand-orange/20 bg-brand-orange/10">
              {b.rows.map(([k, v], j) => (
                <div key={j} className="grid gap-1 bg-card px-4 py-2.5 sm:grid-cols-[minmax(120px,180px)_1fr] sm:gap-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
                  <dd className="text-sm text-foreground/90">{v}</dd>
                </div>
              ))}
            </dl>
          );
        }
        return (
          <p
            key={i}
            className={cn(
              "text-foreground/85",
              compact ? "text-sm leading-relaxed" : "text-lg leading-[1.85]"
            )}
          >
            {b.text}
          </p>
        );
      })}
    </div>
  );
};

export default FormattedText;
