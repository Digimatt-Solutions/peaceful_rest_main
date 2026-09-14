import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, LogIn, UserPlus, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import logo from "@/assets/makiwa-logo-black.png";

const links = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Memorials", href: "#memorials" },
  { label: "Services", href: "#services" },
  { label: "Contact", href: "#contact" },
];

const scrollToSection = (href: string) => {
  const id = href.replace("#", "");
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);

    if (location.pathname === "/") {
      scrollToSection(href);
    } else {
      navigate(`/${href}`);
      // After navigation, wait for the landing page to mount then scroll.
      setTimeout(() => scrollToSection(href), 100);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-brand-black/10 bg-cream/95 backdrop-blur-xl">
      <nav className="container-luxe flex h-[4.75rem] items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img src={logo} alt="Makiwa" className="h-8 w-auto object-contain" />
        </Link>

        <ul className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                onClick={(e) => handleNavClick(e, l.href)}
                className="text-sm font-semibold text-brand-black/70 transition-colors hover:text-brand-orange"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <Button asChild className="rounded-lg border border-brand-orange bg-brand-orange text-brand-white shadow-none hover:bg-brand-orange/90">
              <Link to="/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="rounded-lg border border-brand-black/15 text-brand-black hover:border-brand-orange/50 hover:bg-brand-orange/5 hover:text-brand-orange">
                <Link to="/auth?tab=login"><LogIn className="mr-1.5 h-4 w-4" />Login</Link>
              </Button>
              <Button asChild className="rounded-lg border border-brand-orange bg-brand-orange text-brand-white shadow-none hover:bg-brand-orange/90">
                <Link to="/auth?tab=create-account"><UserPlus className="mr-1.5 h-4 w-4" />Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 text-brand-black"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="lg:hidden border-t border-brand-black/10 bg-cream/98 backdrop-blur-xl animate-fade-up">
          <ul className="container-luxe py-4 flex flex-col gap-4">
            {links.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={(e) => handleNavClick(e, l.href)}
                  className="block py-2 text-base font-medium text-brand-black/80 hover:text-brand-orange"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="flex gap-3 pt-1">
              {user ? (
                <Button asChild className="flex-1 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Link to="/dashboard">Dashboard</Link></Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="flex-1 rounded-lg border-brand-black/15 bg-transparent text-brand-black hover:bg-brand-black/5"><Link to="/auth?tab=login">Login</Link></Button>
                  <Button asChild className="flex-1 rounded-lg bg-brand-orange text-brand-white hover:bg-brand-orange/90"><Link to="/auth?tab=create-account">Sign Up</Link></Button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};
