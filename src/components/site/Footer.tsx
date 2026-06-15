import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";
import logo from "@/assets/makiwa-logo.png";

export const Footer = () => {
  return (
    <footer id="contact" className="bg-brand-black text-brand-white/80 pt-20 pb-10">
      <div className="container-luxe grid md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div>
          <img src={logo} alt="Makiwa" className="h-12 w-auto object-contain" />
          <p className="mt-5 text-sm leading-relaxed">
            A sanctuary to honor lives, preserve memories, and support families through grief.
          </p>
          <div className="mt-6 flex gap-3">
            {[Facebook, Instagram, Twitter].map((Icon, i) => (
              <a
                key={i}
                href="#"
                className="h-10 w-10 rounded-full border border-brand-white/15 flex items-center justify-center hover:bg-brand-orange hover:border-brand-orange transition-colors"
                aria-label="Social link"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
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
            <li className="flex gap-3"><Mail className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> info@makiwa.com</li>
            <li className="flex gap-3"><Phone className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> +254 700 000 000</li>
            <li className="flex gap-3"><MapPin className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> Mon - Fri, 8:00 AM - 6:00 PM</li>
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
