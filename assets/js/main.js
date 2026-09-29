/* Pharo Hotel — site behaviour (no dependencies) */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Header: solid background once the page scrolls ---------- */

  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */

  const toggle = $('.nav-toggle');
  const menu = $('#nav-menu');

  const setMenu = (open) => {
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Highlight the nav link for the section in view ---------- */

  const navLinks = $$('.nav-menu a:not(.btn)');
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => link.classList.toggle('is-active', link.hash === '#' + entry.target.id));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach((link) => {
      const section = document.querySelector(link.hash);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Date helpers (local time, YYYY-MM-DD) ---------- */

  const pad = (n) => String(n).padStart(2, '0');
  const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseDate = (v) => { const [y, m, d] = v.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
  const nightsBetween = (from, to) => Math.round((parseDate(to) - parseDate(from)) / 86400000);
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  const setStatus = (el, message, type) => {
    el.textContent = message;
    el.className = 'form-status' + (el.classList.contains('full') ? ' full' : '') + (type ? ' is-' + type : '');
  };

  // Keep a check-out field at least one night after its check-in field.
  const linkDates = (inEl, outEl) => {
    const today = new Date();
    inEl.min = toInputDate(today);
    outEl.min = toInputDate(addDays(today, 1));
    inEl.addEventListener('change', () => {
      if (!inEl.value) return;
      const minOut = toInputDate(addDays(parseDate(inEl.value), 1));
      outEl.min = minOut;
      if (!outEl.value || outEl.value < minOut) outEl.value = minOut;
    });
  };

  /* ---------- Quick booking bar (demo: no live availability yet) ---------- */

  const booking = $('#booking-form');
  const checkin = $('#checkin');
  const checkout = $('#checkout');
  const today = new Date();

  linkDates(checkin, checkout);
  checkin.value = toInputDate(addDays(today, 7));
  checkout.value = toInputDate(addDays(today, 10));

  booking.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = $('.form-status', booking);

    if (!checkin.value || !checkout.value) {
      return setStatus(status, 'Please choose both check-in and check-out dates.', 'error');
    }
    if (checkin.value < checkin.min) {
      return setStatus(status, 'Check-in can’t be in the past.', 'error');
    }
    const nights = nightsBetween(checkin.value, checkout.value);
    if (nights < 1) {
      return setStatus(status, 'Check-out must be at least one night after check-in.', 'error');
    }

    const guests = Number($('#guests').value);
    const room = $('#room').value;
    prefillEnquiry({ checkin: checkin.value, checkout: checkout.value, guests, room });

    setStatus(status, `Demo: ${plural(nights, 'night')} for ${plural(guests, 'guest')}, ${room === 'Any room' ? 'any room' : room}. Live availability isn’t connected yet, so we’ve copied these details into the enquiry form. `, 'success');
    const link = document.createElement('a');
    link.href = '#contact';
    link.textContent = 'Continue to the enquiry form →';
    status.append(link);
  });

  /* ---------- Enquiry form ---------- */

  const contact = $('#contact-form');
  const cCheckin = $('#c-checkin');
  const cCheckout = $('#c-checkout');
  const cRoom = $('#c-room');
  linkDates(cCheckin, cCheckout);

  function prefillEnquiry({ checkin: from, checkout: to, guests, room }) {
    if (from) cCheckin.value = from;
    if (to) cCheckout.value = to;
    if (guests) $('#c-guests').value = String(guests);
    if (room) cRoom.value = room;
  }

  // "Enquire" buttons on room cards preselect that room.
  $$('[data-room]').forEach((btn) => {
    btn.addEventListener('click', () => prefillEnquiry({ room: btn.dataset.room }));
  });

  const isFilled = (field) => field.value.trim() !== '' && field.checkValidity();

  contact.addEventListener('submit', (e) => {
    e.preventDefault();
    const status = $('.form-status', contact);

    let firstInvalid = null;
    $$('[required]', contact).forEach((field) => {
      const ok = isFilled(field);
      field.classList.toggle('is-invalid', !ok);
      field.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      setStatus(status, 'Please add your name and a valid email address.', 'error');
      firstInvalid.focus();
      return;
    }
    if (cCheckin.value && cCheckout.value && nightsBetween(cCheckin.value, cCheckout.value) < 1) {
      setStatus(status, 'Check-out must be after check-in.', 'error');
      cCheckout.focus();
      return;
    }

    const firstName = $('#c-name').value.trim().split(/\s+/)[0];
    setStatus(status, `Thanks, ${firstName}! This is a test form, so nothing was sent. It will work once it’s connected to a backend.`, 'success');
    contact.reset();
  });

  contact.addEventListener('input', (e) => {
    const field = e.target;
    if (field.classList.contains('is-invalid') && isFilled(field)) {
      field.classList.remove('is-invalid');
      field.removeAttribute('aria-invalid');
    }
  });

  /* ---------- Reveal sections on scroll ---------- */

  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Footer: year + deployed build info ---------- */

  $('#year').textContent = new Date().getFullYear();

  // version.json is written by the GitHub Pages workflow, so the footer shows
  // which commit is live. It doesn't exist locally, hence the fallback.
  const buildInfo = $('#build-info');
  fetch('version.json', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
    .then((v) => {
      const built = new Date(v.built).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
      buildInfo.textContent = `Build ${v.sha.slice(0, 7)} · ${built}`;
      buildInfo.title = `${v.ref} @ ${v.sha}`;
    })
    .catch(() => { buildInfo.textContent = 'Local preview'; });

  /* ---------- Test build badge ---------- */

  const badge = $('#test-badge');
  try {
    if (sessionStorage.getItem('pharo-hide-badge') === '1') badge.hidden = true;
  } catch (_) { /* storage unavailable */ }
  $('button', badge).addEventListener('click', () => {
    badge.hidden = true;
    try { sessionStorage.setItem('pharo-hide-badge', '1'); } catch (_) { /* ignore */ }
  });
})();
