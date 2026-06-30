import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/makiwa-logo-light.png";

const links = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Memorials", href: "#memorials" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="fixed -top-1 inset-x-0 z-50 bg-brand-black/90 border-b border-brand-white/10">
      <nav className="container-luxe flex items-center justify-between h-20">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src={logo} alt="Makiwa" className="h-8 w-auto object-contain" />
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
            <Button asChild className="rounded-full bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow border border-brand-orange/40">
              <Link to="/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-lg text-brand-white border border-brand-white/60 hover:bg-brand-white/10 hover:text-brand-white">
                <Link to="/auth"><LogIn className="mr-1.5 h-4 w-4" />Sign In</Link>
              </Button>
              <Button asChild className="rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90 shadow-glow border border-brand-orange/40">
                <Link to="/auth"><UserPlus className="mr-1.5 h-4 w-4" />Sign Up</Link>
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
          <ul className="container-luxe py-4 flex flex-col gap-4">
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
            <li className="flex gap-3 pt-1">
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
