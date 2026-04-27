import { Flame, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react";

export const Footer = () => {
  return (
    <footer id="contact" className="bg-brand-black text-brand-white/80 pt-20 pb-10">
      <div className="container-luxe grid md:grid-cols-2 lg:grid-cols-4 gap-12">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-full bg-brand-white/5 border border-brand-white/10 flex items-center justify-center">
              <Flame className="h-4 w-4 text-brand-orange candle-flicker" />
            </span>
            <span className="font-serif text-2xl font-semibold text-brand-white">
              Peaceful<span className="text-brand-orange">Rest</span>
            </span>
          </div>
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
            <li className="flex gap-3"><Mail className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> hello@peacefulrest.com</li>
            <li className="flex gap-3"><Phone className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> +1 (800) 555-0199</li>
            <li className="flex gap-3"><MapPin className="h-4 w-4 text-brand-orange shrink-0 mt-0.5" /> Available worldwide, 24/7</li>
          </ul>
        </div>
      </div>

      <div className="container-luxe mt-16 pt-8 border-t border-brand-white/10 flex flex-wrap justify-between items-center gap-4 text-xs text-brand-white/50">
        <p>© {new Date().getFullYear()} Peaceful Rest. Made with care for grieving families.</p>
        <p>Honoring every life, every story.</p>
      </div>
    </footer>
  );
};
