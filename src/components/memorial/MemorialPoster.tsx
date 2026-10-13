export const MemorialPoster = ({ src, name }: { src: string; name: string }) => (
  <figure className="mx-auto w-full max-w-sm aspect-[2/3] overflow-hidden rounded-lg bg-muted">
    <a href={src} target="_blank" rel="noreferrer" aria-label={`View poster for ${name}`} className="block h-full w-full">
      <img src={src} alt={`Memorial poster for ${name}`} className="h-full w-full object-contain" loading="lazy" />
    </a>
  </figure>
);