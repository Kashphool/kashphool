# Kashphool Website - Project Structure

## Overview
This document describes the organized structure of the Kashphool website codebase for better maintainability and scalability.

---

## 📁 Directory Structure

```
client/src/
├── components/
│   ├── layout/              # Layout components (Navbar, Footer)
│   ├── sections/            # Page sections (Hero, About, Events, etc.)
│   ├── shared/              # Shared/reusable components
│   └── ui/                  # UI primitives (shadcn/ui components)
├── config/                  # Centralized configuration
│   ├── images.ts           # Image asset paths
│   ├── emailjs.ts          # EmailJS configuration
│   ├── links.ts            # External links
│   └── index.ts            # Config exports
├── types/                   # TypeScript type definitions
│   ├── events.ts           # Event-related types
│   └── index.ts            # Type exports
├── hooks/                   # Custom React hooks
├── pages/                   # Page components
├── contexts/                # React contexts
└── lib/                     # Utility functions
```

---

## 🗂️ Component Organization

### Layout Components (`components/layout/`)
Components that define the overall page structure:
- **Navbar.tsx** - Navigation bar with scroll effects
- **Footer.tsx** - Site footer with links and branding

### Section Components (`components/sections/`)
Main content sections of the website:
- **HeroSection.tsx** - Landing hero with video background
- **AboutSection.tsx** - Organization information
- **EventsSection.tsx** - Event listings (Durga Puja, Saraswati Puja)
- **GallerySection.tsx** - Photo gallery
- **ContactSection.tsx** - Contact form with EmailJS integration

### Shared Components (`components/shared/`)
Reusable components used across sections:
- **SectionDivider.tsx** - Decorative section separators
- **ErrorBoundary.tsx** - Error handling wrapper
- **Map.tsx** - Interactive map component
- **ManusDialog.tsx** - Dialog/modal component

---

## ⚙️ Configuration Files

### `config/images.ts`
Centralized image asset paths. All image URLs are defined here.

**Usage:**
```typescript
import { IMAGES } from "@/config";

// Access images
<img src={IMAGES.LOGO} alt="Logo" />
<img src={IMAGES.HERO_BG_FALLBACK} alt="Hero" />
```

**Available constants:**
- `IMAGES.HERO_BG_VIDEO` - Hero section video
- `IMAGES.HERO_BG_FALLBACK` - Hero fallback image
- `IMAGES.MANDALA` - Mandala pattern
- `IMAGES.ALPONA` - Alpona pattern
- `IMAGES.LOGO` - Main logo
- `IMAGES.ABOUT_LOGO` - About section logo
- `IMAGES.SARASWATI` - Saraswati event image
- `IMAGES.DURGA` - Durga event image
- `IMAGES.GALLERY_BASE` - Gallery base URL

**Helper function:**
```typescript
getGalleryImageUrl(year: number, index: number): string
```

### `config/emailjs.ts`
EmailJS service configuration for contact form.

**Usage:**
```typescript
import { EMAILJS_CONFIG, EMAIL_MESSAGE_TIMEOUT } from "@/config";

emailjs.sendForm(
  EMAILJS_CONFIG.SERVICE_ID,
  EMAILJS_CONFIG.TEMPLATE_ID,
  formRef.current,
  { publicKey: EMAILJS_CONFIG.PUBLIC_KEY }
);
```

**Constants:**
- `EMAILJS_CONFIG.SERVICE_ID` - EmailJS service ID
- `EMAILJS_CONFIG.TEMPLATE_ID` - Email template ID
- `EMAILJS_CONFIG.PUBLIC_KEY` - Public API key
- `EMAIL_MESSAGE_TIMEOUT` - Message display duration (3000ms)

### `config/links.ts`
External links and URLs.

**Usage:**
```typescript
import { EXTERNAL_LINKS } from "@/config";

<a href={EXTERNAL_LINKS.DONATE}>Donate</a>
```

**Available links:**
- `EXTERNAL_LINKS.DONATE` - Donation payment link

---

## 📝 Type Definitions

### `types/events.ts`
Event-related TypeScript interfaces.

**Usage:**
```typescript
import type { EventData } from "@/types";

const event: EventData = {
  title: "Durga Puja",
  description: "...",
  date: "October 10, 2026",
  dateLabel: "OCT 10",
  time: "9:00 AM - 10:00 PM",
  location: "Elite Venue, Dartford",
  duration: "13 hours",
  image: IMAGES.DURGA,
};
```

---

## 🎯 Import Patterns

### Centralized Config Imports
```typescript
// Import all config at once
import { IMAGES, EMAILJS_CONFIG, EXTERNAL_LINKS } from "@/config";

// Or import specific modules
import { IMAGES } from "@/config/images";
import { EMAILJS_CONFIG } from "@/config/emailjs";
```

### Component Imports
```typescript
// Layout components
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// Section components
import HeroSection from "@/components/sections/HeroSection";
import AboutSection from "@/components/sections/AboutSection";

// Shared components
import SectionDivider from "@/components/shared/SectionDivider";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
```

### Type Imports
```typescript
import type { EventData } from "@/types";
```

---

## 🔧 Maintenance Guidelines

### Adding New Images
1. Add the image to `client/public/images/`
2. Add the path constant to `config/images.ts`
3. Use the constant in components via `IMAGES.YOUR_IMAGE`

### Adding New External Links
1. Add the link to `config/links.ts`
2. Use via `EXTERNAL_LINKS.YOUR_LINK`

### Adding New Types
1. Create type definition in `types/` directory
2. Export from `types/index.ts`
3. Import using `import type { YourType } from "@/types"`

### Creating New Components

**Layout Component:**
- Place in `components/layout/`
- Use for structural/navigation elements

**Section Component:**
- Place in `components/sections/`
- Use for main content sections

**Shared Component:**
- Place in `components/shared/`
- Use for reusable UI elements

---

## 🚀 Benefits of This Structure

1. **Centralized Configuration**
   - All URLs, API keys, and external links in one place
   - Easy to update without searching through files
   - Type-safe constants prevent typos

2. **Clear Component Organization**
   - Easy to locate specific components
   - Logical grouping by purpose
   - Scalable as project grows

3. **Type Safety**
   - Shared TypeScript interfaces
   - Consistent data structures
   - Better IDE autocomplete

4. **Maintainability**
   - Clear separation of concerns
   - Easy onboarding for new developers
   - Reduced code duplication

5. **Scalability**
   - Easy to add new sections/features
   - Modular architecture
   - Clean import paths

---

## 📦 Dependencies

### Core Dependencies
- React 18+
- TypeScript
- Vite
- Tailwind CSS

### Email Integration
- `@emailjs/browser` - Contact form email service

### UI Components
- shadcn/ui components in `components/ui/`
- Lucide React icons
- Framer Motion for animations

---

## 🔍 Quick Reference

### File Locations
- **Images**: `client/public/images/`
- **Components**: `client/src/components/`
- **Config**: `client/src/config/`
- **Types**: `client/src/types/`
- **Pages**: `client/src/pages/`
- **Hooks**: `client/src/hooks/`

### Import Aliases
- `@/` - Points to `client/src/`
- `@shared/` - Points to `shared/`

---

**Last Updated:** March 22, 2026  
**Maintained By:** Kashphool Development Team
