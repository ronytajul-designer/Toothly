# Toothly, dental clinic website

Static, responsive, animated build of the **Toothly - Dental Clinic Website UI** Figma template
(5 pages: Home, About, Services, Service Details, Contact). No framework, no dependencies.

## Run locally

```bash
python3 -m http.server 8080
```
Open http://localhost:8080.

## Edit pages

Root `*.html` files are generated. Edit `src/pages/*.html` or `src/partials/*.html`, then rebuild:

```bash
python3 tools/build.py
```

## Color palette (final: Option B, Navy CTA)

| Role | Color | Contrast |
|---|---|---|
| Headings, primary buttons (white text) | Navy #0E2A42 | 14.7:1 on white |
| Body text | Grey #485D6F | 6.5:1 on Grey Subtle |
| Muted text (was #697884) | #5F6E7A | 4.96:1 on Grey Subtle |
| Indicators: active nav, step bar, icons | Teal #3A7D73 | 4.55:1 on Grey Subtle |
| Form field borders | #7D8D99 | 3.2:1 or more |
| Brand surfaces (cards, banners) | Mint #C6E3DE | unchanged |
| Photo scrims under white text | navy gradient to 92% | text 4.6 to 7.5:1 |

The comparison of the options considered is in `docs/palette-comparison.png`.

## Accessibility work (independent of palette)

- Visible floating labels on every field (the Figma used placeholder-only labels)
- Inline, specific error messages with `aria-invalid`, focus moved to first error, live status region
- Booking rules: no past dates, Sunday closed, Saturday slots end 2:30 PM
- Skip link, landmarks, one `h1` per page, logical heading order
- Visible 3px focus ring everywhere; `forced-colors` support
- FAQ, How It Works, mobile menu: real buttons with `aria-expanded`
- Testimonial and doctor carousels: labelled buttons, off-screen cards made `inert`
- Star ratings exposed as "Rated 5 out of 5"; icon-only social links labelled
- Video opens a native `<dialog>` (Escape closes, focus returns)
- All motion disabled under `prefers-reduced-motion`
- Touch targets 44px or more
- Images: WebP, cropped to their Figma framing, lazy-loaded (76 MB down to 1.2 MB)

Audit: axe-core 4.10 (WCAG 2.2 AA + best practice) on all 5 pages, 0 violations with the final palette
(12 contrast violations with the original Figma colors).

## Not included

- No backend. Forms validate and show a success state but do not send anything.
- `assets/video/clinic-tour.mp4` is not in the Figma file. The modal shows a notice until it is added.
- Blog posts, Privacy Policy and Terms are placeholder links.
- Content for the non-pediatric service detail views was written for this build (the Figma has only Pediatric).
