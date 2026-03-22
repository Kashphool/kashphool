/*
  DESIGN: Sacred Geometry Modernism
  - Minimal footer with gold accents
  - OM symbol and cultural identity
  - Social links and navigation
*/

import { IMAGES } from "@/config";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

export default function Footer() {
  const handleNavClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-gold/10">
      {/* Top gold line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={IMAGES.LOGO} alt="Kashphool" className="w-10 h-10" />
              <span className="font-[var(--font-display)] text-xl font-bold text-gold-gradient">
                Kashphool
              </span>
            </div>
            <p className="text-ivory/50 text-sm leading-relaxed max-w-xs">
              An Indian Bengali Association based in North Kent, dedicated to preserving
              and celebrating our rich cultural heritage.
            </p>
            <div className="mt-4">
              <span className="text-3xl text-saffron/40 font-[var(--font-bengali)]">ॐ</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-[var(--font-display)] text-lg font-semibold text-ivory/90 mb-4">
              Quick Links
            </h4>
            <div className="h-[1px] w-12 bg-gold/30 mb-4" />
            <nav className="space-y-2.5">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
                  className="block text-ivory/50 hover:text-saffron transition-colors duration-300 text-sm"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-[var(--font-display)] text-lg font-semibold text-ivory/90 mb-4">
              Connect
            </h4>
            <div className="h-[1px] w-12 bg-gold/30 mb-4" />
            <div className="space-y-3 text-ivory/50 text-sm">
              <p>North Kent, United Kingdom</p>
              <p>Established 2025</p>
              <a
                href="https://pay.lopay.com/request/906de5de-220b-4f34-bc56-776c0993ec32"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-saffron hover:text-gold transition-colors duration-300"
              >
                Support Our Mission →
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gold/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ivory/30 text-xs tracking-wide">
            © {new Date().getFullYear()} Kashphool. All rights reserved.
          </p>
          <p className="text-ivory/20 text-xs tracking-wide">
            Preserving Bengali Heritage in North Kent
          </p>
        </div>
      </div>
    </footer>
  );
}
