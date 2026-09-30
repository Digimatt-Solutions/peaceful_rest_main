import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Link2, MessageCircle, Facebook, Instagram, Linkedin, Twitter, Smartphone } from "lucide-react";
import { toast } from "sonner";

/** Share a memorial via WhatsApp, Facebook, Instagram, LinkedIn, X or a copied link. */
export const ShareMemorialMenu = ({ name, description }: { name: string; description?: string | null }) => {
  const url = `${window.location.origin}${window.location.pathname}`;
  const text = `In loving memory of ${name}${description ? ` - ${description}` : ""}`;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);

  const open = (href: string) => window.open(href, "_blank", "noopener,noreferrer,width=640,height=560");
  const copy = async (msg = "Link copied to clipboard") => {
    try { await navigator.clipboard.writeText(url); toast.success(msg); }
    catch { toast.error("We couldn't copy the link"); }
  };

  const items = [
    { label: "WhatsApp", icon: MessageCircle, run: () => open(`https://wa.me/?text=${t}%20${u}`) },
    { label: "Facebook", icon: Facebook, run: () => open(`https://www.facebook.com/sharer/sharer.php?u=${u}`) },
    // Instagram has no web share link: use the phone's share sheet, or copy the link to paste.
    {
      label: "Instagram", icon: Instagram, run: async () => {
        if (navigator.share) { try { await navigator.share({ title: name, text, url }); } catch {} }
        else copy("Link copied. Paste it into your Instagram story or bio");
      },
    },
    { label: "LinkedIn", icon: Linkedin, run: () => open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`) },
    { label: "X", icon: Twitter, run: () => open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`) },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 border-2 border-brand-orange h-11 sm:h-12 px-4 shadow-lg font-bold">
          <Share2 className="h-4 w-4" /> Share memorial
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-xl">
        {items.map(({ label, icon: Icon, run }) => (
          <DropdownMenuItem key={label} onClick={run} className="gap-2 cursor-pointer">
            <Icon className="h-4 w-4 text-brand-orange" /> {label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem onClick={() => navigator.share({ title: name, text, url }).catch(() => {})} className="gap-2 cursor-pointer">
            <Smartphone className="h-4 w-4 text-brand-orange" /> More options
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => copy()} className="gap-2 cursor-pointer">
          <Link2 className="h-4 w-4 text-brand-orange" /> Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
