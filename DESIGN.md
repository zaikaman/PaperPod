---
name: PaperPod
description: The Interactive 2-Host AI Audio Research Companion
colors:
  primary: "#D97736"
  primary-warm: "#C86A32"
  primary-light: "#E28647"
  host-alex: "#F59E0B"
  host-taylor: "#38BDF8"
  neutral-bg: "#000000"
  neutral-subtle: "#090A0C"
  surface: "#111215"
  surface-elevated: "#17181C"
  surface-pressed: "#1F2025"
  border: "rgba(255, 255, 255, 0.07)"
  border-strong: "rgba(255, 255, 255, 0.14)"
  border-accent: "#C86A32"
  text-primary: "#FFFFFF"
  text-secondary: "#8B8F97"
  text-muted: "#52555C"
  text-dim: "#383B44"
typography:
  display:
    fontFamily: "SF Pro Display, -apple-system, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.3px"
  headline:
    fontFamily: "SF Pro Display, -apple-system, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "1.6px"
  title:
    fontFamily: "SF Pro Display, -apple-system, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.4px"
  body:
    fontFamily: "SF Pro Text, -apple-system, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
  label:
    fontFamily: "SF Pro Text, -apple-system, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "1.2px"
rounded:
  sm: "8px"
  md: "14px"
  lg: "18px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "26px"
  xxl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.primary-light}"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
---

# Design System: PaperPod

## Overview

**Creative North Star: "The Obsidian Research Salon"**

PaperPod is designed as an intimate, nocturnal sanctuary for intellectual inquiry. Rooted in deep matte obsidian canvas tones, the interface evokes the tactile prestige of a private research salon where complex academic literature is unlocked through conversation. The aesthetic avoids cold technical starkness, balancing razor-sharp geometric precision with warm terracotta firelight and luminous host accents.

Every screen embodies restraint, scannability, and high-density legibility. Backgrounds remain pitch-black (`#000000`) to let typography, high-resolution PDF vector figures, and audio waveform frequencies command immediate focus. Translucent graphite glass layers and crisp hairline borders (`rgba(255, 255, 255, 0.07)`) create structural hierarchy without visual clutter or heavy drop shadows.

**Key Characteristics:**
- **Matte Obsidian Canvas**: Pure `#000000` foundation optimizing OLED battery efficiency and darkroom reading comfort.
- **Warm Terracotta Focal Points**: High-energy copper accents (`#D97736`) reserved for active playback states, live voice interruptions, and key touch targets.
- **Dual-Host Chromatic Identity**: Solar Amber (`#F59E0B`) for Alex (Curious Analyst) and Electric Cyan (`#38BDF8`) for Dr. Taylor (Domain Expert).
- **Architectural Arch & Pill Geometry**: Distinctive dome arch portrait masks (145px radius) and fluid pill controls.

## Colors

The palette is anchored by matte obsidian darkness, translucent graphite surfaces, and purposeful sparks of burnt copper and host frequency indicators.

### Primary
- **Warm Terracotta** (`#D97736`): The primary interactive accent. Used on active play buttons, floating mic interrupt trigger, scrubber fill, and key navigation highlights.
- **Burnt Copper** (`#C86A32`): Used for focused wireframe button borders and subtle accent badges.
- **Terracotta Glow** (`rgba(217, 119, 54, 0.22)`): Ambient diffuse halo behind active audio and floating action controls.

### Secondary
- **Solar Amber — Host Alex** (`#F59E0B`): Dedicated speaker identity color for Host Alex. Applied to Alex's dialogue bubbles, avatar halos, and alternating waveform bars.

### Tertiary
- **Electric Cyan — Host Dr. Taylor** (`#38BDF8`): Dedicated speaker identity color for Dr. Taylor. Applied to Taylor's dialogue segments, technical explanation badges, and active Q&A clarifications.

### Neutral
- **Matte Obsidian Background** (`#000000` / `#090A0C`): Canvas background across all primary screens.
- **Graphite Glass Surface** (`#111215` / `#17181C`): Translucent container backgrounds for category cards, HUD drawers, and player metadata blocks.
- **Hairline Border** (`rgba(255, 255, 255, 0.07)`): Subtle container dividing lines and structural cards.
- **Text Primary** (`#FFFFFF`): High-emphasis headings, titles, and active dialogue words.
- **Text Secondary** (`#8B8F97` / `#A0A4AD`): Body paragraphs, paper abstracts, and spoken transcript history.
- **Text Muted** (`#52555C` / `#383B44`): Inactive word timestamps, metadata labels, and subtle stats.

### Named Rules
**The Luminous Focal Rule.** Primary warm terracotta (`#D97736`) is strictly reserved for active engagement states (play state, scrubber progress, primary actions, and live voice interrupts). It accounts for ≤8% of any screen surface to preserve its magnetic authority.

**The Dual-Host Identity Rule.** Host colors (Solar Amber `#F59E0B` for Alex, Electric Cyan `#38BDF8` for Dr. Taylor) are functional indicators of speaker state, waveform energy, and dialogue attribution—never decorative background fills.

## Typography

**Display & UI Font:** SF Pro Display (iOS system font, fallbacks: `-apple-system`, `system-ui`, `sans-serif`)  
**Body & Transcript Font:** SF Pro Text (iOS system font, fallbacks: `-apple-system`, `system-ui`, `sans-serif`)  

**Character:** Modern, confident, and meticulously tracked. The pairing combines high-contrast uppercase micro-headings with readable, breathable body typography tailored for synchronized transcript reading.

