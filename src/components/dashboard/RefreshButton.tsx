import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export const RefreshButton = () => {
  const queryClient = useQueryClient();
  const [spinning, setSpinning] = useState(false);

  const onRefresh = async () => {
    setSpinning(true);
    try {
      await queryClient.invalidateQueries();
      queryClient.clear();
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      toast.success("Refreshing to latest state…");
      setTimeout(() => window.location.reload(), 350);
    } catch {
      window.location.reload();
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onRefresh}
      className="rounded-full h-9 px-4 border-brand-orange/40 text-brand-orange hover:bg-brand-orange/10 hover:text-brand-orange"
      aria-label="Refresh"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${spinning ? "animate-spin" : ""}`} />
      Refresh
    </Button>
  );
};
