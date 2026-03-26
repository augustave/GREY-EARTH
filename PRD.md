# GREY-EARTH — Product Requirements Document
## SIGINT-TERRAIN v1.1 Feature Sprint

**Author:** ANP Studio
**Date:** 2026-03-24
**Status:** Draft
**Codebase:** Next.js 16 + MapLibre GL 5.x + Three.js + Tailwind 4

---

## 0. Current State

The MVP renders a full-screen dark basemap (CARTO dark + Mapzen hillshade raster tiles) centered on the NYC datum (40°41'N, 73°57'W) with a HUD overlay containing: system identifier, terrain layer toggles (state only — no map effect), hardcoded intel feed panel, hardcoded elevation profile SVG, and a status bar. Three.js is installed but unused. All design system tokens (colors, textures, animations) are implemented in CSS.

### What exists

| Component | File | Status |
|---|---|---|
| Map (2D raster) | `TerrainMap.tsx` | Live tiles, pan/zoom, datum marker |
| HUD panels | `HUDOverlay.tsx` | Layer toggles (state only), intel feed (hardcoded), elevation profile (static SVG) |
| Design system | `globals.css` | Complete — all textures, tags, panels, animations |
| 3D terrain | — | Not started (`three` installed) |

### Architecture

```
page.tsx
├── TerrainMap.tsx      ← MapLibre GL instance, coordinates HUD
│   └── maplibre-gl     ← raster style: carto-dark + terrain-hillshade
├── HUDOverlay.tsx      ← 4 fixed panels (layers, intel, profile, status)
└── vignette div        ← radial-gradient overlay
```

---

## 1. Interactive Layer Toggles

### Problem
Layer buttons in the Terrain Layers panel toggle React state but have zero effect on the map. The map always shows the same two raster layers regardless of toggle state.

### Requirements

#### 1.1 Layer ↔ Map Binding
- The `TerrainMap` component must expose a way for `HUDOverlay` to control map layer visibility.
- Lift the MapLibre `map` instance into shared state (React context or a ref passed via props/callback).
- When a layer toggle fires in `HUDOverlay`, call `map.setLayoutProperty(layerId, 'visibility', 'visible' | 'none')` or add/remove sources dynamically.

#### 1.2 Layer Definitions

| Layer ID | Source | Type | Behavior |
|---|---|---|---|
| `hillshade` | Existing `terrain-hillshade` raster | raster | Toggle opacity 0 ↔ 0.45. Always-on by default. |
| `contours` | Vector tile source or GeoJSON generated client-side from Mapzen Terrarium tiles | line | Render contour isolines at 50m index / 10m intermediate intervals per YAML §8.2. Stroke: `rgba(255,255,255,0.35)` index, `rgba(255,255,255,0.12)` intermediate. Labels on index contours every 4th segment. |
| `slope` | Computed from Mapzen Terrarium RGB-encoded DEM tiles via custom WebGL shader or canvas processing | raster (custom) | 6-band slope severity palette from YAML §8.2 `slope_analysis`. Flat (green) → Cliff (red). Blended at 60% opacity over base. |
| `hypso` | Same DEM source, color-mapped to hypsometric palette | raster (custom) | 10-band tactical palette from YAML §8.2 `hypsometric_tinting`. Multiply blend, 40% opacity. |
| `denied` | Client-side GeoJSON polygons (placeholder geometry around harbor zones) | fill + pattern | Crosshatch SVG pattern fill (`denied-zone` CSS class equivalent as MapLibre fill-pattern). Color: `rgba(255,45,45,0.15)`. |
| `los` | Client-side computed from two click-points + DEM sampling | line + fill | Deferred to Feature 3 (elevation query). Show LOS line on map between two selected points. Green = clear, red dashed = masked. |

#### 1.3 Shared Map Context

Create a `MapContext` React context:

```typescript
// src/context/MapContext.tsx
interface MapContextValue {
  map: maplibregl.Map | null;
  isLoaded: boolean;
}
```

`TerrainMap` provides the context after `map.on('load', ...)`. `HUDOverlay` consumes it to drive layer visibility.

#### 1.4 DEM Tile Processing (for slope + hypso + contours)

Use Mapzen Terrarium RGB-encoded elevation tiles (`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`). Decode elevation: `height = (R * 256 + G + B / 256) - 32768`.

For slope and hypsometric layers, process tiles in a Web Worker or OffscreenCanvas:
1. Fetch Terrarium tile as ImageBitmap
2. Decode elevation grid
3. Compute slope (for slope layer) or map elevation to color (for hypso)
4. Return as ImageData → paint to canvas → use as custom raster source