### Hierarchy
- **Display / Hero Title** (Bold 700, 20px, line-height 24px, letter-spacing -0.3px): Featured paper titles and top-level screen anchors.
- **Headline / Section Heading** (Bold 700, 10.5px, line-height 14px, letter-spacing 1.6px, uppercase): Category labels, section dividers, and metadata tags.
- **Title / Screen Title** (Bold 700, 22px, line-height 28px, letter-spacing -0.4px): Major modal headers and player sheet titles.
- **Body / Transcript** (Regular 400, 13px, line-height 19px, letter-spacing normal): Spoken transcript text, paper abstracts, and researcher comments. Max line length 65ch.
- **Label / Tag** (Bold 700, 11px, line-height 14px, letter-spacing 1.2px, uppercase): Metric stat badges, duration indicators, and citation counters.

### Named Rules
**The Micro-Heading Track Rule.** All uppercase subheadings and category tags use expansive tracking (1.4px to 1.6px letter-spacing) at small sizes (10-11px) to command architectural clarity without heavy visual weight.

**The Spoken Transcript State Rule.** Transcripts transition across 4 optical weights: inactive future words (`#383B44`), current section words (`#6C707A`), past spoken words (`#D1D5DB`), and active spoken word highlight (`#FFFFFF` with `rgba(217, 119, 54, 0.45)` rounded background).

## Layout

PaperPod adheres to an 8pt spatial grid with generous 20px to 22px horizontal screen gutters. Content is structured in vertically stacked modules with 12px to 16px internal gaps.

- **Screen Padding**: 20px to 22px horizontal margin across all standard screens.
- **Safe Area Conformance**: All top navigation headers respect `SafeAreaView` notch insets; floating controls sit 20px above the iOS home indicator bar.
- **Density & Rhythm**: Compact 34x34px icon boxes, 48x48px story thumbnails, and 165px minimum width horizontal scrolling category pills.

## Elevation & Depth

PaperPod rejects muddy drop shadows and faux skeuomorphism. Depth is established through tonal layering, translucent glassmorphism, and hairline alpha borders.

### Shadow Vocabulary
- **Terracotta Glow** (`shadowColor: #D97736, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6`): Applied exclusively to the floating interruption mic button and active playback triggers.
- **Glass Rim** (`borderWidth: 1, borderColor: rgba(255, 255, 255, 0.07)`): The primary structural boundary for cards, HUD drawers, and input containers.

### Named Rules
**The Hairline Glass Rule.** Visual depth is achieved through 1px translucent hairline borders (`rgba(255, 255, 255, 0.07)`) and translucent surface fills, never through multi-colored drop shadows.

## Shapes

- **Dome Arch Hero**: 290x310px container with 145px top and bottom radii creating an architectural arch silhouette for cover artwork.
- **Card Containers**: 18px corner radius (`#111215` / `#121316` surface) with 1px hairline border.
- **Interactive Pills**: 24px to 28px corner radius on primary action buttons, search bars, and floating mic controls.
- **Small Controls**: 8px corner radius on icon containers and stat chips.

## Components

### Buttons
- **Shape:** Sculpted Pill (24px - 28px radius).
- **Primary (Enter Briefing / Floating Mic):** Background `#D97736`, text `#FFFFFF` Bold 13px, padding 12px 24px, subtle copper elevation glow.
- **Wireframe / Ghost:** Background `transparent` or `rgba(217, 119, 54, 0.1)`, border 1.2px `#C86A32` or `#D97736`, text `#FFFFFF`.
- **Touch Target:** Guaranteed 44x44 pt minimum touch envelope for mobile usability.

### Cards / Containers
- **Corner Style:** 18px radius (`rounded.lg`).
- **Background:** `#111215` (surface) or `rgba(255, 255, 255, 0.035)`.
- **Border:** 1px hairline `rgba(255, 255, 255, 0.06)`.
- **Internal Padding:** 12px to 14px horizontal, 10px to 12px vertical.

### Input / Ingestion Field
- **Style:** 20px pill container, background `#111215`, border `rgba(255, 255, 255, 0.08)`, 13px text input with placeholder `#6E727A`.
- **Action Accessory:** 36x36px circular button with right arrow icon.

### Waveform Visualizer & Scrubber
- **Waveform:** Animated vertical bars (3.5px width, 2px radius, 3.5px gap) color-coded by host persona (`#F59E0B` / `#38BDF8` / `#D97736`).
- **Scrubber:** 3px track with `#D97736` progress fill and high-contrast digital timestamp (`11px`, `#8B8F97`).

## Do's and Don'ts

### Do:
- **Do** maintain pure pitch-black (`#000000`) canvas backgrounds for OLED contrast and visual immersion.
- **Do** preserve the dual-host color coding (`#F59E0B` for Alex, `#38BDF8` for Dr. Taylor) across all audio and transcript surfaces.
- **Do** use 1px hairline borders (`rgba(255, 255, 255, 0.07)`) to separate glass containers and cards.
- **Do** ensure all interactive buttons and icons have at least a 44x44 pt touch target.
- **Do** format section titles in uppercase with wide letter-spacing (`1.4px - 1.6px`).

### Don't:
- **Don't** introduce solid bright white or generic gray card backgrounds that break the dark salon atmosphere.
- **Don't** use standard heavy drop shadows on static content; depth is created through tonal layering and hairline borders.
- **Don't** overuse the primary terracotta accent (`#D97736`) on non-interactive decorative elements.
- **Don't** mix custom web icon sets; use consistent Lucide / SF-style iconography with baseline alignment.
