import { memorialInvitation } from "./memorialInvitation.ts";

export type PublicMemorialPreview = { full_name: string; profile_photo_url: string | null };

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character] ?? character);

export function memorialPreviewHtml(html: string, memorial: PublicMemorialPreview, pageUrl: string) {
  const name = escapeHtml(memorial.full_name);
  const title = `${name} | Makiwa`;
  const description = escapeHtml(memorialInvitation(memorial.full_name));
  const canonical = new URL(pageUrl);
  canonical.search = "";
  canonical.hash = "";
  let photo: string | null = null;
  if (memorial.profile_photo_url) {
    try {
      const url = new URL(memorial.profile_photo_url, canonical.origin);
      if (url.protocol === "https:") photo = escapeHtml(url.href);
    } catch { /* Keep the site's existing missing-photo fallback. */ }
  }
  return html.replace(/<head\b[^>]*>[\s\S]*?<\/head>/i, (head) => {
    let cleaned = head
      .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, "")
      .replace(/<meta\b[^>]*>/gi, (tag) => {
        const attribute = tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
        if (attribute === "description" || attribute?.startsWith("og:") || attribute?.startsWith("twitter:")) return "";
        return tag;
      })
      .replace(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/gi, "");
    if (photo) cleaned = cleaned.replace(/<link\b[^>]*\brel\s*=\s*["'](?:icon|shortcut icon)["'][^>]*>/gi, "");
    const tags = [
      `<title>${title}</title>`,
      `<meta name="description" content="${description}">`,
      `<link rel="canonical" href="${escapeHtml(canonical.href)}">`,
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}">`,
      '<meta property="og:site_name" content="Makiwa">',
      '<meta property="og:type" content="website">',
      `<meta property="og:url" content="${escapeHtml(canonical.href)}">`,
      '<meta name="twitter:card" content="summary_large_image">',
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${description}">`,
    ];
    if (photo) tags.push(
      `<meta property="og:image" content="${photo}">`,
      `<meta property="og:image:alt" content="${name}">`,
      `<meta name="twitter:image" content="${photo}">`,
      `<meta name="twitter:image:alt" content="${name}">`,
      `<link rel="icon" href="${photo}">`,
    );
    return cleaned.replace(/<\/head>/i, `${tags.join("\n")}\n</head>`);
  });
}