For contours, use a marching-squares implementation on the decoded elevation grid to produce GeoJSON isolines, added as a vector source.

#### 1.5 Performance

- Process DEM tiles lazily on viewport change (debounce 200ms after `moveend`).
- Cache decoded elevation grids in a `Map<tileKey, Float32Array>`.
- Max 3 simultaneous texture layers (per YAML §7.3 compositing budget).
- Disable slope/hypso processing at zoom < 10 (too coarse to be useful).

#### 1.6 UI Behavior

- Active layer gets green dot + green text + subtle green background (already styled).
- Multiple layers can be active simultaneously (up to 3 operational limit).
- If user enables a 4th layer, show a toast: `"PERFORMANCE: Max 3 texture layers. Disable one to continue."` with amber styling.
- Layer order in panel = render order on map (top of list = bottom of stack).

### Acceptance Criteria
- [ ] Clicking HILLSHADE toggles the terrain hillshade raster visibility on the map.
- [ ] Clicking CONTOURS renders vector contour lines derived from DEM tiles.
- [ ] Clicking SLOPE ANALYSIS renders a color-coded slope severity overlay.
- [ ] Clicking HYPSOMETRIC renders elevation-banded color tinting.
- [ ] Clicking DENIED ZONES renders crosshatch-patterned polygons on the map.
- [ ] LINE OF SIGHT is disabled until Feature 3 is implemented (greyed out with tooltip).
- [ ] Max 3 simultaneous layers enforced with user feedback.

---

## 2. Live Clock

### Problem
The status bar timestamp is set once on render (`new Date().toISOString()`) and never updates. In an operational system, stale timestamps erode trust.

### Requirements

#### 2.1 Real-Time UTC Clock
- Create a `useClock` hook that returns the current UTC time string, updated every second.
- Format: `YYYY-MM-DD HH:MM:SSZ` (ISO 8601, Zulu time).
- Use `setInterval(1000)` with cleanup in the hook's return.

#### 2.2 Implementation

```typescript
// src/hooks/useClock.ts
export function useClock(intervalMs = 1000): string {
  const [time, setTime] = useState(() => formatUTC(new Date()));
  useEffect(() => {
    const id = setInterval(() => setTime(formatUTC(new Date())), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return time;
}
```

#### 2.3 Display
- Replace the hardcoded `new Date().toISOString()` in the bottom-center status bar with the hook output.
- The seconds digit should visibly tick — this is the "heartbeat" that tells operators the system is alive.
- Add a subtle 1-second CSS transition on the timestamp text to avoid harsh jumps (opacity micro-flash on change).

#### 2.4 Secondary: Elapsed Mission Time
- Below the UTC clock, optionally show elapsed time since page load: `T+00:14:32`.
- Style: `text-[var(--color-text-tertiary)]`, smaller font (8px).
- This is a stretch goal, not blocking.

### Acceptance Criteria
- [ ] UTC timestamp in status bar updates every second.
- [ ] Seconds digit visibly increments without page refresh.
- [ ] No memory leak (interval cleaned up on unmount).
- [ ] Optional: mission elapsed timer shown.

---

## 3. Click-to-Query Elevation

### Problem
The elevation profile is a hardcoded SVG. Users cannot query actual terrain elevation at a clicked point or draw transect lines for real profile generation.

### Requirements

#### 3.1 Point Elevation Query
- On single-click on the map, sample the elevation at that coordinate.
- Fetch the Terrarium tile containing the clicked point, decode the RGB pixel at the exact location, compute elevation.
- Display result in a popup tooltip at the click location:
  ```
  ┌─────────────────────┐
  │ 40°41'12.3"N        │
  │ 73°58'01.7"W        │
  │ ▲ 47.2m NAVD88      │
  │ SLOPE: 4.2° (GENTLE)│
  └─────────────────────┘
  ```
- Tooltip styled as `.panel` with sigint-green elevation value.

#### 3.2 Elevation Service

```typescript
// src/lib/elevation.ts
interface ElevationResult {
  elevation_m: number;
  slope_deg: number | null;
  aspect_deg: number | null;
  source: 'terrarium' | 'cache';
}

async function queryElevation(lng: number, lat: number, zoom: number): Promise<ElevationResult>
```

- Compute tile x/y from lng/lat/zoom using standard slippy map math.
- Fetch tile image, draw to OffscreenCanvas, read pixel at sub-tile coordinates.
- Decode: `elevation = (R * 256 + G + B / 256) - 32768`
- Cache fetched tiles in memory (LRU cache, max 50 tiles).
- Compute slope from 3×3 neighborhood around the pixel (finite difference method).

