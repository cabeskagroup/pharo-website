# The Pharo — hotel website

Multi-page website for **The Pharo, Nittambuwa**: a royal, Egyptian-accented design with GSAP animations, deployed to GitHub Pages.

**Live URL:** https://cabeskagroup.github.io/pharo-website/

## Pages

| Page | File (generated) | Source |
| --- | --- | --- |
| Home | `index.html` | `src/pages/index.html` |
| Rooms & Suites | `rooms.html` | `src/pages/rooms.html` |
| Dining & Menu | `dining.html` | `src/pages/dining.html` |
| Weddings & Events | `events.html` | `src/pages/events.html` |
| Experiences | `experiences.html` | `src/pages/experiences.html` |
| Gallery | `gallery.html` | `src/pages/gallery.html` |
| Our Story | `about.html` | `src/pages/about.html` |
| Contact | `contact.html` | `src/pages/contact.html` |

The header, footer, menu, booking drawer and other shared parts live once in `src/partials/`.

## Editing

1. Edit a page in `src/pages/` or a shared part in `src/partials/`.
2. Run `python3 tools/build.py` to regenerate the root `*.html` files (no dependencies needed).
3. Commit and push to `main`. The deploy workflow also runs the build, so the live site always matches `src/`.

Don't edit the root `*.html` files directly; they're overwritten by the build. `python3 tools/build.py --check` tells you if they're out of date.

The build adds a fingerprint to the stylesheet and script links (`style.css?v=…`), so visitors always get the matching CSS and JavaScript after a deploy, never a stale cached copy.

## Preview locally

```sh
python3 tools/build.py
python3 -m http.server 8000
# then open http://localhost:8000
```

## What's real, what's placeholder

- **Real:** the logo and crown (`assets/img/real/`, from the British Way Holdings site), photos of the palace, entrance sign, a bedroom, a balcony and the hotel collage; address, phone, email, venues, ballroom capacity and Deluxe Room details from public listings; guest review titles and quotes from Tripadvisor and Booking.com.
- **Placeholder:** other photos are Unsplash stock images. If one fails to load, its frame shows a gold gradient instead.
- **Please verify:** the phone number (also used for WhatsApp bookings), Rs. 6,000 Deluxe rate, room names "Deluxe Balcony Room" and "Family Room", ratings (Tripadvisor 4.4, Booking.com 8.4 and staff 8.8) and the review wording in `src/partials/testimonials.html`.
- **Menu:** the Dining page links to the live menu at https://pharo.cabeskagroup.com/.

## Replacing a stock photo

Put the photo in `assets/img/` and replace the `https://images.unsplash.com/...` address in the page's `src/pages/*.html` file (or `src/partials/` for shared parts), then run the build.

## Animation and fallbacks

- GSAP 3.15 with ScrollTrigger, ScrollSmoother, SplitText, DrawSVG, Flip and ScrollTo is in `assets/vendor/gsap/` (GSAP's free standard licence).
- First visit to the home page: a temple-gate intro (about 3.5 seconds). Every other page load: a gold curtain lift. Both are timed in CSS, so they always clear even if a script is slow or fails.
- Smooth scrolling is only used with a mouse; phones and tablets keep native scrolling.
- Visitors with "reduce motion" turned on get a calm, static site; if scripts fail, every page still works.

## Fonts

Cinzel, Cormorant Garamond and Manrope, plus a 15-glyph subset of Noto Sans Egyptian Hieroglyphs, all self-hosted under the SIL Open Font License (`assets/fonts/`). If you add new hieroglyphs, regenerate `pharo-glyphs.woff2` so they display.

## Before going live

- Remove `<meta name="robots" content="noindex, nofollow">` from `src/partials/layout.html`.
- Replace the stock photos and check every fact in the list above.
- For online payments or a room database, move to PHP/MySQL hosting (GitHub Pages only serves static files).
