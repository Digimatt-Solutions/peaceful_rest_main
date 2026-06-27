import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Download, Share2, QrCode } from "lucide-react";
import { toast } from "sonner";

type Props = {
  memorialId: string;
  memorialName: string;
  size?: number;
  compact?: boolean;
};

export const MemorialQR = ({ memorialId, memorialName, size = 180, compact = false }: Props) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const url = `${window.location.origin}/memorial/${memorialId}`;

  const download = () => {
    const canvas = wrapRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
    if (!canvas) return;
    const padded = document.createElement("canvas");
    const pad = 32;
    padded.width = canvas.width + pad * 2;
    padded.height = canvas.height + pad * 2 + 48;
    const ctx = padded.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, padded.width, padded.height);
    ctx.drawImage(canvas, pad, pad);
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "600 16px Quicksand, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(memorialName, padded.width / 2, canvas.height + pad + 28);
    const link = document.createElement("a");
    link.download = `makiwa-${memorialName.replace(/\s+/g, "-").toLowerCase()}-qr.png`;
    link.href = padded.toDataURL("image/png");
    link.click();
    toast.success("QR code downloaded");
  };

  const share = async () => {
    if (navigator.share) {
      await navigator.share({ title: memorialName, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Memorial link copied");
    }
  };

  return (
    <div className={`rounded-2xl border border-brand-orange/30 bg-gradient-to-b from-brand-orange/[0.04] to-transparent p-6 text-center ${compact ? "" : ""}`}>
      <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-brand-orange font-semibold">
        <QrCode className="h-3 w-3" /> Share Memorial
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Scan to open this memorial page
      </p>
      <div
        ref={wrapRef}
        className="mt-4 inline-flex items-center justify-center bg-white p-3 rounded-xl border border-border shadow-sm"
      >
        <QRCodeCanvas
          value={url}
          size={size}
          level="H"
          marginSize={1}
          fgColor="#0a0a0a"
        />
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <Button onClick={download} className="w-full rounded-xl bg-brand-orange text-white hover:bg-brand-orange/90">
          <Download className="h-4 w-4 mr-2" /> Download QR
        </Button>
        <Button onClick={share} variant="outline" className="w-full rounded-xl">
          <Share2 className="h-4 w-4 mr-2" /> Share link
        </Button>
      </div>
    </div>
  );
};
