# The Pharo — hotel website

Royal-Egypt themed website for **The Pharo**, Nittambuwa, Sri Lanka: a single-page static site with GSAP scroll animations, deployed to GitHub Pages.

**Live URL:** https://cabeskagroup.github.io/pharo-website/

## What's on the page

| Section | What it does |
| --- | --- |
| Temple gate | Preloader: two engraved doors with hieroglyphs swing open to reveal the site |
| Hero | Full-screen photo, golden dust particles, a "PHARO" cartouche in hieroglyphs |
| Reservation bar | Sends the chosen dates, guests and room to reservations on WhatsApp |
| The Kingdom | About the hotel; the statement lights up word by word as you scroll |
| Royal Chambers | Room types; a pinned horizontal gallery on desktop, a stacked list on phones |
| Rooftop Oasis | The pool photo opens from a rounded window to full screen as you scroll |
| Royal Feasts | The Let Berry, The Palm Court, Tavern Blue, Café Brew (hover or scroll to swap photos) |
| Celebrations | Grand Ballroom, Lavender Ballroom, rooftop parties as stacking cards |
| Royal Privileges | Amenity icons that draw themselves |
| Treasures | Parallax photo gallery with a lightbox |
| Contact | Address, phone, email, map, and an enquiry form (WhatsApp or email) |
| Finale | The sun rises behind the pyramids |

Hotel details (address, phone, email, venues, ballroom capacity, Deluxe room features and the Rs. 6,000 rate, Booking.com 8.4 and Tripadvisor 4.0 scores) come from public listings. **Check them before launch.** Room photos and other photos are Unsplash stock images until real ones are added.

## Files

```
index.html                 the whole page
404.html                   "page not found" page (self-contained)
assets/css/style.css       styles; colours and fonts are variables at the top
assets/js/main.js          animations (GSAP), forms, menu, lightbox
assets/vendor/gsap/        GSAP 3.15 + ScrollTrigger, ScrollSmoother, SplitText, ScrollToPlugin, DrawSVGPlugin
assets/fonts/              Cinzel, Cormorant Garamond, Manrope, and a 16-glyph hieroglyph font (all SIL OFL)
assets/img/                favicon; put your photos here
.github/workflows/         GitHub Pages deploy
```

Everything is self-hosted except the stock photos and the Google Map, so the site doesn't depend on any CDN.

## Replacing the stock photos

1. Put your photos in `assets/img/` (JPG or WebP, around 2000px wide for full-screen images and 1200px for the rest).
2. In `index.html`, replace the `https://images.unsplash.com/...` address of each `<img>` with `assets/img/your-photo.jpg`, and update its `alt` text. For the hero image, also remove its `srcset` and `sizes` lines.

If a photo ever fails to load, its frame shows a dark gold/lapis gradient instead of a broken image.

## Preview locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploying

Every push to `main` redeploys the site in about a minute. The footer shows which commit is live, and so does https://cabeskagroup.github.io/pharo-website/version.json.

## Accessibility and fallbacks

- With "reduce motion" turned on in the visitor's system settings, the gate, smooth scrolling and scroll effects are switched off and the page is fully readable.
- If JavaScript or GSAP fails to load, the page still works as a normal static page.

## Before going live

- Remove `<meta name="robots" content="noindex, nofollow">` from `index.html` so search engines can index the site.
- Remove the **TEST BUILD** badge (the `<aside class="test-badge">` near the end of `index.html`).
- Replace the stock photos and double-check all hotel details and prices.
- For online booking with payments or a room database, move to PHP/MySQL hosting (GitHub Pages only serves static files).
