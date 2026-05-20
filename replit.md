# LuminaSizer — replit.md

## Overview

LuminaSizer is a professional solar PV system sizing and design calculator targeted at Algeria and the broader North Africa region. It supports four system types:

- **On-Grid** — grid-tied solar systems
- **Off-Grid** — standalone battery-backed systems
- **Hybrid** — combined grid + battery systems
- **Pumping** — solar water pumping systems

Key features include:
- Multi-step project wizard for system configuration (Location → System Type → Parameters → Results)
- Interactive map-based location picker with solar irradiance heatmap (PSH from NASA POWER)
- Solar panel spacing / shading analysis tool (always visible in step 4, not collapsible)
- Cost estimation and ROI calculator (Algerian market prices in DZD)
- PDF report generation — **English-only** (no language picker; single download button)
- Project persistence (save, load, edit, delete)
- Bilingual UI — **Arabic (AR) and English (EN) only** — French completely removed
- PWA support with offline capability (production service worker)

### i18n Policy
- All UI strings use `T[lang]` from `client/src/lib/i18n.tsx`
- `lang` can only be `"ar"` or `"en"` — French (`"fr"`) is removed throughout
- PDFs are always generated in English regardless of current UI language
- The `generateProjectPdf` and `generateLocationPdf` functions always use English strings

The app is a full-stack TypeScript monorepo: React SPA frontend served by an Express backend, with PostgreSQL as the database via Drizzle ORM.

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Frontend

- **Framework**: React 18 (Vite, TSX)
- **Routing**: Wouter (lightweight, no React Router dependency)
- **State / Data Fetching**: TanStack React Query v5 — all server data goes through query/mutation hooks in `client/src/hooks/use-projects.ts`
- **Forms**: React Hook Form + Zod resolvers — forms are validated client-side using shared Zod schemas
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS) with the "new-york" style
- **Styling**: Tailwind CSS v3, CSS variables for theming, eco-green primary + solar-yellow accent color palette
- **Charts**: Recharts (area charts for monthly production / financial ROI)
- **Maps**: Leaflet + react-leaflet (location picker with interpolated solar irradiance heatmap)
- **PDF Export**: jsPDF + jspdf-autotable (client-side report generation)
- **Internationalisation**: Custom `LangProvider` context in `client/src/lib/i18n.tsx` supporting Arabic (RTL, default) and English; language persisted in `localStorage`
- **PWA**: Web App Manifest + service worker (`client/public/sw.js`). The SW is intentionally a no-op in dev/Replit environments and activates only in production

**Directory layout**:
```
client/src/
  components/      # Feature + UI components
    layout/        # Navbar
    ui/            # shadcn/ui primitives
  hooks/           # React Query hooks (use-projects, use-toast, use-mobile)
  lib/             # queryClient, i18n, sizing-engine, generatePdf, utils
  pages/           # Dashboard, ProjectWizard, PanelSpacingPage, not-found
```

### Backend

- **Runtime**: Node.js with Express (ESM, TypeScript via tsx in dev)
- **Entry point**: `server/index.ts` → `registerRoutes` → `storage` layer
- **API**: RESTful JSON API under `/api/projects` (CRUD: list, get, create, update, delete)
- **Validation**: Zod schemas shared from `shared/schema.ts` and `shared/routes.ts`; errors return structured `{ message, field? }` JSON
- **Static serving**: In production, `server/static.ts` serves the Vite build from `dist/public`. In dev, `server/vite.ts` runs Vite in middleware mode with HMR over WebSocket

**Build**: `script/build.ts` runs Vite for the client then esbuild to bundle the server (selected deps are bundled to reduce cold-start syscalls; everything else is external).

### Shared Layer

`shared/` is imported by both client and server (path alias `@shared/*`):

- **`shared/schema.ts`** — Drizzle table definitions + Zod insert schemas + TypeScript types
- **`shared/routes.ts`** — Typed API contract object (`api.projects.*`) with paths, methods, input schemas, and response schemas. Hooks use this directly so paths/validation never drift.

### Data Storage

- **Database**: PostgreSQL (required; `DATABASE_URL` env var)
- **ORM**: Drizzle ORM (`drizzle-orm/node-postgres`) — schema-first, migrations in `./migrations/`
- **Schema** (`projects` table):

| Column      | Type        | Notes                          |
|-------------|-------------|--------------------------------|
| id          | serial PK   |                                |
| name        | text        | Project name                   |
| systemType  | text        | on-grid / off-grid / hybrid / pumping |
| inputs      | jsonb       | Raw form inputs (flexible)     |
| results     | jsonb       | Computed sizing results        |
| createdAt   | timestamp   | Auto-set                       |

- **Storage abstraction**: `IStorage` interface in `server/storage.ts` — currently `DatabaseStorage` backed by Drizzle. Swap-friendly if needed.
- **Seed**: `server/seed.ts` inserts two demo projects if the table is empty

### Sizing Engine

`client/src/lib/sizing-engine.ts` is a pure client-side calculation module (no server round-trip for calculations):
- Contains Zod input schemas for all four system types
- Houses Algerian and International market component databases (panels, inverters, MPPT regulators, batteries)
- `calculateSystem(type, inputs)` returns sizing results used immediately in the UI and then persisted via API

### Authentication

No authentication system is implemented. The app is currently open/public — all projects are shared. The `connect-pg-simple` package is present (session store) but sessions/auth are not wired up.

---

## External Dependencies

| Dependency | Purpose |
|---|---|
| **PostgreSQL** | Primary database; must be provisioned and `DATABASE_URL` set |
| **Google Fonts** | Inter + Plus Jakarta Sans fonts (loaded via CDN in HTML/CSS) |
| **Leaflet / OpenStreetMap tiles** | Interactive map in LocationPicker; tiles fetched from `tile.openstreetmap.org` at runtime |
| **jsPDF + jspdf-autotable** | Client-side PDF report generation |
| **Recharts** | Charts for monthly energy data and financial analysis |
| **Radix UI** (many packages) | Headless UI primitives for shadcn/ui components |
| **TanStack React Query v5** | Server state, caching, mutations |
| **React Hook Form + Zod** | Form management and validation |
| **Wouter** | Client-side routing |
| **Drizzle ORM + drizzle-kit** | Database ORM and migration tooling |
| **Vite** | Frontend build tool + dev server |
| **tsx** | TypeScript execution for server in dev |
| **esbuild** | Server bundling for production |
| **@replit/vite-plugin-*** | Runtime error overlay, cartographer, dev banner (dev-only, Replit environment) |

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | No | `development` / `production` |
| `REPL_ID` | No | Set automatically by Replit; enables Replit-specific Vite plugins |