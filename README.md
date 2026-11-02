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

## Visual style

Studio-style theme inspired by gr8rstudio.com, kept in the clinic's green:
off-white canvas, white bordered cards, two-tone display headings, mono uppercase labels,
glowing pill buttons with an arrow, boxed FAQ, green CTA panels and a deep green footer.

Fonts: Funnel Display (headings), Inter (body), Geist Mono (labels, nav, buttons).

| Role | Color | Contrast |
|---|---|---|
| Ink (headings) | #12241F | 15.5:1 on #FAFAFA |
| Body text | #46564F | 7:1+ |
| Muted text | #5E6E69 | 4.9:1 on #F3F6F5 |
| Heading second tone (large text only) | #7A8A85 | 3.3:1 |
| Primary button | gradient #0C8466 to #0A6F59, white text | 4.66:1 minimum |
| Green text, badges | #0B7D64 | 5.08:1 |
| Green tint surfaces | #DCF0E7 | ink 13.6:1 |
| CTA panels | gradient #0D8A6D / #0A7560 / #095E4D | body text 5.2:1+, headings 4.6:1+ |
| Footer | #0A3B30, links #C9DDD5 | 8.8:1 |
| Field borders | #8A9893 | 3.0:1 |

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
- Copy was rewritten for a plain, specific voice. Plan prices, plan benefits, the free first exam,
  same-day emergency slots and insurance claims are placeholders: confirm them with the clinic.
- Pricing is one membership shown as three billing cards: Weekly $12, Monthly $49, Yearly $490
  (2 months free). Prices are placeholders to confirm with the clinic.
- Team portraits were generated with Figma AI (file "Toothly Team Portraits"). Replace them with
  photos of the real dentists before launch. Reviews use initials, not photos.
