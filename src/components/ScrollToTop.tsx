import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Floating scroll-to-top control with a circular progress ring that tracks
 * how far down the page the visitor has read.
 */
export const ScrollToTop = ({ className }: { className?: string }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const pct = height > 0 ? Math.min(100, Math.max(0, (top / height) * 100)) : 0;
      setProgress(pct);
      setVisible(top > 320);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const R = 22;
  const C = 2 * Math.PI * R;

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-6 right-5 z-50 h-14 w-14 rounded-full bg-background/90 backdrop-blur shadow-lg",
        "flex items-center justify-center transition-all duration-300 hover:scale-105",
        visible ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-3",
        className
      )}
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={R} fill="none" strokeWidth="3" className="stroke-border" />
        <circle
          cx="28"
          cy="28"
          r={R}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-brand-orange transition-[stroke-dashoffset] duration-150"
          strokeDasharray={C}
          strokeDashoffset={C - (progress / 100) * C}
        />
      </svg>
      <ArrowUp className="relative h-5 w-5 text-brand-orange" />
    </button>
  );
};

export default ScrollToTop;
