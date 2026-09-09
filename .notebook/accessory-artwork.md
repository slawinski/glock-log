# Accessory artwork

- `scripts/generate-accessory-assets.mjs` generates the 13 standalone SVGs under `assets/images/accessories/` using `TERMINAL_GREEN` from `src/theme/colors.ts`. Run with `node scripts/generate-accessory-assets.mjs`; no rasterizer is required.
- `src/components/accessory-image/accessoryImageAssets.ts` maps every storage category to a static asset require. Category names use underscores; asset filenames use hyphens.
- `src/components/accessory-image/AccessoryImage.tsx` prefers a supplied photo resolved through `image-source-manager`; otherwise it shows contained category artwork. Artwork is not persisted in `photos`.
- `src/screens/home/AccessoryListItem.tsx` uses the first photo or category fallback at 80 px. `src/screens/accessory-details/AccessoryDetails.tsx` uses the full gallery for nonempty photo identifiers or 220 px artwork otherwise.
- Native SVG decoding still needs device verification; Jest mocks do not exercise the native image decoder.
