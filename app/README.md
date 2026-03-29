# GREY-EARTH App

This directory contains the deployed Next.js application for GREY-EARTH.

For the full project overview, architecture, setup, Earth Engine configuration, deployment notes, and roadmap, see the repo root README:

- [`../README.md`](../README.md)

Canonical Vercel project:

- `researchdirector/grey-earth`

Important deployment note:

- this app is deployed from the repository root because the Vercel project Root Directory is `app`
- do not use the legacy `researchdirector/app` Vercel project for new production deploys

## Local Commands

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Local Environment

Create `app/.env.local` with:

```env
NEXT_PUBLIC_EE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
NEXT_PUBLIC_EE_PROJECT=gen-lang-client-0431154803
```

## Primary App Entry Points

- `src/app/page.tsx`
- `src/app/layout.tsx`
- `src/app-shell/AppShellProvider.tsx`

## Important Subsystems

- `src/app-shell/providers/*`
- `src/domain/rendering.ts`
- `src/components/TerrainMap.tsx`
- `src/components/Terrain3D.tsx`
- `src/lib/elevation.ts`
- `src/lib/earth-engine/browser.ts`
