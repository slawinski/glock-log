# Plan: Aligning Triggernote Mobile with Landing Page Aesthetics

This document outlines a surgical plan to enhance the Triggernote mobile app's visual language to match the "Cyber-Noir" aesthetic of its [landing page](https://github.com/slawinski/triggernote-landing). The goal is to evolve the current "Terminal" theme into a high-fidelity "Phosphor" experience without breaking existing functionality.

---

## 1. Visual Foundation: The "Phosphor" Palette

The landing page uses a more vibrant, high-contrast neon green than the mobile app's standard `#00ff00`.

### Actions:
- **Primary Color Update:** Change the base `terminal-green` from `#00ff00` to the landing page's **`#00FF41`**.
- **Transparency Layers:** Add Tailwind color extensions for `terminal-green/10`, `terminal-green/30`, and `terminal-green/50` to support layered glow effects.
- **Bloom (Glow) Definition:** Define a global "Bloom" utility in Tailwind (`shadow-terminal`) that applies a subtle, neon-green drop shadow to text and borders.

---

## 2. Atmospheric Effects: The "CRT Screen"

The landing page feels like a physical screen due to its grid and subtle vignette. We will update the `CRTOverlayShader` to include these features.

### Actions:
- **Procedural Background Grid:**
    - Update `CRTOverlayShader.tsx` (using Skia) to render a subtle, dark green grid layer (e.g., 20px intervals) behind all content.
    - This provides a sense of structure and scale missing from the current flat black background.
- **Vignette Effect:**
    - Add a radial gradient overlay that slightly darkens the corners of the screen, mimicking the look of a curved CRT glass tube.
- **Dynamic Flicker:**
    - Add a low-frequency, very subtle opacity oscillation (0.98 to 1.0) to the scanline layer to simulate "line jitter" or power fluctuations.

---

## 3. Component Evolution: "The Terminal Window"

The landing page uses "blocky" containers with status bars. We will apply this "Windowing" metaphor to the app's cards and sections.

### Actions:
- **Windowed Containers:**
    - Refactor list items (Firearms, Ammunition) to have a 1px border (`border-terminal-green/30`) with a very subtle inner glow.
    - Add a "Status Bar" or "Header Bar" to these containers that contains metadata (e.g., the ID or a mock "System Status" label).
- **Interactive States:**
    - **TerminalButton:** Update the `Pressed` state to include a "Phosphor Brighten" effect where the text and border shadows increase in intensity during the interaction.
    - **TerminalInput:** Ensure the input field has a faint background tint (`terminal-green/5`) when focused, mimicking the "active" state of a terminal prompt.

---

## 4. Typography & Information Density

The landing page achieves a "technical" feel through varied use of monospace fonts and spacing.

### Actions:
- **Typography Hierarchy:**
    - Keep `VT323` for primary headers and navigation titles.
    - (Optional) Introduce a secondary, more legible monospace font (e.g., `JetBrains Mono` or `Fira Code`) for dense data values (stats, serial numbers, timestamps).
- **Data Modules:**
    - Redesign the `Stats` and `Details` screens to use a grid-based "Module" layout. 
    - Instead of long lists, group data into defined "Cells" with borders, similar to a terminal dashboard.

---

## 5. Implementation Roadmap

### Phase 1: Core Theme (Safe)
1. Update `tailwind.config.cjs` with the new color palette (`#00FF41`) and shadow utilities.
2. Update `TerminalText` to apply the new "Bloom" shadow globally.

### Phase 2: Screen Shader (Atmospheric)
1. Enhance `CRTOverlayShader.tsx` with the Grid and Vignette layers.
2. Update `app.json` and the Splash Screen to `userInterfaceStyle: "dark"` to ensure a seamless "Black-to-Phosphor" boot sequence.

### Phase 3: Component Refinement (Visual)
1. Update `TerminalButton` and `TerminalInput` for better interactive feedback.
2. Refactor `FirearmItem` and `AmmunitionItem` to use the "Windowed" container style.

### Phase 4: UX Polish (Functional)
1. Address the `TerminalInput` accessibility issues (identified in the security audit) while applying the new "active" phosphor styles.
2. Introduce the "High Legibility" toggle in settings to swap fonts while maintaining the new neon color scheme.

---
*Plan formulated on March 3, 2026, to align Mobile and Web visual languages.*
