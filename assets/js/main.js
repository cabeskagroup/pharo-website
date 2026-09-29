/* The Pharo — interactions and GSAP motion.
   Everything degrades gracefully: without GSAP (or with reduced motion) the
   page is a normal, fully readable site with working forms. */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const WHATSAPP = '94706696663';
  const EMAIL = 'info@thepharo.lk';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const gsap = window.gsap;

  const header = $('.site-header');
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
     Smooth anchor navigation (works with or without ScrollSmoother)
     ------------------------------------------------------------------ */
  const scrollToHash = (hash) => {
    const target = hash === '#top' ? 0 : $(hash);
    if (target === null) return false;
    if (smoother) {
      smoother.scrollTo(target, true, target === 0 ? undefined : 'top 80px');
    } else if (hasGSAP && window.ScrollToPlugin && !reduceMotion) {
      gsap.to(window, { scrollTo: { y: target, offsetY: 80, autoKill: true }, duration: 1.4, ease: 'expo.inOut' });
    } else if (target === 0) {
      window.scrollTo(0, 0);
    } else {
      target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    return true;
  };

  /* ------------------------------------------------------------------
     Full-screen menu
     ------------------------------------------------------------------ */
  const menu = $('#menu');
  const toggle = $('.menu-toggle');
  let menuOpen = false;
  let menuTl = null;

  if (hasGSAP && !reduceMotion) {
    menuTl = gsap.timeline({
      paused: true,
      onReverseComplete: () => {
        menu.classList.remove('is-open');
        header.classList.remove('menu-open');
      },
    })
      .fromTo('.menu-bg',
        { clipPath: 'circle(0% at calc(100% - 70px) 42px)' },
        { clipPath: 'circle(150% at calc(100% - 70px) 42px)', duration: 1.1, ease: 'expo.inOut' })
      .fromTo('.menu-links span, .menu-links i',
        { yPercent: 115 },
        { yPercent: 0, duration: 1, ease: 'expo.out', stagger: 0.04 }, 0.45)
      .fromTo('.menu-aside > *',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.06 }, 0.6);
  }

  const setMenu = (open) => {
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
      menuTl.timeScale(1.6).reverse();
    } else {
      menu.classList.remove('is-open');
      header.classList.remove('menu-open');
    }
  };

  toggle.addEventListener('click', () => setMenu(!menuOpen));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { setMenu(false); closeLightbox(); }
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (hash.length < 2 || hash === '#main') return;
    e.preventDefault();
    const wasOpen = menuOpen;
    setMenu(false);
    // Let the menu start closing before the page glides away.
    setTimeout(() => scrollToHash(hash), wasOpen ? 250 : 0);
  });

  /* ------------------------------------------------------------------
     Date helpers
     ------------------------------------------------------------------ */
  const pad = (n) => String(n).padStart(2, '0');
  const toInput = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (v) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
  const nights = (a, b) => Math.round((parse(b) - parse(a)) / 86400000);
  const pretty = (v) => parse(v).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  const openWhatsApp = (text) => {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  /* ------------------------------------------------------------------
     Reservation bar -> WhatsApp
     ------------------------------------------------------------------ */
  const rf = $('#reserve-form');
  const rfIn = $('#rf-in');
  const rfOut = $('#rf-out');
  const rfNote = $('.rf-note', rf);
  const today = new Date();

  rfIn.min = toInput(today);
  rfOut.min = toInput(addDays(today, 1));
  rfIn.value = toInput(addDays(today, 7));
  rfOut.value = toInput(addDays(today, 9));
  rfIn.addEventListener('change', () => {
    if (!rfIn.value) return;
    const minOut = toInput(addDays(parse(rfIn.value), 1));
    rfOut.min = minOut;
    if (!rfOut.value || rfOut.value < minOut) rfOut.value = minOut;
  });

  const setNote = (el, msg, type) => {
    el.textContent = msg;
    el.classList.remove('is-error', 'is-success');
    if (type) el.classList.add('is-' + type);
  };

  rf.addEventListener('submit', (e) => {
    e.preventDefault();
    $$('.rf-field', rf).forEach((f) => f.classList.remove('is-invalid'));
    if (!rfIn.value || rfIn.value < rfIn.min) {
      rfIn.closest('.rf-field').classList.add('is-invalid');
      return setNote(rfNote, 'Please choose an arrival date from today onwards.', 'error');
    }
    if (!rfOut.value || nights(rfIn.value, rfOut.value) < 1) {
      rfOut.closest('.rf-field').classList.add('is-invalid');
      return setNote(rfNote, 'Departure must be at least one night after arrival.', 'error');
    }
    const n = nights(rfIn.value, rfOut.value);
    const guests = $('#rf-guests').selectedOptions[0].textContent;
    const room = $('#rf-room').value;
    openWhatsApp(
      `Hello The Pharo, I'd like to check availability.\n` +
      `Arrival: ${pretty(rfIn.value)}\nDeparture: ${pretty(rfOut.value)} (${n} night${n === 1 ? '' : 's'})\n` +
      `Guests: ${guests}\nRoom: ${room}`
    );
    setNote(rfNote, 'Opening WhatsApp… If nothing happens, call +94 70 669 6663.', 'success');
  });

  // "Reserve" buttons on room cards preselect that room.
  $$('[data-room]').forEach((btn) => {
    btn.addEventListener('click', () => { $('#rf-room').value = btn.dataset.room; });
  });

  /* ------------------------------------------------------------------
     Enquiry form -> WhatsApp or email
     ------------------------------------------------------------------ */
  const enquiry = $('#enquiry-form');
  const eStatus = $('.f-status', enquiry);
  let channel = 'whatsapp';
  $$('button[data-channel]', enquiry).forEach((b) => b.addEventListener('click', () => { channel = b.dataset.channel; }));
  $('#e-date').min = toInput(today);

  enquiry.addEventListener('submit', (e) => {
    e.preventDefault();
    if (e.submitter && e.submitter.dataset.channel) channel = e.submitter.dataset.channel;

    let firstBad = null;
    $$('[required]', enquiry).forEach((field) => {
      const ok = field.value.trim() !== '';
      field.classList.toggle('is-invalid', !ok);
      field.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = field;
    });
    if (firstBad) {
      setNote(eStatus, 'Please add your name and a phone number or email.', 'error');
      firstBad.focus();
      return;
    }

    const name = $('#e-name').value.trim();
    const lines = [
      `Name: ${name}`,
      `Contact: ${$('#e-phone').value.trim()}`,
      `Enquiring about: ${$('#e-type').value}`,
    ];
    if ($('#e-date').value) lines.push(`Preferred date: ${pretty($('#e-date').value)}`);
    if ($('#e-msg').value.trim()) lines.push('', $('#e-msg').value.trim());

    if (channel === 'email') {
      const subject = `Enquiry: ${$('#e-type').value} (${name})`;
      window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
      setNote(eStatus, `Opening your email app… You can also write to ${EMAIL}.`, 'success');
    } else {
      openWhatsApp(`Hello The Pharo,\n${lines.join('\n')}`);
      setNote(eStatus, 'Opening WhatsApp… If nothing happens, call +94 70 669 6663.', 'success');
    }
  });
  enquiry.addEventListener('input', (e) => {
    if (e.target.classList.contains('is-invalid') && e.target.value.trim()) {
      e.target.classList.remove('is-invalid');
      e.target.removeAttribute('aria-invalid');
    }
  });

  /* ------------------------------------------------------------------
     Dining venues: hover / tap / scroll swaps the photo
     ------------------------------------------------------------------ */
  const venues = $$('.venue');
  const venueImgs = $$('.venue-stage img');
  let activeVenue = 0;
  const setVenue = (i) => {
    if (i === activeVenue) return;
    activeVenue = i;
    venues.forEach((v, k) => v.classList.toggle('is-active', k === i));
    venueImgs.forEach((img, k) => img.classList.toggle('is-active', k === i));
    if (hasGSAP && !reduceMotion) gsap.fromTo(venueImgs[i], { scale: 1.12 }, { scale: 1, duration: 1.6, ease: 'expo.out' });
  };
  venues.forEach((v, i) => {
    v.tabIndex = 0;
    v.setAttribute('role', 'button');
    v.addEventListener('mouseenter', () => setVenue(i));
    v.addEventListener('click', () => setVenue(i));
    v.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setVenue(i); } });
  });

  /* ------------------------------------------------------------------
     Gallery lightbox
     ------------------------------------------------------------------ */
  const lightbox = $('.lightbox');
  const lbImg = $('img', lightbox);
  let lbOpen = false;

  function openLightbox(img) {
    if (img.classList.contains('img-failed')) return;
    lbImg.src = (img.currentSrc || img.src).replace(/([?&])w=\d+/, '$1w=2000');
    lbImg.alt = img.alt;
    lbOpen = true;
    lightbox.setAttribute('aria-hidden', 'false');
    if (smoother) smoother.paused(true);
    if (hasGSAP && !reduceMotion) {
      gsap.to(lightbox, { autoAlpha: 1, duration: 0.5, ease: 'power2.out' });
      gsap.fromTo(lbImg, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: 'expo.out', delay: 0.1 });
    } else {
      lightbox.style.visibility = 'visible';
      lightbox.style.opacity = '1';
    }
    $('.lightbox-close').focus();
  }
  function closeLightbox() {
    if (!lbOpen) return;
    lbOpen = false;
    lightbox.setAttribute('aria-hidden', 'true');
    if (smoother) smoother.paused(false);
    if (hasGSAP && !reduceMotion) gsap.to(lightbox, { autoAlpha: 0, duration: 0.4 });
    else { lightbox.style.visibility = 'hidden'; lightbox.style.opacity = '0'; }
  }
  $$('.g-item').forEach((btn) => {
    btn.dataset.cursor = 'View';
    btn.setAttribute('aria-label', 'Enlarge photo: ' + $('img', btn).alt);
    btn.addEventListener('click', () => openLightbox($('img', btn)));
  });
  lightbox.addEventListener('click', (e) => { if (e.target !== lbImg) closeLightbox(); });

  /* ------------------------------------------------------------------
     Footer bits: year, live build stamp, test badge
     ------------------------------------------------------------------ */
  $('#year').textContent = new Date().getFullYear();

  // version.json is written by the GitHub Pages workflow.
  const buildInfo = $('#build-info');
  fetch('version.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status))))
    .then((v) => {
      const built = new Date(v.built).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      buildInfo.textContent = `Build ${v.sha.slice(0, 7)} · ${built}`;
      buildInfo.title = `${v.ref} @ ${v.sha}`;
    })
    .catch(() => { buildInfo.textContent = 'Local preview'; });

  const badge = $('#test-badge');
  try { if (sessionStorage.getItem('pharo-hide-badge') === '1') badge.hidden = true; } catch (_) { /* no storage */ }
  $('button', badge).addEventListener('click', () => {
    badge.hidden = true;
    try { sessionStorage.setItem('pharo-hide-badge', '1'); } catch (_) { /* ignore */ }
  });

  /* ------------------------------------------------------------------
     No GSAP or reduced motion: simple, static page
     ------------------------------------------------------------------ */
  const gate = $('.gate');

  if (!hasGSAP || reduceMotion) {
    if (gate) gate.remove();
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 60);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return;
  }

  /* ==================================================================
     GSAP from here on
     ================================================================== */

  gsap.registerPlugin(...[window.ScrollTrigger, window.ScrollSmoother, window.ScrollToPlugin, window.SplitText, window.DrawSVGPlugin].filter(Boolean));
  const { ScrollTrigger, SplitText } = window;
  document.documentElement.classList.add('gsap-on');
  const hasSplit = !!SplitText;
  const hasDraw = !!window.DrawSVGPlugin;

  if (window.ScrollSmoother) {
    smoother = window.ScrollSmoother.create({
      wrapper: '#smooth-wrapper',
      content: '#smooth-content',
      smooth: 1.1,
      effects: true,
      smoothTouch: 0.1,
    });
  }

  /* ---------- Temple gate intro ---------- */

  if (smoother) smoother.paused(true);
  const countEl = $('#gate-count');
  const counter = { v: 0 };

  const gateIntro = gsap.timeline()
    .fromTo('.gate-sun', { clipPath: 'inset(0% 50% 0% 50%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut' })
    .from('.gate-brand', { opacity: 0, letterSpacing: '1.2em', duration: 1.4, ease: 'expo.out' }, 0.35)
    .from('.door-glyphs span', { opacity: 0, y: 14, duration: 0.6, stagger: 0.05, ease: 'power2.out' }, 0.2)
    .to(counter, {
      v: 100,
      duration: 1.9,
      ease: 'power2.inOut',
      onUpdate: () => { countEl.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
    }, 0);

  const heroImg = $('.hero-media img');
  const heroReady = new Promise((resolve) => {
    if (heroImg.complete) resolve();
    heroImg.addEventListener('load', resolve, { once: true });
    heroImg.addEventListener('error', resolve, { once: true });
    setTimeout(resolve, 3500);
  });
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();

  const heroIntro = () => {
    const tl = gsap.timeline();
    tl.fromTo('.hero-media', { scale: 1.3 }, { scale: 1, duration: 2.8, ease: 'expo.out' }, 0);
    if (hasSplit) {
      const title = SplitText.create('.hero-title', { type: 'chars' });
      tl.from(title.chars, {
        yPercent: 70, rotateX: -90, opacity: 0, transformOrigin: '50% 100%', transformPerspective: 700,
        duration: 1.4, ease: 'expo.out', stagger: 0.035,
      }, 0.2);
    } else {
      tl.from('.hero-title', { opacity: 0, y: 40, duration: 1.2, ease: 'expo.out' }, 0.2);
    }
    tl.from('.hero-eyebrow', { opacity: 0, x: -30, duration: 1.2, ease: 'expo.out' }, 0.5)
      .from('.hero-sub', { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out' }, 0.8)
      .from('.hero-cta', { opacity: 0, y: 30, duration: 1.2, ease: 'expo.out' }, 0.95)
      .from('.cartouche', { opacity: 0, y: 40, duration: 1.4, ease: 'expo.out' }, 0.6)
      .from('.cartouche span', { opacity: 0, y: -16, duration: 0.8, stagger: 0.12, ease: 'power3.out' }, 0.9)
      .from('.reserve-form', { opacity: 0, y: 60, duration: 1.4, ease: 'expo.out' }, 1)
      .from('.header-inner', { opacity: 0, y: -30, duration: 1.2, ease: 'expo.out' }, 0.7)
      .from('.scroll-cue', { opacity: 0, duration: 1 }, 1.5);
    return tl;
  };

  Promise.all([heroReady, fontsReady, gateIntro.then()]).then(() => {
    gsap.timeline({
      onComplete: () => {
        if (gate) gate.remove();
        if (smoother) smoother.paused(false);
        ScrollTrigger.refresh();
      },
    })
      .to('.gate-center', { opacity: 0, scale: 0.96, duration: 0.6, ease: 'power2.in' })
      .to('.gate-door--l', { rotateY: 100, duration: 1.8, ease: 'power3.inOut' }, '-=0.1')
      .to('.gate-door--r', { rotateY: -100, duration: 1.8, ease: 'power3.inOut' }, '<')
      .to(gate, { opacity: 0, duration: 0.6 }, '-=0.5')
      .add(heroIntro(), '-=1.6');
  });

  /* ---------- Header, progress bar, active nav ---------- */

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

  $$('.nav a').forEach((link) => {
    const section = $(link.getAttribute('href'));
    if (!section) return;
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onToggle: (self) => link.classList.toggle('is-active', self.isActive),
    });
  });

  /* ---------- Hero parallax + golden dust ---------- */

  gsap.to('.hero-media img', {
    yPercent: 14, scale: 1.1, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to('.hero-inner', {
    yPercent: -22, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true },
  });
  gsap.to('.cartouche', {
    y: -140, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 30%', scrub: true },
  });

  (function goldDust() {
    const canvas = $('.hero-dust');
    const ctx = canvas.getContext('2d');
    let w = 0; let h = 0; let raf = 0; let running = false;
    let particles = [];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = w < 700 ? 34 : 70;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.6,
        vy: -(0.12 + Math.random() * 0.4),
        vx: (Math.random() - 0.5) * 0.15,
        a: 0.25 + Math.random() * 0.6,
        p: Math.random() * 1000,
      }));
    };

    const frame = (t) => {
      ctx.clearRect(0, 0, w, h);
      for (const q of particles) {
        q.y += q.vy;
        q.x += q.vx + Math.sin((t + q.p) / 1400) * 0.12;
        if (q.y < -5) { q.y = h + 5; q.x = Math.random() * w; }
        const alpha = q.a * (0.55 + 0.45 * Math.sin(t / 650 + q.p));
        ctx.fillStyle = `rgba(232, 207, 152, ${alpha.toFixed(3)})`;
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
    ScrollTrigger.create({
      trigger: '.hero',
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => (self.isActive ? start() : stop()),
    });
    start();
  })();

  /* ---------- Marquee: endless, reacts to scroll speed/direction ---------- */

  (function marquee() {
    const row = $('.marquee-row');
    const track = $('.marquee-track');
    if (!row || !track) return;
    const clone = track.cloneNode(true);
    row.appendChild(clone);
    const loop = gsap.to([track, clone], { xPercent: -100, duration: 38, ease: 'none', repeat: -1 });
    const skew = gsap.quickTo(row, 'skewX', { duration: 0.6, ease: 'power3' });
    ScrollTrigger.create({
      trigger: '.marquee',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const v = self.getVelocity();
        const boost = Math.min(Math.abs(v) / 250, 6);
        gsap.to(loop, {
          timeScale: self.direction * (1 + boost),
          duration: 0.25,
          overwrite: true,
          onComplete: () => gsap.to(loop, { timeScale: self.direction, duration: 1.2 }),
        });
        skew(gsap.utils.clamp(-8, 8, v / -300));
      },
      onLeave: () => skew(0),
      onLeaveBack: () => skew(0),
    });
  })();

  /* ---------- Text reveals ---------- */

  if (hasSplit) {
    // Headings: lines rise out of a mask.
    $$('[data-split]').forEach((el) => {
      SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        onSplit(self) {
          // Give masks room for italic descenders without shifting layout.
          self.masks.forEach((m) => { m.style.paddingBottom = '.14em'; m.style.marginBottom = '-.14em'; });
          return gsap.from(self.lines, {
            yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.12,
            scrollTrigger: { trigger: el, start: 'top 86%', once: true },
          });
        },
      });
    });

    // Statement: words light up as you scroll.
    $$('[data-scrub-words]').forEach((el) => {
      const split = SplitText.create(el, { type: 'words' });
      gsap.fromTo(split.words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
      });
    });
  }

  // Everything else fades up in small batches as it enters.
  const fadeTargets = [
    '.section-head .eyebrow', '.section-head .muted', '.eyebrow.center',
    '.kg-copy p', '.kg-copy .link-arrow', '.chamber-intro p', '.stats li',
    '.venues', '.center-cta', '.contact-list li', '.map', '.enquiry',
    '.accolade', '.footer-top > *', '.finale-copy .eyebrow', '.finale-copy .btn',
  ].join(',');
  gsap.set(fadeTargets, { opacity: 0, y: 40 });
  ScrollTrigger.batch(fadeTargets, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09 }),
  });

  /* ---------- Image reveals ---------- */

  $$('img[data-reveal]').forEach((img) => {
    const frame = img.parentElement;
    gsap.timeline({ scrollTrigger: { trigger: frame, start: 'top 88%', once: true } })
      .fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' })
      .fromTo(img, { scale: 1.4 }, { scale: 1, duration: 2.2, ease: 'expo.out' }, '<0.2');
  });

  // Winged suns spread their wings.
  $$('.section-mark svg, .accolade-sun svg').forEach((svg) => {
    gsap.fromTo(svg, { clipPath: 'inset(0% 50% 0% 50%)' }, {
      clipPath: 'inset(0% 0% 0% 0%)', duration: 1.8, ease: 'expo.inOut',
      scrollTrigger: { trigger: svg, start: 'top 90%', once: true },
    });
  });

  /* ---------- Counters ---------- */

  $$('[data-count]').forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const obj = { v: 0 };
    el.textContent = (0).toFixed(decimals);
    gsap.to(obj, {
      v: end, duration: 2.4, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => { el.textContent = obj.v.toFixed(decimals); },
    });
  });

  /* ---------- Responsive, motion-heavy sections ---------- */

  const mm = gsap.matchMedia();

  // Royal Chambers: pinned horizontal gallery on large screens.
  mm.add('(min-width: 1024px)', () => {
    const section = $('.chambers');
    const track = $('.chambers-track');
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);

    const slide = gsap.to(track, {
      x: () => -distance(),
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => '+=' + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
    gsap.to('.chambers-bar span', {
      scaleX: 1, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: () => '+=' + distance(), scrub: true, invalidateOnRefresh: true },
    });
    $$('.chamber').forEach((card) => {
      gsap.fromTo($('img', card), { xPercent: -7 }, {
        xPercent: 7, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left right', end: 'right left', scrub: true },
      });
      gsap.from($('.chamber-body', card).children, {
        opacity: 0, y: 30, stagger: 0.08, duration: 1, ease: 'expo.out',
        scrollTrigger: { trigger: card, containerAnimation: slide, start: 'left 80%', once: true },
      });
    });
  });

  // Rooftop Oasis: the photo opens from a golden window to full screen.
  mm.add('all', () => {
    gsap.timeline({
      scrollTrigger: { trigger: '.oasis', start: 'top top', end: '+=120%', pin: true, scrub: 1, anticipatePin: 1 },
    })
      .fromTo('.oasis-media',
        { clipPath: 'inset(20% 26% 20% 26% round 400px)' },
        { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' })
      .fromTo('.oasis-media img', { scale: 1.35 }, { scale: 1, ease: 'none' }, 0)
      .fromTo('.oasis-shade', { opacity: 0 }, { opacity: 1, ease: 'none' }, 0)
      .from('.oasis-copy > *', { y: 60, opacity: 0, stagger: 0.1, ease: 'power2.out' }, 0.45);
  });

  // Celebrations: cards stack as you scroll (tablet and up).
  mm.add('(min-width: 861px)', () => {
    const cards = $$('.stack-card');
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      ScrollTrigger.create({
        trigger: card,
        start: 'top 110px',
        endTrigger: cards[cards.length - 1],
        end: 'top 110px',
        pin: true,
        pinSpacing: false,
      });
      gsap.to(card, {
        scale: 0.9, '--dim': 0.6, ease: 'none',
        scrollTrigger: { trigger: next, start: 'top bottom', end: 'top 110px', scrub: true },
      });
    });
  });
  $$('.stack-card img').forEach((img) => {
    gsap.fromTo(img, { yPercent: -6, scale: 1.15 }, {
      yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: img.closest('.stack-card'), start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  // Dining: on touch screens the photo follows the venue you've scrolled to.
  if (!finePointer) {
    venues.forEach((v, i) => ScrollTrigger.create({
      trigger: v, start: 'top 65%', end: 'bottom 65%',
      onToggle: (self) => { if (self.isActive) setVenue(i); },
    }));
  }

  /* ---------- Amenity icons draw themselves ---------- */

  const amenities = $$('.amenities li');
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

  /* ---------- Gallery tiles ---------- */

  gsap.set('.g-item', { opacity: 0, scale: 0.94 });
  ScrollTrigger.batch('.g-item', {
    start: 'top 92%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, scale: 1, duration: 1.4, ease: 'expo.out', stagger: 0.1 }),
  });

  /* ---------- Finale: the sun rises behind the pyramids ---------- */

  gsap.timeline({ scrollTrigger: { trigger: '.finale', start: 'top bottom', end: 'bottom bottom', scrub: 1 } })
    .fromTo('.py-sun', { y: 170 }, { y: -30, ease: 'none' }, 0)
    .fromTo('.pyramids', { scale: 1.15, transformOrigin: '50% 100%' }, { scale: 1, ease: 'none' }, 0)
    .fromTo('.py-edge', hasDraw ? { drawSVG: '50% 50%' } : { opacity: 0 }, hasDraw ? { drawSVG: '0% 100%', ease: 'none' } : { opacity: 1, ease: 'none' }, 0.15);
  gsap.to('.py-stars circle', {
    opacity: 0.15, duration: 'random(1, 2.6)', repeat: -1, yoyo: true, ease: 'sine.inOut',
    stagger: { each: 0.25, from: 'random' },
  });

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

    window.addEventListener('mousemove', (e) => {
      if (!shown) { shown = true; gsap.to([dot, ring], { opacity: 1, duration: 0.4 }); }
      dotX(e.clientX); dotY(e.clientY); ringX(e.clientX); ringY(e.clientY);
    });
    document.addEventListener('mouseleave', () => { shown = false; gsap.to([dot, ring], { opacity: 0, duration: 0.3 }); });
    document.addEventListener('mouseover', (e) => {
      const labelled = e.target.closest('[data-cursor]');
      const interactive = e.target.closest('a, button, .venue, select, input, textarea, label');
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
