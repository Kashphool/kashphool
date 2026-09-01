/*
  DESIGN: Sacred Geometry Modernism
  - Minimal footer with gold accents
  - OM symbol and cultural identity
  - Social links and navigation
*/

import { IMAGES } from "@/config";
import { siteContent } from "@/content";
import { Mail, Instagram, Facebook, Youtube } from "lucide-react";

const footerContent = siteContent.footer;
const navLabels = footerContent.navigation;
const navLinks = [
  { label: navLabels.home.label, href: "/" },
  { label: navLabels.about.label, href: "/#about" },
  { label: navLabels.events.label, href: "/#events" },
  { label: navLabels.gallery.label, href: "/#gallery" },
  { label: navLabels.sponsors.label, href: "/sponsors" },
  { label: navLabels.constitution.label, href: "/constitution" },
  { label: navLabels.contact.label, href: "/#contact" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-gold/10">
      {/* Top gold line */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

      <div className="container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={IMAGES.LOGO} alt="Kashphool" className="w-10 h-10" />
              <span className="font-[var(--font-display)] text-xl font-bold text-gold-gradient">
                Kashphool
              </span>
            </div>
            <p className="text-ivory/50 text-sm leading-relaxed max-w-xs">
              {footerContent.description}
            </p>
            <div className="mt-4">
              <span className="text-3xl text-saffron/40 font-[var(--font-bengali)]">
                ❀
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-[var(--font-display)] text-lg font-semibold text-ivory/90 mb-4">
              {footerContent.quickLinksHeading}
            </h4>
            <div className="h-[1px] w-12 bg-gold/30 mb-4" />
            <nav className="space-y-2.5">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
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
              {footerContent.connectHeading}
            </h4>
            <div className="h-[1px] w-12 bg-gold/30 mb-4" />
            <div className="space-y-4 text-ivory/50 text-sm">
              <p>{footerContent.location}</p>
              <p>{footerContent.established}</p>

              {/* Email */}
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-saffron/80" />
                <a
                  href={`mailto:${footerContent.email}`}
                  className="hover:text-saffron transition-colors break-all"
                >
                  {footerContent.email}
                </a>
              </div>

              <a
                href={siteContent.links.donate}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-3 text-saffron hover:text-gold transition-colors duration-300"
              >
                {footerContent.supportLabel}
              </a>
            </div>
          </div>

          {/* Follow Us */}
          <div>
            <h4 className="font-[var(--font-display)] text-lg font-semibold text-ivory/90 mb-4">
              {footerContent.followHeading}
            </h4>
            <div className="h-[1px] w-12 bg-gold/30 mb-4" />
            <div className="flex gap-3">
              <a
                href={siteContent.links.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory/50 hover:text-saffron transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href={siteContent.links.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory/50 hover:text-saffron transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href={siteContent.links.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ivory/50 hover:text-saffron transition-colors"
                aria-label="YouTube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-gold/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ivory/30 text-xs tracking-wide">
            © {new Date().getFullYear()} Kashphool.{" "}
            {footerContent.copyrightSuffix}
          </p>
          <p className="text-ivory/20 text-xs tracking-wide">
            {footerContent.closingLine}
          </p>
        </div>
      </div>
    </footer>
  );
}
