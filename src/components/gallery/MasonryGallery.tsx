import { useState } from "react";
import { MemoryLightbox, LightboxItem } from "@/components/gallery/MemoryLightbox";

export type GalleryItem = LightboxItem;

export const MasonryGallery = ({ items }: { items: GalleryItem[] }) => {
  const [active, setActive] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
        {items.map((it, idx) => (
          <button
            key={it.id}
            onClick={() => setActive(idx)}
            className="mb-4 break-inside-avoid w-full overflow-hidden rounded-2xl bg-muted group relative block"
          >
            <img
              src={it.src}
              alt={it.title || "Memory"}
              loading="lazy"
              className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {it.title && (
              <div className="absolute bottom-0 inset-x-0 p-4 text-left text-brand-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-serif text-lg leading-tight">{it.title}</p>
                {it.date && <p className="text-xs text-brand-white/70 mt-1">{it.date}</p>}
              </div>
            )}
          </button>
        ))}
      </div>

      <MemoryLightbox items={items} index={active} onIndexChange={setActive} onClose={() => setActive(null)} />
    </>
  );
};
