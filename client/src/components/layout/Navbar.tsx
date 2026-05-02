/*
  DESIGN: Sacred Geometry Modernism
  - Transparent navbar that becomes solid on scroll
  - Gold accent on active/hover states
  - OM symbol with breathing animation
*/

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { IMAGES } from "@/config";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Events", href: "#events" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-charcoal/95 backdrop-blur-md shadow-lg shadow-black/20 border-b border-gold/10"
          : "bg-transparent"
      }`}
    >
      <div className="container flex items-center justify-between h-16 md:h-20">
        {/* Logo */}
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); handleNavClick("#home"); }}
          className="flex items-center gap-3 group"
        >
          <img
            src={IMAGES.LOGO}
            alt="Kashphool Logo"
            className="w-10 h-10 md:w-12 md:h-12 transition-transform duration-300 group-hover:scale-105 object-contain"
            style={{ background: 'transparent' }}
          />
          <span className="font-[var(--font-display)] text-xl md:text-2xl font-bold text-gold-gradient">
            Kashphool
          </span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
              className="relative text-ivory/70 hover:text-saffron transition-colors duration-300 text-sm font-medium tracking-wide uppercase after:content-[''] after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-saffron after:transition-all after:duration-300 hover:after:w-full"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://pay.lopay.com/request/906de5de-220b-4f34-bc56-776c0993ec32"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 bg-gradient-to-r from-saffron to-gold text-charcoal font-semibold text-sm rounded tracking-wide uppercase hover:shadow-lg hover:shadow-saffron/20 transition-all duration-300 hover:scale-105"
          >
            Donate
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-ivory/80 hover:text-saffron transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-charcoal/98 backdrop-blur-md border-t border-gold/10 px-6 py-6 space-y-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => { e.preventDefault(); handleNavClick(link.href); }}
              className="block text-ivory/70 hover:text-saffron transition-colors duration-300 text-base font-medium tracking-wide"
            >
              {link.label}
            </a>
          ))}
          <a
            href="https://pay.lopay.com/request/906de5de-220b-4f34-bc56-776c0993ec32"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center px-5 py-3 bg-gradient-to-r from-saffron to-gold text-charcoal font-semibold text-sm rounded tracking-wide uppercase mt-4"
          >
            Donate
          </a>
        </div>
      </div>
    </nav>
  );
}
