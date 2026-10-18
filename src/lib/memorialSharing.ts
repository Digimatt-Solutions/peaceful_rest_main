import defaultMemorialPhoto from "@/assets/candle.jpg";
import { MAKIWA_DESCRIPTION, memorialInvitation } from "./memorialInvitation";
export { MAKIWA_DESCRIPTION, memorialInvitation } from "./memorialInvitation";

// Page-specific share metadata so every shared Makiwa link introduces the platform.
export const siteShareData = (origin = window.location.origin) => ({
  title: "Makiwa - Honouring Lives, Preserving Memories",
  text: MAKIWA_DESCRIPTION,
  url: origin,
});

export const memorialShareData = (id: string, fullName: string, origin = window.location.origin) => ({
  title: `${fullName} | Makiwa`,
  text: memorialInvitation(fullName),
  url: new URL(`/memorial/${encodeURIComponent(id)}`, origin).href,
});

export const memorialPreviewImage = (photo: string | null | undefined, origin = window.location.origin) => {
  if (photo) {
    try {
      const url = new URL(photo, origin);
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch { /* Use the remembrance image for malformed URLs. */ }
  }
  return new URL(defaultMemorialPhoto, origin).href;
};

export const shareMemorialLink = async (id: string, fullName: string) => {
  const data = memorialShareData(id, fullName);
  if (navigator.share) {
    await navigator.share(data);
    return "shared";
  }
  await navigator.clipboard.writeText(data.url);
  return "copied";
};
