import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Share2,
  Link2,
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { memorialShareData } from "@/lib/memorialSharing";

/** Share a memorial via WhatsApp, Facebook, Instagram, LinkedIn, X or a copied link. */
export const ShareMemorialMenu = ({
  memorialId,
  name,
  urlOverride,
  textOverride,
  compact,
}: {
  memorialId: string;
  name: string;
  urlOverride?: string;
  textOverride?: string;
  compact?: boolean;
}) => {
  const base = memorialShareData(memorialId, name);
  const url = urlOverride || base.url;
  const text = textOverride || base.text;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);

  const open = (href: string) =>
    window.open(href, "_blank", "noopener,noreferrer,width=640,height=560");

  const copy = async (msg = "Link copied to clipboard") => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success(msg);
    } catch {
      toast.error("We couldn't copy the link");
    }
  };

  const items = [
    {
      label: "WhatsApp",
      icon: MessageCircle,
      run: () => open(`https://wa.me/?text=${t}%20${u}`),
    },
    {
      label: "Facebook",
      icon: Facebook,
      run: () => open(`https://www.facebook.com/sharer/sharer.php?u=${u}`),
    },
    {
      label: "Instagram",
      icon: Instagram,
      run: async () => {
        if (navigator.share) {
          try {
            await navigator.share({ title: name, text, url });
          } catch {}
        } else {
          copy("Link copied. Paste it into your Instagram story or bio");
        }
      },
    },
    {
      label: "LinkedIn",
      icon: Linkedin,
      run: () =>
        open(`https://www.linkedin.com/sharing/share-offsite/?url=${u}`),
    },
    {
      label: "X",
      icon: Twitter,
      run: () =>
        open(`https://twitter.com/intent/tweet?text=${t}&url=${u}`),
    },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button className="group inline-flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-brand-orange hover:text-white text-muted-foreground ml-auto text-sm transition-colors">
            <Share2 className="h-4 w-4 group-hover:text-white" />
            Share
          </button>
        ) : (
          <Button className="group rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90 hover:text-white border-2 border-brand-orange h-11 sm:h-12 px-4 shadow-lg font-bold">
            <Share2 className="h-4 w-4 group-hover:text-white" />
            Share memorial
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-52 rounded-xl">
        {items.map(({ label, icon: Icon, run }) => (
          <DropdownMenuItem
            key={label}
            onClick={run}
            className="group gap-2 cursor-pointer hover:bg-brand-orange hover:text-white focus:bg-brand-orange focus:text-white"
          >
            <Icon className="h-4 w-4 text-brand-orange group-hover:text-white group-focus:text-white" />
            {label}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        {typeof navigator !== "undefined" && "share" in navigator && (
          <DropdownMenuItem
            onClick={() =>
              navigator.share({ title: name, text, url }).catch(() => {})
            }
            className="group gap-2 cursor-pointer hover:bg-brand-orange hover:text-white focus:bg-brand-orange focus:text-white"
          >
            <Smartphone className="h-4 w-4 text-brand-orange group-hover:text-white group-focus:text-white" />
            More options
          </DropdownMenuItem>
        )}

        <DropdownMenuItem
          onClick={() => copy()}
          className="group gap-2 cursor-pointer hover:bg-brand-orange hover:text-white focus:bg-brand-orange focus:text-white"
        >
          <Link2 className="h-4 w-4 text-brand-orange group-hover:text-white group-focus:text-white" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};