#### 3.3 Transect Profile Drawing
- User activates "profile mode" via a button in the Elevation Profile panel header (or keyboard shortcut `P`).
- In profile mode, click two points on the map to define a transect line.
- A green dashed line is drawn between the two points on the map.
- The elevation profile panel expands from collapsed (64px) to full height (180px).
- Sample elevation at N points along the transect (N = panel pixel width, ~300 samples for a 300px-wide panel).
- Render the terrain cross-section as a dynamic SVG `<path>` replacing the hardcoded one.

#### 3.4 Profile Rendering

The expanded profile panel shows:
- **Y-axis:** Elevation scale with grid lines at round intervals (auto-scaled to min/max of transect).
- **X-axis:** Distance markers in m (< 5km) or km (≥ 5km).
- **Terrain fill:** `linear-gradient(180deg, rgba(107,117,109,0.6), rgba(26,30,28,0.9))` above sea level; `rgba(10,22,40,0.9)` below.
- **Terrain stroke:** `rgba(255,255,255,0.5)` 1px line.
- **Sea level line:** Horizontal cyan line at 0m if visible in range.
- **Cursor tracking:** Hovering over the profile shows a vertical hairline and displays the elevation + distance at that point.
- **Datum marker:** If the transect passes near the datum point, show a green dot on the profile.

#### 3.5 Map Markers for Transect
- Point A: Green circle marker with label "A".
- Point B: Green circle marker with label "B".
- Transect line: `#00ff41` dashed line (`4 2` dash array), 1.5px.
- Clear transect with Escape key or a clear button in the profile panel.

### Acceptance Criteria
- [ ] Single-click on map shows elevation tooltip with height in meters.
- [ ] Tooltip includes slope classification (Flat/Gentle/Moderate/Steep/Severe/Cliff).
- [ ] Profile mode activated by button or `P` key.
- [ ] Two clicks define a transect; profile renders dynamically from DEM data.
- [ ] Profile panel shows correct elevation range, distance scale, sea level reference.
- [ ] Hover on profile shows crosshair with elevation/distance readout.
- [ ] Escape or clear button resets transect.

---

## 4. 3D Terrain Mode

### Problem
All terrain visualization is 2D raster. For briefings and situational awareness, a perspective 3D terrain mesh adds spatial comprehension that 2D cannot provide. Three.js is installed but unused.

### Requirements

#### 4.1 Mode Toggle
- Add a "3D" toggle button to the Terrain Layers panel (or as a standalone floating button, bottom-left near the coordinates HUD).
- Toggling 3D mode transitions from the MapLibre 2D view to a Three.js 3D terrain renderer.
- The 2D map is hidden (not destroyed) so toggling back is instant.

#### 4.2 Terrain Mesh Generation

```typescript
// src/components/Terrain3D.tsx
```

- Fetch Terrarium elevation tiles for the current viewport extent.
- Decode elevation grid (same logic as Feature 1/3).
- Generate a Three.js `PlaneGeometry` heightfield:
  - Vertex count: ~100 vertices per tile edge (LOD depends on zoom).
  - Displace Y position by decoded elevation × z-exaggeration factor.
- Apply texture: Composite of the CARTO dark tile + hillshade as a `CanvasTexture`.
- Material: `MeshStandardMaterial` with:
  - Base map texture
  - Normal map derived from elevation gradients
  - Roughness: 0.9 (matte terrain)
  - Metalness: 0.0

#### 4.3 Camera & Controls
- Use Three.js `OrbitControls` (or a custom implementation).
- Default pitch: 60° from vertical.
- Pitch range: 0° (top-down) to 85° (near-horizon).
- Default bearing: 0° (north-up).
- FOV: 45°.
- Near clip: 1m, far clip: 50,000m.
- Initial camera position: Centered on current map center, altitude proportional to zoom level.
- Mouse controls: Left-drag = orbit, right-drag = pan, scroll = zoom.

#### 4.4 Lighting
Match the 2D hillshade parameters:
- **Directional light:** Azimuth 315° (NW), altitude 45°, intensity 0.8, color white.
- **Ambient light:** Color `#404040`, intensity 0.3.
- This produces consistent shadow appearance between 2D hillshade and 3D mesh.

