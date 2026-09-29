# Pharo Hotel website

Test build of the Pharo Hotel website: a single-page static site (HTML, CSS and plain JavaScript) that deploys to GitHub Pages.

**Live URL:** https://cabeskagroup.github.io/pharo-website/

All names, prices, photos and contact details are placeholders.

## Turn on GitHub Pages (one time)

1. Open the repo on GitHub, then go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Go to **Actions → Deploy to GitHub Pages → Run workflow** (or push any commit).

After that, every push to `main` (or to the current `claude/relaxed-goodall-yxzkzu` branch) redeploys the site in about a minute. The footer shows the commit that's live, and so does https://cabeskagroup.github.io/pharo-website/version.json.

If a deploy fails with *"Branch … is not allowed to deploy to github-pages"*, go to **Settings → Environments → github-pages** and add the branch under **Deployment branches**.

## Preview locally

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## What's in it

```
index.html              the page: hero, booking bar, about, rooms, amenities, dining, gallery, contact
404.html                "page not found" page (self-contained)
assets/css/style.css    all styles; colours and fonts are variables at the top
assets/js/main.js       mobile menu, date pickers, form checks, scroll effects, build stamp
assets/img/             favicon, and where your photos go
.github/workflows/      GitHub Pages deploy
```

## Replacing the placeholders

- **Photos:** each grey/coloured tile is a `<div class="ph …">`. Put photos in `assets/img/` and replace a tile with `<img src="assets/img/your-photo.jpg" alt="Describe the photo">`.
- **Text, prices, contact details:** edit `index.html` directly.
- **Colours and fonts:** change the variables in `:root` at the top of `assets/css/style.css`.

## Before going live

- Remove `<meta name="robots" content="noindex, nofollow">` from `index.html` so search engines can index the site.
- Remove the **TEST BUILD** badge (the `<aside class="test-badge">` at the end of `index.html`).
- Connect the booking and enquiry forms to a backend. GitHub Pages only serves static files (no PHP, no database), so real bookings need PHP/MySQL hosting or a form service.
