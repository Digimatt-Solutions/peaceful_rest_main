import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type ScrollGalleryItem = {
  id: string;
  src: string;
  title?: string;
  description?: string;
  date?: string;
};

export const HorizontalScrollGallery = ({ items }: { items: ScrollGalleryItem[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateButtons();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateButtons);
    window.addEventListener("resize", updateButtons);
    return () => {
      el.removeEventListener("scroll", updateButtons);
      window.removeEventListener("resize", updateButtons);
    };
  }, [items.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (active === null) return;
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => (i === null ? null : (i + 1) % items.length));
      if (e.key === "ArrowLeft") setActive((i) => (i === null ? null : (i - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, items.length]);

  useEffect(() => {
    document.body.style.overflow = active !== null ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [active]);

  if (items.length === 0) return null;

  return (
    <>
      <div className="relative">
        {canLeft && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="hidden sm:inline-flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-background border border-brand-orange/40 shadow-lg items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-white transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
        {canRight && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="hidden sm:inline-flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 h-11 w-11 rounded-full bg-background border border-brand-orange/40 shadow-lg items-center justify-center text-brand-orange hover:bg-brand-orange hover:text-white transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-2 px-2 scroll-smooth [scrollbar-width:thin]"
        >
          {items.map((it, idx) => (
            <button
              key={it.id}
              onClick={() => setActive(idx)}
              className="snap-start shrink-0 w-[260px] sm:w-[320px] group relative overflow-hidden rounded-2xl bg-muted border border-border"
            >
              <img
                src={it.src}
                alt={it.title || "Memory"}
                loading="lazy"
                className="w-full h-[260px] sm:h-[300px] object-cover transition-transform duration-700 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {it.title && (
                <div className="absolute bottom-0 inset-x-0 p-4 text-left text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="font-serif text-lg leading-tight">{it.title}</p>
                  {it.date && <p className="text-xs text-white/70 mt-1">{it.date}</p>}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {active !== null && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-up">
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute top-5 right-5 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActive((i) => (i === null ? null : (i - 1 + items.length) % items.length))}
            aria-label="Previous"
            className="absolute left-3 sm:left-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActive((i) => (i === null ? null : (i + 1) % items.length))}
            aria-label="Next"
            className="absolute right-3 sm:right-6 h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 text-white inline-flex items-center justify-center"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="max-w-5xl w-full max-h-full flex flex-col items-center gap-4">
            <img
              src={items[active].src}
              alt={items[active].title || "Memory"}
              className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl"
            />
            {(items[active].title || items[active].description) && (
              <div className="text-center text-white max-w-2xl">
                {items[active].title && <p className="font-serif text-2xl">{items[active].title}</p>}
                {items[active].date && <p className="text-xs text-white/60 uppercase tracking-widest mt-1">{items[active].date}</p>}
                {items[active].description && <p className="mt-3 text-white/80 leading-relaxed">{items[active].description}</p>}
              </div>
            )}
            <p className="text-xs text-white/50 mt-2">{active + 1} / {items.length}</p>
          </div>
        </div>
      )}
    </>
  );
};