#### 4.5 Z-Exaggeration Control
- Default: 3.0× (per NYC datum recommendation — low-relief terrain needs exaggeration).
- Range: 1.0× to 5.0×.
- Control: Slider in the Terrain Layers panel, visible only when 3D mode is active.
- Label: `Z-EXAG: 3.0×` updating live as slider moves.
- Mesh vertex positions update in real-time as slider changes (buffer geometry attribute update, no rebuild).

#### 4.6 Wireframe Mode
- Toggle available in 3D mode: show terrain as wireframe mesh.
- Wireframe color: `rgba(0, 255, 65, 0.15)`.
- Useful for terrain analysis and understanding mesh resolution.

#### 4.7 Performance
- LOD system based on distance from camera:
  - Near tiles: Full resolution (1 vertex per ~10m).
  - Mid tiles: Half resolution.
  - Far tiles: Quarter resolution.
- Frustum culling: Only render tiles visible to camera.
- Max triangle budget: 500K (instanced where possible).
- Target: 60fps on mid-range GPU (GTX 1060 / M1 equivalent).
- Dispose textures and geometries when tiles leave viewport.

#### 4.8 Transition Animation
- Toggling to 3D: Camera smoothly pitches from 0° (top-down, matching 2D) to 60° over 800ms with easing.
- Toggling to 2D: Camera pitches back to 0°, then cross-fade to MapLibre canvas over 300ms.

### Acceptance Criteria
- [ ] 3D toggle button switches between 2D map and 3D terrain view.
- [ ] Terrain mesh correctly reflects elevation data from DEM tiles.
- [ ] Satellite + hillshade texture applied to mesh surface.
- [ ] Orbit controls allow pitch, bearing, and zoom adjustment.
- [ ] Z-exaggeration slider adjusts vertical scale in real-time (1×–5×).
- [ ] Lighting matches 2D hillshade (NW illumination, 45° altitude).
- [ ] Wireframe mode toggle available.
- [ ] Smooth animated transition between 2D and 3D modes.
- [ ] 60fps at 500K triangles on mid-range hardware.

---

## 5. Responsive Layout

### Problem
All HUD panels use fixed pixel positioning (`absolute top-4 right-4`) and fixed widths (`w-52`, `w-72`, `w-80`). On screens narrower than ~900px, panels overlap each other and the map becomes unusable. On mobile (375px), the interface is completely broken.

### Requirements

#### 5.1 Breakpoint Strategy

| Breakpoint | Name | Layout |
|---|---|---|
| ≥ 1280px | Desktop | Current layout — all panels visible, fixed positions |
| 768–1279px | Tablet | Panels collapse to icons in a right-edge toolbar; click to expand as slide-out drawers |
| < 768px | Mobile | Bottom sheet navigation; map fills screen; panels accessed via bottom tab bar |

#### 5.2 Desktop (≥ 1280px) — No Change
Current layout persists. All panels visible simultaneously.

#### 5.3 Tablet (768–1279px)

**Right Toolbar:**
- Replace the right-side panels with a vertical icon toolbar (40px wide, right edge).
- Icons (top to bottom): Layers, Intel, Elevation, Settings.
- Each icon is a 32×32 touch target with a `.panel` background.
- Clicking an icon slides out the corresponding panel as a 280px-wide drawer from the right edge.
- Only one drawer open at a time. Clicking another icon switches panels.
- Clicking the active icon or clicking outside closes the drawer.
- Drawer has a subtle slide-in animation (200ms ease-out).

**Top-left header:**
- Collapse to single line: `● GREY-EARTH` only. MGRS line hidden.

**Bottom bar:**
- Coordinates HUD and status bar merge into a single bottom bar spanning full width.
- Format: `SIGINT-TERRAIN | 40°41'... | Z11.5 | 2026-03-24 21:56:57Z | ● OPERATIONAL`

#### 5.4 Mobile (< 768px)

**Full-screen map:**
- Map fills entire viewport. No panels visible by default.

**Bottom tab bar (56px tall):**
- 4 tabs: Map (default), Layers, Intel, Profile.
- Active tab has green underline indicator.
- Tapping a non-Map tab opens a bottom sheet (60% viewport height) with that panel's content.
- Bottom sheet has a drag handle for resize (60% → full → dismiss).
- Swipe down on sheet to dismiss.

**Top status bar (32px):**
- Minimal: pulsing green dot + "GREY-EARTH" + current time.
- Transparent background, no panel styling (save screen space).

**Touch interactions:**
- Map supports touch pan, pinch-zoom, two-finger rotate.
- Elevation query: long-press (500ms) instead of click.
- Profile mode: disabled on mobile (too small for meaningful transect drawing).

