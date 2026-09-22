import { useState } from "react";
import { MemoryLightbox, LightboxItem } from "@/components/gallery/MemoryLightbox";

export type MarqueeItem = LightboxItem;

/**
 * Slow, seamless right-to-left photo marquee.
 * The list is rendered twice and shifted by exactly 50%, so the loop is invisible.
 * Pauses on hover/focus and respects reduced-motion preferences.
 */
export const MemoryMarquee = ({ items }: { items: MarqueeItem[] }) => {
  const [active, setActive] = useState<number | null>(null);
  if (items.length === 0) return null;

  // ~9 seconds of travel per photo keeps it calm on short and long lists alike.
  const duration = Math.max(24, items.length * 9);
  const loop = [...items, ...items];

  return (
    <>
      <div className="group relative overflow-hidden -mx-2 px-2 [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
        <div
          className="flex w-max gap-4 animate-marquee-x group-hover:[animation-play-state:paused] motion-reduce:animate-none motion-reduce:overflow-x-auto"
          style={{ animationDuration: `${duration}s` }}
        >
          {loop.map((it, idx) => (
            <button
              key={`${it.id}-${idx}`}
              onClick={() => setActive(idx % items.length)}
              aria-label={it.title || "Open memory"}
              className="relative shrink-0 w-[240px] sm:w-[300px] overflow-hidden rounded-2xl border border-border bg-muted"
            >
              <img
                src={it.src}
                alt={it.title || "Memory"}
                loading="lazy"
                decoding="async"
                className="w-full h-[240px] sm:h-[290px] object-cover"
              />
              {it.title && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-left text-white">
                  <p className="font-serif text-base leading-tight line-clamp-1">{it.title}</p>
                  {it.date && <p className="text-[11px] text-white/70 mt-0.5">{it.date}</p>}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <MemoryLightbox items={items} index={active} onIndexChange={setActive} onClose={() => setActive(null)} />
    </>
  );
};
