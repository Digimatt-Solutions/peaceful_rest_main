import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", href: "#home" },
  { label: "Memorials", href: "#memorials" },
  { label: "Services", href: "#services" },
  { label: "Community", href: "#community" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-brand-black/55 backdrop-blur-xl border-b border-brand-white/10">
      <nav className="container-luxe flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-brand-white/10 ring-1 ring-brand-white/15">
            <Flame className="h-4 w-4 text-brand-orange candle-flicker" />
          </span>
          <span className="font-serif text-2xl font-semibold tracking-tight text-brand-white">
            Peaceful<span className="text-brand-orange">Rest</span>
          </span>
        </Link>

        <ul className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="text-sm font-medium tracking-wide text-brand-white/85 transition-colors hover:text-brand-orange"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <Button asChild className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-full text-brand-white hover:bg-brand-white/10 hover:text-brand-white">
                <Link to="/auth">Login</Link>
              </Button>
              <Button asChild className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow">
                <Link to="/auth">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 text-brand-white"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden bg-brand-black/95 backdrop-blur-xl border-t border-brand-white/10 animate-fade-up">
          <ul className="container-luxe py-6 flex flex-col gap-4">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block py-2 text-base font-medium text-brand-white/85 hover:text-brand-orange"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="flex gap-3 pt-2">
              {user ? (
                <Button asChild className="flex-1 rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Link to="/dashboard">Dashboard</Link></Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1 rounded-full bg-transparent text-brand-white border-brand-white/30 hover:bg-brand-white/10 hover:text-brand-white"><Link to="/auth">Login</Link></Button>
                  <Button asChild className="flex-1 rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Link to="/auth">Sign Up</Link></Button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};
