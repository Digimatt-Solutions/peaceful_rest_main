import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
import { CheckCircle2, AlertTriangle, XCircle, Info, Loader2 } from "lucide-react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      duration={3500}
      closeButton
      visibleToasts={3}
      className="toaster group"
      icons={{
        success: <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />,
        error: <XCircle className="h-[18px] w-[18px] text-destructive" />,
        warning: <AlertTriangle className="h-[18px] w-[18px] text-amber-500" />,
        info: <Info className="h-[18px] w-[18px] text-sky-500" />,
        loading: <Loader2 className="h-[18px] w-[18px] animate-spin text-muted-foreground" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur group-[.toaster]:text-foreground group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:gap-3 group-[.toaster]:text-sm",
          title: "group-[.toast]:font-medium group-[.toast]:text-[13px] sm:group-[.toast]:text-sm",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-xs",
          icon: "group-[.toast]:mt-0.5",
          closeButton:
            "group-[.toast]:bg-background group-[.toast]:border-border group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
