import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/makiwa-logo-light.png";

export const Footer = () => {
  return (
    <footer id="contact" className="relative overflow-hidden border-t border-brand-white/10 bg-brand-black pb-10 pt-20 text-brand-white/75">
      <div aria-hidden className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-brand-white/10" />
      <div className="container-luxe grid md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div>
          <img src={logo} alt="Makiwa" className="h-8 w-auto object-contain" />
          <p className="mt-6 text-sm leading-relaxed">
            A sanctuary to honor lives, preserve memories, and support families through grief.
          </p>
          <div className="mt-6 flex gap-3">
            {[
              { Icon: Facebook, label: "Facebook", href: "https://www.facebook.com/profile.php?id=61594408438497" },
              { Icon: Instagram, label: "Instagram", href: "#" },
              { Icon: Twitter, label: "Twitter", href: "#" },
            ].map(({ Icon, label, href }) => {
              const external = href.startsWith("http");
              return (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-white/20 transition-colors hover:border-brand-orange hover:text-brand-orange"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <h4 className="font-serif text-lg text-brand-white">Explore</h4>
          <ul className="mt-5 space-y-3 text-sm">
            {["Memorials", "Services", "Community", "Pricing", "About"].map((l) => (
              <li key={l}><a href="#" className="hover:text-brand-orange transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg text-brand-white">Support</h4>
          <ul className="mt-5 space-y-3 text-sm">
            {["Help Center", "Privacy Policy", "Terms of Service", "Bereavement Resources", "Contact Us"].map((l) => (
              <li key={l}><a href="#" className="hover:text-brand-orange transition-colors">{l}</a></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-serif text-lg text-brand-white">Get in touch</h4>
          <ul className="mt-5 space-y-4 text-sm">
            <li className="flex gap-3"><Mail className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> <a href="mailto:info@makiwa.ke" className="hover:text-brand-orange transition-colors">info@makiwa.ke</a></li>
            <li className="flex gap-3"><Phone className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> <a href="tel:+254116797979" className="hover:text-brand-orange transition-colors">+254 116 797979</a></li>
            <li className="flex gap-3"><MapPin className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> Wood Avenue, Kilimani, Nairobi</li>

          </ul>
        </div>
      </div>

      <div className="container-luxe mt-16 pt-8 border-t border-brand-white/10 flex flex-wrap justify-between items-center gap-4 text-xs text-brand-white/50">
        <p>© {new Date().getFullYear()} Makiwa. Made with care for grieving families.</p>
        <p>
          Powered by{" "}
          <a
            href="https://digimatt.co.ke/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-orange hover:underline font-medium"
          >
            Digimatt Solutions
          </a>
        </p>
      </div>
    </footer>
  );
};
