---
name: tool-h5-compact
description: Compact mobile-first tool UI rules for baby-web. Use for any H5/PWA layout, spacing, typography, or interaction work in this repo, especially fast one-handed logging flows.
---

# Tool H5 Compact

This repo builds a tool-style mobile PWA for sleepy, one-handed, low-friction logging. Optimize for speed and density, not showcase aesthetics.

## Core rules
- Default to mobile-first decisions.
- Keep the logging page sparse in cognition, not sparse in pixels.
- Only primary actions should be visually large; supporting UI should stay compact.
- Put secondary analysis such as trends into a separate tab or view when it competes with logging.
- Preserve quick load, local-first behavior, and family sync flows.

## Sizing baseline
- Main title: roughly 22px to 28px.
- Body text: roughly 13px to 14px.
- Secondary text: roughly 12px.
- Standard control height: 36px to 40px.
- Primary action height: 44px to 48px when truly needed.
- Card padding: roughly 10px to 12px.
- Radius: moderate, not oversized.

## Layout guidance
- Avoid hero-like headers on mobile.
- Keep sticky summary thin and useful.
- Favor short rows, compact cards, and visible recent history.
- Protect viewport height for the record list.
- Bottom action bar may stay prominent, but must not dominate the screen.

## Visual guidance
- Use one restrained accent family plus neutral surfaces.
- Prefer clear contrast over ambient decoration.
- Use blur and shadow lightly; they should support hierarchy, not create visual bulk.

## Engineering guidance
- Reuse existing React + Tailwind + Phosphor structure.
- Do not add a third-party UI library unless package.json already includes it or there is a clear need.
- Keep components small and composable.
- Validate changes on narrow mobile widths before finishing.