#### 5.5 Implementation Approach

Create a `useBreakpoint` hook:

```typescript
// src/hooks/useBreakpoint.ts
type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  // Uses window.matchMedia with listeners
  // Returns current breakpoint reactively
}
```

Refactor `HUDOverlay.tsx` to render different layouts based on breakpoint:

```tsx
const bp = useBreakpoint();

if (bp === 'desktop') return <DesktopHUD />;
if (bp === 'tablet') return <TabletHUD />;
return <MobileHUD />;
```

Each layout variant is a separate component to keep logic clean — no massive conditional trees.

#### 5.6 CSS Strategy
- Use Tailwind responsive prefixes (`md:`, `lg:`) for simple show/hide.
- For structural layout changes (toolbar vs. panels vs. bottom sheet), use the `useBreakpoint` hook to swap components.
- Bottom sheet component: CSS `transform: translateY(...)` with touch event handlers for drag.
- Drawer component: CSS `transform: translateX(...)` with 200ms transition.

### Acceptance Criteria
- [ ] At ≥ 1280px: Current layout unchanged.
- [ ] At 768–1279px: Right panels collapse to icon toolbar with slide-out drawers.
- [ ] At 768–1279px: Bottom bar merges coordinates + status into single row.
- [ ] At < 768px: Full-screen map with bottom tab bar navigation.
- [ ] At < 768px: Bottom sheet panels with drag-to-resize.
- [ ] At < 768px: Long-press for elevation query instead of click.
- [ ] No horizontal scroll at any breakpoint.
- [ ] Touch controls work on mobile (pan, pinch-zoom, rotate).
- [ ] Transitions between panel states are animated (200ms ease-out).

---

## Implementation Priority & Dependencies

```
                    ┌──────────────┐
                    │  2. Live     │  ← No dependencies, quick win
                    │     Clock    │
                    └──────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  1. Layer    │───▶│  3. Click    │───▶│  4. 3D       │
│  Toggles     │    │  Elevation   │    │  Terrain     │
│              │    │              │    │              │
│ • MapContext │    │ • DEM decode │    │ • Three.js   │
│ • DEM tiles  │    │ • Transect   │    │ • Mesh gen   │
│ • Contours   │    │ • Profile    │    │ • Texturing  │
│ • Slope/Hyp  │    │ • LOS calc   │    │ • Controls   │
└──────────────┘    └──────────────┘    └──────────────┘
                                              │
                    ┌──────────────┐           │
                    │  5. Respon-  │◀──────────┘
                    │  sive Layout │  ← Must account for 3D toggle
                    └──────────────┘
```

| Phase | Feature | Est. Effort | Depends On |
|---|---|---|---|
| **Phase 0** | Live Clock | 1 hour | Nothing |
| **Phase 1** | Layer Toggles + MapContext | 2–3 days | Nothing |
| **Phase 2** | Click-to-Query Elevation | 2–3 days | Phase 1 (DEM decode, MapContext) |
| **Phase 3** | 3D Terrain Mode | 3–5 days | Phase 1 (DEM decode), Phase 2 (elevation lib) |
| **Phase 4** | Responsive Layout | 2–3 days | Phase 1–3 (must wrap all features) |

**Total estimated effort: 10–15 days**

---

## Technical Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Terrarium tile decoding precision at high zoom | Medium | Cross-validate against known NYC landmarks (Todt Hill = 125m). Fall back to API query if drift > 2m. |
| WebGL context conflicts (MapLibre + Three.js) | High | Use separate canvases. Hide MapLibre canvas (don't destroy) when 3D is active. Only one WebGL context renders at a time. |
| Mobile performance with DEM processing | Medium | Disable slope/hypso layers on mobile. Reduce contour resolution. Skip 3D entirely on low-end devices (detect via `navigator.hardwareConcurrency`). |
| CORS on Mapzen Terrarium tiles | Low | Tiles are public S3 with permissive CORS. If blocked, proxy through Next.js API route. |
| Contour generation performance (marching squares on large grids) | Medium | Process in Web Worker. Limit to visible viewport tiles. Cache generated GeoJSON per tile key. |

---

## Non-Goals (Out of Scope)

- Real intel feed data integration (remains hardcoded placeholder).
- Server-side DEM processing or custom tile server.
- Multi-user collaboration or real-time sync.
- Offline/PWA support.
- Authentication or access control.
- Fresnel zone analysis (deferred to future sprint).
- Aspect analysis layer (deferred — similar to slope, lower priority).
