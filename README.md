# GREY-EARTH

GREY-EARTH is a tactical terrain analysis application for low-relief SIGINT-TERRAIN style operating environments. It combines a doctrine-driven HUD, terrain interrogation workflows, a manifest-first render model, a 2D MapLibre surface, a 3D terrain mode, and browser-authenticated Google Earth Engine imagery.

The project is not a generic GIS viewer. It is meant to become a terrain-first operational surface for rapid analysis, briefing, and future overlay workflows such as contours, slope, denied areas, and line-of-sight.

## Current Status

The application is live, builds cleanly, and has already been deployed to Vercel.

Current shipped capabilities:

- 2D map with DEM-backed terrain/hillshade treatment
- doctrinal HUD split into focused panels
- live UTC clock
- point elevation query from Terrarium DEM tiles
- transect creation and terrain profile rendering
- toggleable 3D terrain view
- render-state manifest compilation with supported/suppressed layer logic
- browser-based Earth Engine sign-in path for real imagery
- production deployment on Vercel

Current missing or partial capabilities:

- contour rendering
- slope raster overlay
- hypsometric tinting
- LOS overlay
- live intel feed integration
- bathymetry merge and richer provenance handling

## Live Deployment

- Production alias: [grey-earth.vercel.app](https://grey-earth.vercel.app)
- GitHub: [augustave/GREY-EARTH](https://github.com/augustave/GREY-EARTH)

Canonical Vercel project:

- `researchdirector/grey-earth`

Legacy Vercel project retained only as fallback/staging reference:

- `researchdirector/app`

## Tech Stack

- Next.js 16
- React 19
- MapLibre GL 5
- Three.js
- Tailwind 4
- Vitest
- Google Earth Engine browser API

## Product Goals

The near-term goal is to deliver a credible tactical terrain workstation for the NYC littoral operating area that:

- renders honest terrain relief
- supports rapid elevation interrogation
- supports transect/profile analysis
- can switch between 2D and 3D terrain views
- uses a deterministic, doctrine-aligned render stack
- supports real imagery through Earth Engine authentication

The longer-term goal is to support:

- contours
- slope analysis
- hypsometric overlays
- line-of-sight and Fresnel workflows
- explicit denied-zone ingest
- exportable render manifests and verification artifacts

## Repository Layout

```text
GREY-EARTH/
├── README.md
├── PRD.md
├── docs/
│   └── PRD_EOD_2026-03-28.md
├── sigint_terrain_bundle/
├── SIGINT_TERRAIN_TEXTURES_ELEVATIONS.yaml
├── texture_elevation_specimen.html
└── app/
    ├── package.json
    ├── .env.example
    ├── README.md
    └── src/
        ├── app/
        ├── app-shell/
        ├── components/
        ├── domain/
        ├── hooks/
        ├── lib/
        └── types/
```

## Architecture Overview

The app is built around focused state/runtime providers rather than a monolithic map context.

### App Shell Providers

- `ViewportStateProvider`
- `EarthEngineProvider`
- `AnalysisStateProvider`
- `RenderStateProvider`
- `MapRuntimeProvider`

### State Domains

`ViewportState`

- center
- zoom
- pitch
- bearing
- breakpoint
- device class
- view mode

`RenderState`

- requested layers
- active/suppressed layers
- terrain profile
- warnings
- render state manifest

`AnalysisState`

- active tool
- transect points
- profile data
- selected query point
- analysis status

`MapRuntime`

- MapLibre instance
- load state

`EarthEngine`

- auth status
- project ID
- tile URL template
- imagery active state

### Rendering Direction

The render model is manifest-first. Unsupported layers are explicitly suppressed rather than silently ignored. This keeps the UI honest and keeps the code aligned with the local `sigint_terrain_bundle` direction.

## Feature Summary

### 2D Terrain Map

Implemented:

- MapLibre lifecycle and viewport syncing
- terrain base style
- hillshade overlay
- denied-zone overlay
- Earth Engine imagery insertion when authenticated

Not yet implemented:

- contours
- slope raster
- hypsometric tint
- LOS layer

### HUD

Implemented:

- `SystemHeader`
- `TimeStatusPanel`
- `TerrainControlsPanel`
- `CoordinatesPanel`
- `IntelFeedPanel`
- `ProfilePanel`
- desktop / tablet / mobile HUD wrappers
- Earth Engine HUD panel
- Earth Engine center-screen activation overlay

### Terrain Analysis

Implemented:

- click-to-query elevation
- slope label estimation
- transect capture
- sampled terrain profile rendering
- map markers and line bindings for transects

### 3D Terrain

Implemented:

- toggled 3D mode
- DEM-driven terrain mesh
- operator-adjustable z-exaggeration

Still partial:

- higher-fidelity terrain material
- richer briefing controls
- tighter overlay parity with 2D mode

### Earth Engine

Implemented:

- browser Earth Engine API loading
- OAuth sign-in flow
- Earth Engine project configuration
- Sentinel-2 true-color composite for the current AO
- MapLibre raster source/layer insertion

Operational dependency:

- OAuth client configuration and allowed origins must be correct

## Local Development

### Prerequisites

- Node.js 20+ recommended
- npm
- a Google account with Earth Engine access if you want real imagery

### Install

```bash
cd app
npm install
```

### Run

```bash
cd app
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy or create `app/.env.local` with:

```env
NEXT_PUBLIC_EE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
NEXT_PUBLIC_EE_PROJECT=gen-lang-client-0431154803
```

`.env.example` exists in `app/` as the public template.

## Google Earth Engine Setup

Earth Engine browser authentication requires a Web OAuth client, not just an Earth Engine project ID.

In Google Cloud for project `gen-lang-client-0431154803`:

1. Go to `APIs & Services` → `Credentials`
2. Create an `OAuth client ID`
3. Choose `Web application`
4. Add authorized JavaScript origins for:
   - `http://localhost:3000`
   - `https://grey-earth.vercel.app`
   - your current production deployment URL if needed

If the site says auth is available but the popup does not open or fails, the most likely causes are:

- popup blocker
- missing authorized origin
- Earth Engine not enabled for the current Google account

## NPM Scripts

From `app/`:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm test
```

## Quality Gates

The project currently uses:

- `npm test`
- `npm run lint`
- `npm run build`

These have been used as the standard verification loop for recent work.

## Deployment

The canonical deployment target is the Vercel project `researchdirector/grey-earth`, configured with:

- Root Directory: `app`
- Framework Preset: `Next.js`
- Production access: public
- Preview access: protected

The older `researchdirector/app` project should no longer be used for new production deploys.

Typical deployment flow:

1. push to `main`
2. ensure public Earth Engine env vars are set in `researchdirector/grey-earth`
3. deploy from the repo root so Vercel applies the project Root Directory `app/`

Current Vercel production alias:

- [grey-earth.vercel.app](https://grey-earth.vercel.app)

## Important Source Files

### Product Shell

- `app/src/app/layout.tsx`
- `app/src/app/page.tsx`
- `app/src/app-shell/AppShellProvider.tsx`

### State / Domain

- `app/src/app-shell/providers/ViewportStateProvider.tsx`
- `app/src/app-shell/providers/RenderStateProvider.tsx`
- `app/src/app-shell/providers/AnalysisStateProvider.tsx`
- `app/src/app-shell/providers/MapRuntimeProvider.tsx`
- `app/src/app-shell/providers/EarthEngineProvider.tsx`
- `app/src/domain/rendering.ts`

### Map / Analysis

- `app/src/components/TerrainMap.tsx`
- `app/src/components/Terrain3D.tsx`
- `app/src/components/map/useMapLifecycle.ts`
- `app/src/components/map/useMapLayerBindings.ts`
- `app/src/components/map/useMapInteractions.ts`
- `app/src/components/map/useMapAnalysisBindings.ts`
- `app/src/components/map/useEarthEngineImageryLayer.ts`
- `app/src/lib/elevation.ts`
- `app/src/lib/map/createBaseStyle.ts`

### Earth Engine

- `app/src/components/earth-engine/EarthEnginePanel.tsx`
- `app/src/components/earth-engine/EarthEnginePromptOverlay.tsx`
- `app/src/lib/earth-engine/browser.ts`
- `app/src/types/earthengine.d.ts`

### HUD / Presentation

- `app/src/components/HUDOverlay.tsx`
- `app/src/components/hud/*`
- `app/src/components/profile/*`
- `app/src/app/globals.css`

## Documentation

- Original product spec: `PRD.md`
- End-of-day reconciled PRD: `docs/PRD_EOD_2026-03-28.md`
- Terrain design source material:
  - `SIGINT_TERRAIN_TEXTURES_ELEVATIONS.yaml`
  - `sigint_terrain_bundle/`
  - `texture_elevation_specimen.html`

## Known Gaps

- contour layer is not implemented
- slope overlay is not implemented
- hypsometric layer is not implemented
- LOS is not implemented
- Earth Engine success still depends on live-user auth validation
- 3D mode is functional but not final-grade
- intel feed is still hardcoded

## Recommended Next Work

1. Validate Earth Engine authentication end-to-end on the production site
2. Implement contours from DEM tiles
3. Implement slope raster pipeline
4. Implement hypsometric tint pipeline
5. Implement LOS overlay using existing analysis state seams
6. Add render manifest export and verification output
7. Improve 3D terrain material fidelity and overlay parity

## Notes

This repo started from a generic Next.js scaffold but it is no longer a scaffold. The current architecture, deployment history, and terrain-analysis workflows are specific to GREY-EARTH and should be treated as the project source of truth, together with the EOD PRD.
