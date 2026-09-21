import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Pause, Play } from "lucide-react";

export type LightboxItem = {
  id: string;
  src: string;
  title?: string;
  description?: string;
  date?: string;
};

const AUTO_ADVANCE_MS = 8000;

/**
 * Shared full-screen memory viewer used by Life Moments and the memorial page.
 * Advances automatically every 8 seconds and supports keyboard, swipe and buttons.
 */
export const MemoryLightbox = ({
  items,
  index,
  onClose,
  onIndexChange,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) => {
  const [playing, setPlaying] = useState(true);
  const [touchX, setTouchX] = useState<number | null>(null);
  const open = index !== null && items.length > 0;

  const go = useCallback(
    (step: number) => {
      if (index === null) return;
      onIndexChange((index + step + items.length) % items.length);
    },
    [index, items.length, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open || !playing || items.length < 2) return;
    const t = setTimeout(() => go(1), AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, [open, playing, index, items.length, go]);

  if (!open || index === null) return null;
  const item = items[index];
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md sm:p-8 animate-fade-up"
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2 sm:top-5 sm:right-5">
        {items.length > 1 && (
          <button
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? "Pause slideshow" : "Play slideshow"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        )}
        <button
          onClick={onClose}
          aria-label="Close"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {items.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous"
            className="absolute left-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-6 sm:h-12 sm:w-12"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next"
            className="absolute right-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-6 sm:h-12 sm:w-12"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      <div className="flex max-h-full w-full max-w-5xl flex-col items-center gap-4">
        <img
          key={item.src}
          src={item.src}
          alt={item.title || "Memory"}
          className="max-h-[68vh] w-auto max-w-full rounded-lg object-contain shadow-2xl animate-fade-up"
        />
        {(item.title || item.description || item.date) && (
          <div className="max-w-2xl px-2 text-center text-white">
            {item.title && <p className="font-serif text-xl sm:text-2xl">{item.title}</p>}
            {item.date && <p className="mt-1 text-[11px] uppercase tracking-widest text-white/60">{item.date}</p>}
            {item.description && <p className="mt-3 text-sm leading-relaxed text-white/80 sm:text-base">{item.description}</p>}
          </div>
        )}
        {items.length > 1 && (
          <>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {items.map((it, i) => (
                <button
                  key={it.id}
                  onClick={() => onIndexChange(i)}
                  aria-label={`Go to memory ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-brand-orange" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                />
              ))}
            </div>
            <p className="text-xs text-white/50">{index + 1} / {items.length}</p>
          </>
        )}
      </div>
    </div>
  );
};
