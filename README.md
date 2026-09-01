# Kashphool

## Overview

An Indian Bengali Association based in North Kent, dedicated to preserving and celebrating our rich cultural heritage through festivals, events, and community programs.

**Live Site:** [kashphool.co.uk](https://kashphool.co.uk)

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

- Node.js 20 installed
- pnpm package manager (`npm install -g pnpm`)

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/Kashphool/kashphool.git
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
   - Website: `http://localhost:3000/`
   - Content manager: `http://localhost:3000/admin/`
   - The site will hot-reload on file changes

### Build for Production

```bash
pnpm build
```

The build first runs the deterministic CMS content validator. You can run its
date, ID, media-type, size and asset-path checks directly with
`pnpm check:content`.

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

- **Trigger**: Push to `main` (including merged pull requests and direct CMS commits)
- **Platform**: GitHub Pages
- **Domain**: kashphool.co.uk
- **Build**: Vite production build
- **Deployment source**: GitHub Pages artifact (`dist/public`)

### Deployment Process

1. Code is pushed to `main`, either through a merged pull request or a direct CMS commit
2. GitHub Actions workflow automatically triggers
3. Project is built using `pnpm build`
4. The built `dist/public` directory is uploaded as a GitHub Pages artifact
5. GitHub Pages publishes that artifact
6. Changes are live at kashphool.co.uk

**Note:** Always test changes locally before creating a PR to avoid deployment issues.

---

## 📊 Content Management

Authenticated editors manage website copy, events, stall hours, sponsors,
gallery images and bounded media slots through Decap CMS at `/admin/`.

- Local filesystem CMS: `http://localhost:3000/admin/` (no GitHub login;
  saves update the working tree)
- Authentication and account setup: [Decap CMS authentication setup](docs/decap-cms-setup.md)
- Source content: `client/public/data/*.json`
- Uploaded CMS media: `assets/uploads/`

Developers may still edit the JSON files directly. The external OAuth login was
observed during setup, but the deployed public `/admin/` Save-to-`main` flow
remains pending as recorded in the setup guide.

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

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Email**: EmailJS
- **Deployment**: GitHub Pages

---

**Last Updated:** August 31, 2026
**Maintained By:** Kashphool Development Team
