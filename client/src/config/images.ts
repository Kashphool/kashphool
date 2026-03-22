/**
 * Centralized image asset paths
 * All image URLs used across the application
 */

export const IMAGES = {
  // Hero Section
  HERO_BG_VIDEO: "/images/hero-bg.mp4",
  HERO_BG_FALLBACK: "/images/hero-bg.jpeg",
  
  // Patterns & Decorations
  MANDALA: "/images/mandala-pattern.webp",
  ALPONA: "https://d2xsxph8kpxj0f.cloudfront.net/310519663392152998/RGaxbZP4MmYNRADFjnNWxk/alpona-pattern-YEn9zVMGcPwxUQxhYY9iVg.webp",
  
  // Logos
  LOGO: "/images/logo.png",
  ABOUT_LOGO: "/images/about-logo.jpeg",
  
  // Events
  SARASWATI: "/images/saraswati.png",
  DURGA: "/images/durga.png",
  
  // Gallery - Base URL pattern
  GALLERY_BASE: "https://kashphool.pradatta.dev/gallery",
} as const;

/**
 * Helper function to get gallery image URL
 * @param year - Year of the image
 * @param index - Image index
 */
export const getGalleryImageUrl = (year: number, index: number): string => {
  return `${IMAGES.GALLERY_BASE}/${year}_${index}.jpg`;
};
