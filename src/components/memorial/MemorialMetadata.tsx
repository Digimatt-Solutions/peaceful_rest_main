import { Helmet } from "react-helmet-async";
import { memorialPreviewImage, memorialShareData } from "@/lib/memorialSharing";

// Netlify injects matching tags into the original HTML for social crawlers.
export const MemorialMetadata = ({ id, name, photo }: { id: string; name: string; photo?: string | null }) => {
  const { title, text, url } = memorialShareData(id, name);
  const image = memorialPreviewImage(photo);
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={text} />
      <link rel="canonical" href={url} />
      <link rel="icon" href={image} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={text} />
      <meta property="og:site_name" content="Makiwa" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={photo ? name : "Makiwa remembrance candle"} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={text} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={photo ? name : "Makiwa remembrance candle"} />
    </Helmet>
  );
};
