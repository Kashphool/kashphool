# Kashphool

## Overview
An Indian Bengali Association based in North Kent, dedicated to preserving and celebrating our rich cultural heritage through festivals, events, and community programs.

**Live Site:** [kashphool.pradatta.dev](https://kashphool.pradatta.dev)

---

## 📁 Directory Structure

```
client/
├── public/
│   ├── data/                # Dynamic data files
│   │   └── events.json     # Event data (dates, venues, registration)
│   ├── gallery/             # Gallery photo assets
│   ├── images/              # Static image assets
│   ├── sponsors/            # Sponsor logo assets
│   └── CNAME               # Custom domain configuration
├── src/
│   ├── components/
│   │   ├── layout/         # Layout components (Navbar, Footer)
│   │   ├── sections/       # Page sections (Hero, About, Events, Gallery, Sponsors, Contact)
│   │   ├── shared/         # Shared/reusable components
│   │   └── ui/             # UI primitives (shadcn/ui components)
│   ├── config/             # Centralized configuration
│   ├── types/              # TypeScript type definitions
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   └── lib/                # Utility functions
```

---

## 🚀 Running Locally

### Prerequisites
- Node.js 18+ installed
- pnpm package manager (`npm install -g pnpm`)

### Setup Steps
1. **Clone the repository**
   ```bash
   git clone https://github.com/PradattaA/kashphool.git
   cd kashphool
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`
   - The site will hot-reload on file changes

### Build for Production
```bash
pnpm build
```
Output will be in `dist/` folder.

---

## 🤝 Contributing

### Workflow

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make your changes**
   - Edit files as needed
   - Test locally with `pnpm dev`
   - Follow existing code style

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Go to GitHub repository
   - Click "New Pull Request"
   - Select your branch
   - Add description of changes
   - Request review from maintainers

6. **After PR is approved**
   - Maintainer will merge to `main` branch
   - **Auto-deployment will trigger automatically**

### Branch Naming Convention
- `feature/` - New features (e.g., `feature/add-sponsors-section`)
- `fix/` - Bug fixes (e.g., `fix/gallery-navigation`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/event-types`)

---

## 🚢 Deployment

### Automatic Deployment
- **Trigger**: Merge to `main` branch
- **Platform**: GitHub Pages
- **Domain**: kashphool.pradatta.dev
- **Build**: Vite production build
- **Deploy Branch**: `gh-pages`

### Deployment Process
1. Code is merged to `main` branch
2. GitHub Actions workflow automatically triggers
3. Project is built using `pnpm build`
4. Built files are deployed to `gh-pages` branch
5. GitHub Pages serves the site from `gh-pages`
6. Changes are live at kashphool.pradatta.dev

**Note:** Always test changes locally before creating a PR to avoid deployment issues.

---

## 📊 Dynamic Data Management

### Adding New Events
1. Edit `client/public/data/events.json`
2. Add event object with required fields:
   ```json
   {
     "id": "event-id",
     "name": "Event Name",
     "description": "Event description",
     "date": {
       "type": "single" | "range",
       "start": "YYYY-MM-DD",
       "end": "YYYY-MM-DD"
     },
     "venue": {
       "name": "Venue Name",
       "address": "Address",
       "coordinates": { "lat": 0, "lng": 0 },
       "googleMapsUrl": "https://maps.app.goo.gl/..."
     },
     "image": "/images/image.png",
     "registrationUrl": "https://..."
   }
   ```

### Adding Gallery Photos
1. Add photos to `client/public/gallery/`
2. Update `GallerySection.tsx` to include new photo paths
3. Photos support lightbox and keyboard navigation (Arrow keys, Escape)

### Adding Sponsors
1. Add sponsor logo to `client/public/sponsors/`
2. Edit `client/public/data/sponsors.json`
3. Add sponsor object with required fields:
   ```json
   {
     "id": "sponsor-id",
     "name": "Sponsor Name",
     "logo": "/sponsors/logo.jpg",
     "website": "https://sponsor-website.com"
   }
   ```
   Note: `website` field is optional. If provided, the sponsor logo becomes clickable.

---

## 🎨 Design System

### Color Palette
- **Charcoal** - Primary background (`oklch(0.15 0 0)`)
- **Ivory** - Primary text (`oklch(0.95 0 0)`)
- **Saffron** - Accent color (`oklch(0.72 0.15 70)`)
- **Gold** - Secondary accent (`oklch(0.75 0.12 85)`)

### Key Features
- Gradient text effects (`.text-gold-gradient`)
- Sacred geometry patterns (mandala, alpona)
- Smooth scroll animations
- Responsive grid layouts
- Hover effects with gold accents

---

## 📦 Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Email**: EmailJS
- **Deployment**: GitHub Pages

---

**Last Updated:** March 24, 2026  
**Maintained By:** Kashphool Development Team
