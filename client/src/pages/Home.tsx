/*
  DESIGN: Sacred Geometry Modernism
  Home page — assembles all sections with decorative dividers
*/

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";
import EventsSection from "@/components/sections/EventsSection";
import GallerySection from "@/components/sections/GallerySection";
import SponsorsSection from "@/components/sections/SponsorsSection";
import ContactSection from "@/components/sections/ContactSection";
import SectionDivider from "@/components/shared/SectionDivider";

export default function Home() {
  return (
    <div className="min-h-screen bg-charcoal text-ivory">
      <Navbar />
      <HeroSection />
      <SectionDivider withAccent />
      <AboutSection />
      <SectionDivider />
      <EventsSection />
      <SectionDivider withAccent />
      <GallerySection />
      <SectionDivider />
      <SponsorsSection />
      <SectionDivider withAccent />
      <ContactSection />
      <Footer />
    </div>
  );
}
