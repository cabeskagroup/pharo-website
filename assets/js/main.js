/* The Pharo — interactions and GSAP motion for every page.
   Everything degrades gracefully: without GSAP (or with reduced motion) each
   page is a normal, fully readable site with working forms and navigation. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;

  const WHATSAPP = '94706696663';
  const EMAIL = 'info@thepharo.lk';
  const PHONE = '+94 70 669 6663';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const gsap = window.gsap;
  const motion = !!(gsap && window.ScrollTrigger) && !reduceMotion;
  if (!motion) root.classList.add('no-gsap');

  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (_) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (_) { /* ignore */ } },
    del(k) { try { sessionStorage.removeItem(k); } catch (_) { /* ignore */ } },
  };

  const header = $('.site-header');
  const gate = $('.gate');
  const curtain = $('.curtain');
  let smoother = null;

  /* ------------------------------------------------------------------
     Photos: if a stock image fails, hide it so the frame's gradient shows
     ------------------------------------------------------------------ */
  const markFailed = (img) => img.classList.add('img-failed');
  $$('img').forEach((img) => {
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) markFailed(img);
    img.addEventListener('error', () => markFailed(img), { once: true });
  });

  /* ------------------------------------------------------------------
     Scrolling to anchors (works with or without ScrollSmoother)
     ------------------------------------------------------------------ */
  function scrollToHash(hash, instant) {
    const target = hash === '#top' ? 0 : $(hash);
    if (target === null) return false;
    if (smoother) {
      smoother.scrollTo(target, !instant, target === 0 ? undefined : 'top 90px');
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: instant || reduceMotion ? 'auto' : 'smooth' });
    } else {
      const y = target.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top: y, behavior: instant || reduceMotion ? 'auto' : 'smooth' });
    }
    return true;
  }

  /* ------------------------------------------------------------------
     Full-screen menu
     ------------------------------------------------------------------ */
  const menu = $('#menu');
  const toggle = $('.menu-toggle');
  let menuOpen = false;
  let menuTl = null;

  if (motion) {
    menuTl = gsap.timeline({
      paused: true,
      onReverseComplete: () => { menu.classList.remove('is-open'); header.classList.remove('menu-open'); },
    })
      .fromTo('.menu-bg', { clipPath: 'circle(0% at calc(100% - 70px) 60px)' }, { clipPath: 'circle(150% at calc(100% - 70px) 60px)', duration: 1.1, ease: 'expo.inOut' })
      .fromTo('.menu-links span, .menu-links i', { yPercent: 115 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.04 }, 0.45)
      .fromTo('.menu-aside > *', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 }, 0.55);
  }

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    if (smoother) smoother.paused(open);
    if (open) {
      menu.classList.add('is-open');
      header.classList.add('menu-open');
      if (menuTl) menuTl.timeScale(1).play();
    } else if (menuTl) {
      menuTl.timeScale(1.8).reverse();
    } else {
      menu.classList.remove('is-open');
      header.classList.remove('menu-open');
    }
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen));

  /* ------------------------------------------------------------------
     Links: same-page anchors glide; other pages get a curtain transition
     ------------------------------------------------------------------ */
  function leaveTo(href) {
    if (!motion) { window.location.href = href; return; }
    store.set('pharo-nav', '1');
    gsap.set(curtain, { visibility: 'visible' });
    gsap.fromTo(curtain, { scaleY: 0, transformOrigin: '50% 100%' }, {
      scaleY: 1, duration: 0.75, ease: 'expo.inOut',
      onComplete: () => { window.location.href = href; },
    });
    gsap.fromTo('.curtain-crown', { opacity: 0, y: 20 }, { opacity: 0.9, y: 0, duration: 0.5, delay: 0.35 });
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return;
    const url = new URL(link.getAttribute('href'), window.location.href);
    if (url.origin !== window.location.origin) return;

    const samePage = url.pathname === window.location.pathname;
    if (samePage) {
      if (url.hash && url.hash !== '#main') {
        e.preventDefault();
        const wasOpen = menuOpen;
        setMenu(false);
        setTimeout(() => scrollToHash(url.hash), wasOpen ? 300 : 0);
      }
      return;
    }
    if (!/(\.html|\/)$/.test(url.pathname)) return;
    e.preventDefault();
    setMenu(false);
    leaveTo(url.href);
  });

  // Returning with the back button restores a covered page from cache: uncover it.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    root.classList.remove('is-arriving');
    if (motion) gsap.set(curtain, { scaleY: 0, visibility: 'hidden' });
  });

  /* ------------------------------------------------------------------
     Booking drawer
     ------------------------------------------------------------------ */
  const drawer = $('#booking-drawer');
  let drawerOpen = false;
  let lastFocus = null;

  function setDrawer(open, room) {
    drawerOpen = open;
    drawer.classList.toggle('is-open', open);
    drawer.setAttribute('aria-hidden', String(!open));
    if (smoother) smoother.paused(open);
    else root.style.overflow = open ? 'hidden' : '';
    if (open) {
      lastFocus = document.activeElement;
      if (room) $('#bk-room').value = room;
      setTimeout(() => $('#bk-in').focus(), 350);
    } else if (lastFocus) {
      lastFocus.focus();
    }
  }
  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-book]');
    if (opener) {
      e.preventDefault();
      setMenu(false);
      setDrawer(true, opener.dataset.book);
      return;
    }
    if (e.target.closest('[data-close-drawer]')) setDrawer(false);
  });

  /* ------------------------------------------------------------------
     Dates & WhatsApp helpers
     ------------------------------------------------------------------ */
  const pad = (n) => String(n).padStart(2, '0');
  const toInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (v) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
  const nights = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const pretty = (v) => parse(v).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const today = new Date();

  const openWhatsApp = (text) => window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  const setNote = (el, msg, type) => {
    el.textContent = msg;
    el.classList.remove('is-error', 'is-success');
    if (type) el.classList.add('is-' + type);
  };
  $$('input[type="date"]').forEach((input) => { input.min = toInput(today); });

  /* ------------------------------------------------------------------
     Booking forms (reservation bar + drawer) -> WhatsApp
     ------------------------------------------------------------------ */
  $$('[data-book-form]').forEach((form) => {
    const inEl = form.elements.checkin;
    const outEl = form.elements.checkout;
    const note = $('.f-status', form);
    inEl.value = toInput(addDays(today, 7));
    outEl.value = toInput(addDays(today, 9));
    outEl.min = toInput(addDays(today, 1));
    inEl.addEventListener('change', () => {
      if (!inEl.value) return;
      const minOut = toInput(addDays(parse(inEl.value), 1));
      outEl.min = minOut;
      if (!outEl.value || outEl.value < minOut) outEl.value = minOut;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      [inEl, outEl].forEach((f) => { f.classList.remove('is-invalid'); f.closest('.rf-field, .f-field').classList.remove('is-invalid'); });
      const bad = (field, msg) => {
        field.classList.add('is-invalid');
        field.closest('.rf-field, .f-field').classList.add('is-invalid');
        setNote(note, msg, 'error');
        field.focus();
      };
      if (!inEl.value || inEl.value < inEl.min) return bad(inEl, 'Please choose an arrival date from today onwards.');
      if (!outEl.value || nights(inEl.value, outEl.value) < 1) return bad(outEl, 'Departure must be at least one night after arrival.');

      const n = nights(inEl.value, outEl.value);
      const name = form.elements.name && form.elements.name.value.trim();
      openWhatsApp(
        `Hello The Pharo, I'd like to check availability.\n` +
        (name ? `Name: ${name}\n` : '') +
        `Arrival: ${pretty(inEl.value)}\nDeparture: ${pretty(outEl.value)} (${n} night${n === 1 ? '' : 's'})\n` +
        `Guests: ${form.elements.guests.value}\nRoom: ${form.elements.room.value}`
      );
      setNote(note, `Opening WhatsApp… If nothing happens, call ${PHONE}.`, 'success');
    });
  });

  /* ------------------------------------------------------------------
     Enquiry forms -> WhatsApp or email
     ------------------------------------------------------------------ */
  $$('[data-enquiry-form]').forEach((form) => {
    const note = $('.f-status', form);
    let channel = 'whatsapp';
    $$('button[data-channel]', form).forEach((b) => b.addEventListener('click', () => { channel = b.dataset.channel; }));

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (e.submitter && e.submitter.dataset.channel) channel = e.submitter.dataset.channel;

      let firstBad = null;
      $$('[required]', form).forEach((field) => {
        const ok = field.value.trim() !== '';
        field.classList.toggle('is-invalid', !ok);
        field.setAttribute('aria-invalid', String(!ok));
        if (!ok && !firstBad) firstBad = field;
      });
      if (firstBad) {
        setNote(note, 'Please add your name and a phone number or email.', 'error');
        firstBad.focus();
        return;
      }

      const lines = [];
      let message = '';
      $$('input[name], select[name], textarea[name]', form).forEach((field) => {
        const value = field.value.trim();
        if (!value) return;
        if (field.name === 'message') { message = value; return; }
        const label = $(`label[for="${field.id}"]`, form);
        lines.push(`${label ? label.textContent.trim() : field.name}: ${field.type === 'date' ? pretty(value) : value}`);
      });
      if (message) lines.push('', message);

      const title = form.querySelector('h3') ? form.querySelector('h3').textContent.trim() : 'Enquiry';
      if (channel === 'email') {
        const subject = `${title}: ${form.elements.name.value.trim()}`;
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
        setNote(note, `Opening your email app… You can also write to ${EMAIL}.`, 'success');
      } else {
        openWhatsApp(`Hello The Pharo (${title.toLowerCase()}),\n${lines.join('\n')}`);
        setNote(note, `Opening WhatsApp… If nothing happens, call ${PHONE}.`, 'success');
      }
    });
    form.addEventListener('input', (e) => {
      if (e.target.classList.contains('is-invalid') && e.target.value.trim()) {
        e.target.classList.remove('is-invalid');
        e.target.removeAttribute('aria-invalid');
      }
    });
  });

  /* ------------------------------------------------------------------
     Dining venues (home): hover / tap swaps the photo
     ------------------------------------------------------------------ */
  const venues = $$('.venue');
  const venueImgs = $$('.venue-stage img');
  let activeVenue = 0;
  function setVenue(i) {
    if (i === activeVenue || !venueImgs[i]) return;
    activeVenue = i;
    venues.forEach((v, k) => v.classList.toggle('is-active', k === i));
    venueImgs.forEach((img, k) => img.classList.toggle('is-active', k === i));
    if (motion) gsap.fromTo(venueImgs[i], { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
  }
  venues.forEach((v, i) => {
    v.tabIndex = 0;
    v.setAttribute('role', 'button');
    v.addEventListener('mouseenter', () => setVenue(i));
    v.addEventListener('click', () => setVenue(i));
    v.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVenue(i); } });
  });

  /* ------------------------------------------------------------------
     Lightbox (gallery, room photos, collage)
     ------------------------------------------------------------------ */
  const lightbox = $('.lightbox');
  const lbImg = $('img', lightbox);
  const lbCap = $('figcaption', lightbox);
  let lbList = [];
  let lbIndex = 0;
  let lbOpen = false;

  const lbItems = [...$$('.m-item'), ...$$('.room-gallery .media'), ...$$('.collage-frame')];
  const groupOf = (el) => el.closest('.masonry, .room-gallery') || el;
  const visibleIn = (group) => lbItems.filter((el) => groupOf(el) === group && !el.classList.contains('is-hidden'));

  function showLightboxImage() {
    const img = $('img', lbList[lbIndex]);
    lbImg.src = (img.currentSrc || img.src).replace(/([?&])w=\d+/, '$1w=2000');
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt;
    if (motion) gsap.fromTo(lbImg, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' });
  }
  function openLightbox(el) {
    if ($('img', el).classList.contains('img-failed')) return;
    lbList = visibleIn(groupOf(el));
    lbIndex = Math.max(0, lbList.indexOf(el));
    lbOpen = true;
    lightbox.setAttribute('aria-hidden', 'false');
    $$('.lightbox-btn', lightbox).forEach((b) => { b.hidden = lbList.length < 2; });
    if (smoother) smoother.paused(true);
    if (motion) gsap.to(lightbox, { autoAlpha: 1, duration: 0.45 });
    else { lightbox.style.visibility = 'visible'; lightbox.style.opacity = '1'; }
    showLightboxImage();
    $('.lightbox-close').focus();
  }
  function closeLightbox() {
    if (!lbOpen) return;
    lbOpen = false;
    lightbox.setAttribute('aria-hidden', 'true');
    if (smoother && !drawerOpen && !menuOpen) smoother.paused(false);
    if (motion) gsap.to(lightbox, { autoAlpha: 0, duration: 0.35 });
    else { lightbox.style.visibility = 'hidden'; lightbox.style.opacity = '0'; }
  }
  const stepLightbox = (d) => { lbIndex = (lbIndex + d + lbList.length) % lbList.length; showLightboxImage(); };

  lbItems.forEach((el) => {
    el.dataset.cursor = 'View';
    if (el.tagName !== 'BUTTON') { el.tabIndex = 0; el.setAttribute('role', 'button'); }
    el.setAttribute('aria-label', 'Enlarge photo: ' + $('img', el).alt);
    el.addEventListener('click', () => openLightbox(el));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && el.tagName !== 'BUTTON') openLightbox(el); });
  });
  $('.lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(-1); });
  $('.lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(1); });
  lightbox.addEventListener('click', (e) => { if (!e.target.closest('.lightbox-figure img, .lightbox-btn')) closeLightbox(); });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLightbox(); if (drawerOpen) setDrawer(false); setMenu(false); }
    if (lbOpen && e.key === 'ArrowRight') stepLightbox(1);
    if (lbOpen && e.key === 'ArrowLeft') stepLightbox(-1);
  });

  /* ------------------------------------------------------------------
     Testimonials slider
     ------------------------------------------------------------------ */
  $$('[data-slider]').forEach((slider) => {
    const slides = $$('.t-slide', slider);
    const dotsWrap = $('.t-dots', slider);
    let current = 0;
    let timer = null;
    const dots = slides.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 't-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Review ${i + 1} of ${slides.length}`);
      dot.setAttribute('aria-selected', String(i === 0));
      dot.addEventListener('click', () => { show(i); restart(); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function show(i) {
      if (i === current) return;
      const prev = slides[current];
      const next = slides[i];
      if (motion) {
        gsap.to(prev, { autoAlpha: 0, y: -20, duration: 0.45, ease: 'power2.in', onComplete: () => prev.classList.remove('is-active') });
        next.classList.add('is-active');
        gsap.fromTo(next, { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 1, delay: 0.3, ease: 'expo.out' });
      } else {
        prev.classList.remove('is-active');
        next.classList.add('is-active');
      }
      dots.forEach((d, k) => d.setAttribute('aria-selected', String(k === i)));
      current = i;
    }
    const step = (d) => show((current + d + slides.length) % slides.length);
    function restart() {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(() => step(1), 7000);
    }
    $('[data-prev]', slider).addEventListener('click', () => { step(-1); restart(); });
    $('[data-next]', slider).addEventListener('click', () => { step(1); restart(); });
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', restart);
    restart();
  });

  /* ------------------------------------------------------------------
     Footer bits: year, live build stamp, test badge
     ------------------------------------------------------------------ */
  $$('[data-year]').forEach((el) => { el.textContent = today.getFullYear(); });
  const buildInfo = $('[data-build-info]');
  if (buildInfo) {
    fetch('version.json', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
      .then((v) => {
        const built = new Date(v.built).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
        buildInfo.textContent = `Build ${v.sha.slice(0, 7)} · ${built}`;
        buildInfo.title = `${v.ref} @ ${v.sha}`;
      })
      .catch(() => { buildInfo.textContent = 'Local preview'; });
  }
  const badge = $('#test-badge');
  if (store.get('pharo-hide-badge') === '1') badge.hidden = true;
  $('button', badge).addEventListener('click', () => { badge.hidden = true; store.set('pharo-hide-badge', '1'); });

  /* ------------------------------------------------------------------
     Without GSAP (or with reduced motion): static page, simple fallbacks
     ------------------------------------------------------------------ */
  if (!motion) {
    if (gate) gate.remove();
    store.set('pharo-gate-seen', '1');
    store.del('pharo-nav');
    root.classList.remove('is-arriving');
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    // Gallery filters without animation
    $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
      $$('.filter').forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
      $$('.m-item').forEach((it) => it.classList.toggle('is-hidden', btn.dataset.filter !== 'all' && it.dataset.cat !== btn.dataset.filter));
    }));
    if (window.location.hash) setTimeout(() => scrollToHash(window.location.hash, true), 50);
    return;
  }

  /* ==================================================================
     GSAP from here on
     ================================================================== */

  const { ScrollTrigger, SplitText } = window;
  gsap.registerPlugin(...[ScrollTrigger, window.ScrollSmoother, window.ScrollToPlugin, SplitText, window.DrawSVGPlugin, window.Flip].filter(Boolean));
  root.classList.add('gsap-on');
  const hasSplit = !!SplitText;
  const hasDraw = !!window.DrawSVGPlugin;

  if (window.ScrollSmoother) {
    smoother = window.ScrollSmoother.create({ wrapper: '#smooth-wrapper', content: '#smooth-content', smooth: 1.1, effects: true, smoothTouch: 0.1 });
  }

  /* ---------- Page intro: gate (first visit), curtain (between pages) or direct ---------- */

  const isHome = !!$('.hero');
  const gateVisible = gate && getComputedStyle(gate).display !== 'none';
  const arriving = root.classList.contains('is-arriving');
  store.del('pharo-nav');

  function heroIntro() {
    const tl = gsap.timeline();
    if (isHome) {
      tl.fromTo('.hero-slides', { scale: 1.25 }, { scale: 1, duration: 2.8, ease: 'expo.out' }, 0);
      if (hasSplit) {
        const split = SplitText.create('.hero-title', { type: 'chars' });
        tl.from(split.chars, { yPercent: 70, rotateX: -90, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 700, duration: 1.4, ease: 'expo.out', stagger: 0.035 }, 0.2);
      }
      tl.from('.hero-eyebrow', { opacity: 0, x: -30, duration: 1.2, ease: 'expo.out' }, 0.5)
        .from('.hero-sub', { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out' }, 0.8)
        .from('.hero-cta', { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out' }, 0.95)
        .from('.hero-arch', { opacity: 0, y: 80, duration: 1.8, ease: 'expo.out' }, 0.6)
        .from('.hero-pager', { opacity: 0, duration: 1 }, 1.3)
        .from('.reserve-form', { opacity: 0, y: 60, duration: 1.4, ease: 'expo.out' }, 1);
    } else if ($('.page-hero')) {
      tl.fromTo('.page-hero-media', { scale: 1.3 }, { scale: 1, duration: 2.6, ease: 'expo.out' }, 0);
      if (hasSplit) {
        const split = SplitText.create('.page-title', { type: 'chars' });
        tl.from(split.chars, { yPercent: 60, rotateX: -90, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 700, duration: 1.3, ease: 'expo.out', stagger: 0.03 }, 0.2);
      }
      tl.from('.crumbs, .page-hero .eyebrow', { opacity: 0, y: 20, duration: 1, ease: 'expo.out', stagger: 0.1 }, 0.35)
        .from('.page-lead', { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out' }, 0.7)
        .from('.page-hero-glyph', { opacity: 0, y: 60, duration: 2, ease: 'expo.out' }, 0.4);
    }
    tl.from('.header-inner', { opacity: 0, y: -30, duration: 1.2, ease: 'expo.out' }, 0.6)
      .from('.topbar', { opacity: 0, duration: 1 }, 0.8)
      .from('.scroll-cue', { opacity: 0, duration: 1 }, 1.4);
    return tl;
  }

  function afterIntro() {
    if (smoother) smoother.paused(false);
    ScrollTrigger.refresh();
    if (window.location.hash) scrollToHash(window.location.hash);
  }

  if (smoother) smoother.paused(true);

  if (gateVisible) {
    store.set('pharo-gate-seen', '1');
    const countEl = $('#gate-count');
    const counter = { v: 0 };
    const gateTl = gsap.timeline()
      .from('.gate-crown', { opacity: 0, y: -30, scale: 0.8, duration: 1.4, ease: 'expo.out' })
      .from('.gate-brand', { opacity: 0, letterSpacing: '0.9em', duration: 1.4, ease: 'expo.out' }, 0.2)
      .fromTo('.gate-sun', { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.3)
      .from('.door-glyphs span', { opacity: 0, y: 14, duration: 0.6, stagger: 0.05, ease: 'power2.out' }, 0.2)
      .to(counter, { v: 100, duration: 1.9, ease: 'power2.inOut', onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'); } }, 0);

    const firstImg = $('.hero-slide img, .page-hero-media img');
    const imgReady = new Promise((resolve) => {
      if (!firstImg || firstImg.complete) resolve();
      else { firstImg.addEventListener('load', resolve, { once: true }); firstImg.addEventListener('error', resolve, { once: true }); }
      setTimeout(resolve, 3500);
    });
    const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();

    Promise.all([imgReady, fontsReady, gateTl.then()]).then(() => {
      gsap.timeline({ onComplete: () => { gate.remove(); afterIntro(); } })
        .to('.gate-center', { opacity: 0, scale: 0.96, duration: 0.6, ease: 'power2.in' })
        .to('.gate-door--l', { rotateY: 100, duration: 1.8, ease: 'power3.inOut' }, '-=0.1')
        .to('.gate-door--r', { rotateY: -100, duration: 1.8, ease: 'power3.inOut' }, '<')
        .to(gate, { opacity: 0, duration: 0.6 }, '-=0.5')
        .add(heroIntro(), '-=1.6');
    });
  } else {
    if (gate) gate.remove();
    const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]) : Promise.resolve();
    fontsReady.then(() => {
      const tl = gsap.timeline({ onComplete: afterIntro });
      if (arriving) {
        tl.to(curtain, {
          scaleY: 0, transformOrigin: '50% 0%', duration: 0.9, ease: 'expo.inOut',
          onComplete: () => { root.classList.remove('is-arriving'); gsap.set(curtain, { visibility: 'hidden' }); },
        });
        tl.add(heroIntro(), '-=0.45');
      } else {
        tl.add(heroIntro());
      }
    });
  }

  /* ---------- Header, progress bar ---------- */

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      header.classList.toggle('is-scrolled', y > 60);
      if (!menuOpen) header.classList.toggle('is-hidden', self.direction === 1 && y > 600);
    },
  });
  gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  /* ---------- Home hero: slideshow, parallax, golden dust ---------- */

  if (isHome) {
    const slides = $$('.hero-slide');
    const bars = $$('.hero-bars span');
    const caption = $('.hero-caption');
    const HOLD = 6.5;
    let idx = 0;
    let barTween = null;

    const runBar = (i) => {
      barTween = gsap.fromTo(bars[i], { '--p': 0 }, { '--p': 1, duration: HOLD, ease: 'none', onComplete: () => go((idx + 1) % slides.length) });
    };
    function go(i) {
      const cur = slides[idx];
      const nxt = slides[i];
      bars.forEach((b, k) => gsap.set(b, { '--p': k < i ? 1 : 0 }));
      gsap.set(cur, { zIndex: 1 });
      gsap.set(nxt, { zIndex: 2 });
      nxt.classList.add('is-active');
      gsap.fromTo(nxt, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.6, ease: 'power2.inOut', onComplete: () => { cur.classList.remove('is-active'); gsap.set(cur, { autoAlpha: 0 }); } });
      gsap.fromTo($('img', nxt), { scale: 1.18 }, { scale: 1, duration: HOLD + 1.6, ease: 'none' });
      gsap.to(caption, { opacity: 0, y: -8, duration: 0.4, onComplete: () => { caption.textContent = nxt.dataset.caption; gsap.to(caption, { opacity: 1, y: 0, duration: 0.6 }); } });
      idx = i;
      runBar(i);
    }
    gsap.set(slides.slice(1), { autoAlpha: 0 });
    gsap.fromTo($('img', slides[0]), { scale: 1.18 }, { scale: 1, duration: HOLD + 1.6, ease: 'none' });
    runBar(0);
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: 'bottom top',
      onLeave: () => barTween && barTween.pause(),
      onEnterBack: () => barTween && barTween.resume(),
    });

    gsap.to('.hero-slides', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero-inner', { yPercent: -22, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true } });
    gsap.to('.hero-arch', { y: -120, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    (function goldDust() {
      const canvas = $('.hero-dust');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let w = 0; let h = 0; let raf = 0; let running = false; let particles = [];
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = canvas.clientWidth; h = canvas.clientHeight;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        particles = Array.from({ length: w < 700 ? 34 : 70 }, () => ({
          x: Math.random() * w, y: Math.random() * h, r: 0.4 + Math.random() * 1.6,
          vy: -(0.12 + Math.random() * 0.4), vx: (Math.random() - 0.5) * 0.15,
          a: 0.25 + Math.random() * 0.6, p: Math.random() * 1000,
        }));
      };
      const frame = (t) => {
        ctx.clearRect(0, 0, w, h);
        for (const q of particles) {
          q.y += q.vy;
          q.x += q.vx + Math.sin((t + q.p) / 1400) * 0.12;
          if (q.y < -5) { q.y = h + 5; q.x = Math.random() * w; }
          ctx.fillStyle = `rgba(232, 207, 152, ${(q.a * (0.55 + 0.45 * Math.sin(t / 650 + q.p))).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
          ctx.fill();
        }
        raf = requestAnimationFrame(frame);
      };
      const start = () => { if (!running) { running = true; raf = requestAnimationFrame(frame); } };
      const stop = () => { running = false; cancelAnimationFrame(raf); };
      resize();
      window.addEventListener('resize', resize);
      ScrollTrigger.create({ trigger: '.hero', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? start() : stop()) });
      start();
    })();
  }

  /* ---------- Inner page hero parallax ---------- */

  if ($('.page-hero')) {
    gsap.to('.page-hero-media img', { yPercent: 14, scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.page-hero-inner', { yPercent: -25, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom 25%', scrub: true } });
    gsap.to('.page-hero-glyph', { yPercent: -40, ease: 'none', scrollTrigger: { trigger: '.page-hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Big photos drift inside their frames ---------- */

  $$('.venue-row-media img, .exp-feature:not(.exp-feature--framed) .exp-media img, .ballroom-media img, .footer-cta-bg img, .testimonials-bg img, .stack-card img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -7, scale: 1.18 }, {
      yPercent: 7, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* ---------- Marquee: endless, reacts to scroll speed/direction ---------- */

  $$('.marquee-row').forEach((row) => {
    const track = $('.marquee-track', row);
    const clone = track.cloneNode(true);
    row.appendChild(clone);
    const loop = gsap.to([track, clone], { xPercent: -100, duration: 38, ease: 'none', repeat: -1 });
    const skew = gsap.quickTo(row, 'skewX', { duration: 0.6, ease: 'power3' });
    ScrollTrigger.create({
      trigger: row, start: 'top bottom', end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        gsap.to(loop, {
          timeScale: self.direction * (1 + Math.min(Math.abs(v) / 250, 6)), duration: 0.25, overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: self.direction, duration: 1.2 }),
        });
        skew(gsap.utils.clamp(-8, 8, v / -300));
      },
      onLeave: () => skew(0),
      onLeaveBack: () => skew(0),
    });
  });

  /* ---------- Text reveals ---------- */

  if (hasSplit) {
    $$('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          self.masks.forEach((m) => { m.style.paddingBottom = '.14em'; m.style.marginBottom = '-.14em'; });
          return gsap.from(self.lines, { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
        },
      });
    });
    $$('[data-scrub-words]').forEach((el) => {
      const split = SplitText.create(el, { type: 'words' });
      gsap.fromTo(split.words, { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });
  }

  const fadeTargets = $$([
    '.section-head .eyebrow', '.section-head .muted', '.eyebrow.center', '.intro-grid .lead-text', '.intro-grid .muted',
    '.palace-copy > :not(.h2)', '.chamber-intro p', '.stats li', '.venues', '.btn-row', '.center-cta', '.bento-item',
    '.room-copy > :not(.h2)', '.venue-row-copy > :not(.h2)', '.cuisine', '.menu-cta-card', '.highlight', '.ballroom-card',
    '.occasion', '.steps li', '.enquiry', '.exp-card > :not(.h2)', '.place', '.value', '.group-list li', '.story-copy > :not(.h2)',
    '.story-logo', '.c-card', '.contact-list li', '.map', '.faq details', '.rating', '.footer-main > *', '.footer-badges > *',
    '.finale-copy .eyebrow', '.finale-copy .btn', '.finale-crown', '.filters', '.cta-band-inner > div:first-child > :not(.h2)',
    '.footer-cta-inner > *', '.enquire-grid > div > :not(.h2):not(.enquire-media)', '.faq-grid > div > :not(.h2)',
  ].join(','));
  gsap.set(fadeTargets, { opacity: 0, y: 40 });
  ScrollTrigger.batch(fadeTargets, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 }),
  });

  /* ---------- Image reveals, winged suns, counters ---------- */

  $$('img[data-reveal]').forEach((img) => {
    const frame = img.parentElement;
    gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 88%', once: true } })
      .fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .fromTo(img, { scale: 1.4 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, '<0.2');
  });

  $$('.section-mark svg').forEach((svg) => {
    gsap.fromTo(svg, { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut', scrollTrigger: { trigger: svg, start: 'top 90%', once: true } });
  });

  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const obj = { v: end >= 1900 ? end - 30 : 0 };   // years count up from a nearby year
    el.textContent = obj.v.toFixed(decimals);
    gsap.to(obj, {
      v: end, duration: 2.4, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = obj.v.toFixed(decimals); },
    });
  });

  /* ---------- Home: rooms strip, rooftop reveal, stacking cards ---------- */

  const mm = gsap.matchMedia();

  if ($('.chambers')) {
    mm.add('(min-width: 1024px)', () => {
      const section = $('.chambers');
      const track = $('.chambers-track');
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const slide = gsap.to(track, {
        x: () => -distance(), ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 },
      });
      gsap.to('.chambers-bar span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), scrub: true, invalidateOnRefresh: true } });
      $$('.chamber').forEach((card) => {
        gsap.fromTo($('img', card), { xPercent: -7 }, { xPercent: 7, ease: 'none', scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true } });
      });
    });
  }

  if ($('.oasis')) {
    gsap.timeline({ scrollTrigger: { trigger: '.oasis', start: 'top top', end: '+=120%', pin: true, scrub: 1, anticipatePin: 1 } })
      .fromTo('.oasis-media', { clipPath: 'inset(20% 26% 20% 26% round 400px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' })
      .fromTo('.oasis-media img', { scale: 1.35 }, { scale: 1, ease: 'none' }, 0)
      .fromTo('.oasis-shade', { opacity: 0 }, { opacity: 1, ease: 'none' }, 0)
      .from('.oasis-copy > *', { y: 60, opacity: 0, stagger: 0.1, ease: 'power2.out' }, 0.45);
  }

  if ($('.stack')) {
    mm.add('(min-width: 861px)', () => {
      const cards = $$('.stack-card');
      cards.forEach((card, i) => {
        const next = cards[i + 1];
        if (!next) return;
        ScrollTrigger.create({ trigger: card, start: 'top 110px', endTrigger: cards[cards.length - 1], end: 'top 110px', pin: true, pinSpacing: false });
        gsap.to(card, { scale: 0.9, '--dim': 0.6, ease: 'none', scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 110px', scrub: true } });
      });
    });
  }

  if (!finePointer && venues.length) {
    venues.forEach((v, i) => ScrollTrigger.create({ trigger: v, start: 'top 65%', end: 'bottom 65%', onToggle: (s) => { if (s.isActive) setVenue(i); } }));
  }

  /* ---------- Amenity icons draw themselves ---------- */

  const amenities = $$('.amenities li');
  if (amenities.length) {
    gsap.set(amenities, { opacity: 0, y: 30 });
    if (hasDraw) gsap.set($$('.amenities svg *'), { drawSVG: '0%' });
    ScrollTrigger.batch(amenities, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => batch.forEach((li, i) => {
        gsap.to(li, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', delay: i * 0.08 });
        if (hasDraw) gsap.to($$('svg *', li), { drawSVG: '100%', duration: 1.8, ease: 'power2.inOut', delay: 0.2 + i * 0.08 });
      }),
    });
  }

  /* ---------- Gallery: reveal and animated filtering ---------- */

  const mItems = $$('.m-item');
  if (mItems.length) {
    gsap.set(mItems, { opacity: 0, scale: 0.94 });
    ScrollTrigger.batch(mItems, { start: 'top 94%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, scale: 1, duration: 1.2, ease: 'expo.out', stagger: 0.07 }) });

    $$('.filter').forEach((btn) => btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      $$('.filter').forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
      gsap.set(mItems, { opacity: 1, scale: 1 });   // make sure not-yet-revealed tiles can show
      const state = window.Flip ? window.Flip.getState(mItems) : null;
      mItems.forEach((it) => it.classList.toggle('is-hidden', f !== 'all' && it.dataset.cat !== f));
      const done = () => ScrollTrigger.refresh();
      if (state) {
        window.Flip.from(state, {
          duration: 0.9, ease: 'expo.inOut', scale: true, absolute: true, onComplete: done,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' }),
          onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.4 }),
        });
      } else {
        done();
      }
    }));
  }

  /* ---------- Finale and footer ---------- */

  if ($('.finale')) {
    gsap.timeline({ scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom bottom', scrub: 1 } })
      .fromTo('.py-sun', { y: 170 }, { y: -30, ease: 'none' }, 0)
      .fromTo('.pyramids', { scale: 1.15, transformOrigin: '50% 100%' }, { scale: 1, ease: 'none' }, 0)
      .fromTo('.py-edge', hasDraw ? { drawSVG: '50% 50%' } : { opacity: 0 }, hasDraw ? { drawSVG: '0% 100%', ease: 'none' } : { opacity: 1, ease: 'none' }, 0.15);
    gsap.to('.py-stars circle', { opacity: 0.15, duration: 'random(1, 2.6)', repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: { each: 0.25, from: 'random' } });
  }
  gsap.fromTo('.footer-giant', { xPercent: -8, opacity: 0.4 }, { xPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.footer-giant', start: 'top bottom', end: 'bottom bottom', scrub: true } });

  $$('.faq details').forEach((d) => d.addEventListener('toggle', () => ScrollTrigger.refresh()));

  /* ---------- Cursor + magnetic buttons (mouse only) ---------- */

  if (finePointer) {
    const cursor = $('.cursor');
    const dot = $('.cursor-dot');
    const ring = $('.cursor-ring');
    const label = $('.cursor-label');
    gsap.set([dot, ring], { opacity: 0 });
    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.55, ease: 'power3' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.55, ease: 'power3' });
    let shown = false;

    $$('.bento-item, .occasion, .chamber-media').forEach((el) => { el.dataset.cursor = 'Explore'; });

    window.addEventListener('mousemove', (e) => {
      if (!shown) { shown = true; gsap.to([dot, ring], { opacity: 1, duration: 0.4 }); }
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
    });
    document.addEventListener('mouseleave', () => { shown = false; gsap.to([dot, ring], { opacity: 0, duration: 0.3 }); });
    document.addEventListener('mouseover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const interactive = e.target.closest('a, button, .venue, select, input, textarea, label, summary');
      cursor.classList.toggle('has-label', !!labelled);
      cursor.classList.toggle('is-hover', !!interactive && !labelled);
      label.textContent = labelled ? labelled.dataset.cursor : '';
    });

    $$('.magnetic').forEach((el) => {
      const x = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' });
      const y = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.3);
        y((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener('mouseleave', () => { x(0); y(0); });
    });
  }

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
