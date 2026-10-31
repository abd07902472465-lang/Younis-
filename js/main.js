/* =========================================================
   يونس للتصاميم والبحوث — سكربت الموقع
   ========================================================= */

/* ---- إعدادات التواصل: عدّل هذه القيم فقط ----
   whatsapp : رقم واتساب بالصيغة الدولية، أرقام فقط بدون + أو مسافات
              (مثال لرقم عراقي: 9647701234567)
   email    : البريد الإلكتروني
   instagram: اسم المستخدم في إنستغرام بدون @
   telegram : اسم المستخدم في تيليغرام بدون @
   أي قيمة تتركها فارغة '' لا تظهر في الموقع. */
const CONFIG = {
  whatsapp: '',
  email: '',
  instagram: '',
  telegram: '',
};

(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const EASE = 'cubic-bezier(.22, 1, .36, 1)';
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => mqReduce.matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage unavailable */ } },
  };
  const toArabicDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

  /* ---------- Theme (light / dark) ---------- */
  const THEME_KEY = 'younis-theme';
  const mqDark = window.matchMedia('(prefers-color-scheme: dark)');
  const savedTheme = store.get(THEME_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme);
  const isDark = () => {
    const t = root.getAttribute('data-theme');
    return t ? t === 'dark' : mqDark.matches;
  };
  const syncTheme = () => {
    root.classList.toggle('is-dark', isDark());
    window.dispatchEvent(new Event('themechange'));
  };
  syncTheme();
  if (mqDark.addEventListener) mqDark.addEventListener('change', syncTheme);
  new MutationObserver(syncTheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

  $('#theme-toggle')?.addEventListener('click', (e) => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => { root.setAttribute('data-theme', next); store.set(THEME_KEY, next); };
    if (!document.startViewTransition || reduce()) { apply(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(apply);
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 650, easing: EASE, pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
  });

  /* ---------- Header, scroll progress, back to top ---------- */
  const header = $('#site-header');
  const bar = $('.scroll-progress span');
  const toTop = $('#to-top');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    const max = Math.max(1, root.scrollHeight - innerHeight);
    const p = Math.min(1, y / max).toFixed(4);
    header?.classList.toggle('is-scrolled', y > 8);
    bar?.style.setProperty('--p', p);
    if (toTop) {
      toTop.style.setProperty('--p', p);
      toTop.classList.toggle('is-visible', y > innerHeight * 0.8);
    }
  }
  const requestScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
  addEventListener('scroll', requestScroll, { passive: true });
  addEventListener('resize', requestScroll);
  onScroll();
  toTop?.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce() ? 'auto' : 'smooth' }));

  /* ---------- Mobile menu & current section ---------- */
  const menuBtn = $('#menu-toggle');
  const navLinks = $$('.main-nav a');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuBtn?.setAttribute('aria-expanded', String(open));
    menuBtn?.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  };
  menuBtn?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  navLinks.forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', (e) => {
    if (root.classList.contains('menu-open') && !e.target.closest('.site-header')) setMenu(false);
  });

  const linkById = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.remove('is-current'));
      linkById.get(en.target.id)?.classList.add('is-current');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  linkById.forEach((a, id) => { const s = document.getElementById(id); if (s) spy.observe(s); });

  /* ---------- Reveal on scroll (content stays visible at rest) ---------- */
  $$('[data-split]').forEach((el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span');
            w.className = 'split-word';
            w.textContent = part;
            frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.matches('[lang="en"]')) n.classList.add('split-word');
          else walk(n);
        }
      });
    };
    walk(el);
  });

  const inView = (el) => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  };
  function animateIn(el, order) {
    el.classList.add('is-in');
    if (reduce()) return;
    if (el.hasAttribute('data-split')) {
      $$('.split-word', el).forEach((w, i) => w.animate(
        [{ opacity: 0, transform: 'translateY(.55em)', filter: 'blur(5px)' }, { opacity: 1, transform: 'none', filter: 'blur(0)' }],
        { duration: 750, delay: i * 55, easing: EASE, fill: 'backwards' }
      ));
      return;
    }
    el.animate(
      [{ opacity: 0, transform: 'translateY(30px) scale(.98)' }, { opacity: 1, transform: 'none' }],
      { duration: 850, delay: Math.min(order, 5) * 90, easing: EASE, fill: 'backwards' }
    );
  }
  const revealIO = new IntersectionObserver((entries) => {
    let order = 0;
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      revealIO.unobserve(en.target);
      animateIn(en.target, order++);
    });
  }, { rootMargin: '0px 0px 6% 0px' });
  $$('[data-reveal], [data-split]').forEach((el) => {
    if (inView(el)) el.classList.add('is-in');
    else revealIO.observe(el);
  });

  /* ---------- Process steps light up in order ---------- */
  const stepEls = $$('#steps .step');
  const litSteps = new Set();
  let nextStepAt = 0;
  function lightStep(i) {
    if (litSteps.has(i)) return;
    litSteps.add(i);
    const now = performance.now();
    const at = reduce() ? now : Math.max(now, nextStepAt);
    nextStepAt = at + 420;
    setTimeout(() => {
      if (i > 0) stepEls[i - 1].classList.add('is-done');
      setTimeout(() => stepEls[i].classList.add('is-lit'), i > 0 && !reduce() ? 280 : 0);
    }, at - now);
  }
  const stepIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const idx = stepEls.indexOf(en.target);
      for (let i = 0; i <= idx; i++) lightStep(i);
    });
  }, { rootMargin: '0px 0px -20% 0px' });
  stepEls.forEach((s) => stepIO.observe(s));

  /* ---------- Count-up numbers ---------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      countIO.unobserve(en.target);
      const el = en.target;
      const to = Number(el.dataset.to) || 0;
      if (reduce() || !to) return;
      const t0 = performance.now();
      const dur = 1300;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      el.textContent = '0';
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('.countup').forEach((el) => countIO.observe(el));

  /* ---------- Footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Hero: interactive dot grid ---------- */
  const hero = $('.hero');
  const canvas = $('.hero-grid');
  if (hero && canvas && canvas.getContext) {
    const ctx = canvas.getContext('2d');
    const GAP = 28;
    const RADIUS = 150;
    let w = 0, h = 0, cols = 0, rows = 0, offX = 0;
    let mx = -9999, my = -9999, tx = -9999, ty = -9999;
    let dotColor = 'rgba(18,28,51,.17)', accent = '#2B44D8';
    let raf = 0, onScreen = true;

    const readColors = () => {
      const cs = getComputedStyle(root);
      dotColor = cs.getPropertyValue('--dot').trim() || dotColor;
      accent = cs.getPropertyValue('--accent').trim() || accent;
    };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / GAP) + 1;
      rows = Math.ceil(h / GAP) + 1;
      offX = (w % GAP) / 2;
      draw(performance.now());
    };
    const draw = (t) => {
      ctx.clearRect(0, 0, w, h);
      const time = t / 1000;
      const still = reduce();
      const near = [];
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = offX + i * GAP;
          const y = 14 + j * GAP;
          const dx = x - mx, dy = y - my;
          const d = Math.hypot(dx, dy);
          if (!still && d < RADIUS) { near.push([x, y, dx, dy, d]); continue; }
          const wave = still ? 0 : (Math.sin(x * 0.011 + y * 0.009 - time * 1.1) + 1) * 0.5;
          const s = 1.05 + wave * 0.45;
          ctx.moveTo(x + s, y);
          ctx.arc(x, y, s, 0, Math.PI * 2);
        }
      }
      ctx.fill();
      ctx.fillStyle = accent;
      near.forEach(([x, y, dx, dy, d]) => {
        const k = 1 - d / RADIUS;
        const push = k * 9;
        const px = d ? x + (dx / d) * push : x;
        const py = d ? y + (dy / d) * push : y;
        ctx.globalAlpha = 0.2 + k * 0.8;
        ctx.beginPath();
        ctx.arc(px, py, 1.2 + k * 2.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    };
    const running = () => onScreen && !document.hidden && !reduce();
    const frame = (t) => {
      raf = 0;
      if (tx < -1000 || mx < -1000) { mx = tx; my = ty; }
      else { mx += (tx - mx) * 0.16; my += (ty - my) * 0.16; }
      draw(t);
      if (running()) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && running()) raf = requestAnimationFrame(frame); };

    hero.addEventListener('pointermove', (e) => {
      const r = canvas.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { tx = ty = -9999; });
    new IntersectionObserver(([en]) => { onScreen = en.isIntersecting; kick(); }).observe(hero);
    document.addEventListener('visibilitychange', kick);
    addEventListener('themechange', () => { readColors(); draw(performance.now()); });
    addEventListener('resize', resize);
    if (mqReduce.addEventListener) mqReduce.addEventListener('change', () => { draw(performance.now()); kick(); });

    readColors();
    resize();
    root.classList.add('has-grid');
    kick();
  }

  /* ---------- Hero: typewriter ---------- */
  const typer = $('.typer-text');
  if (typer && !reduce()) {
    let words = [];
    try { words = JSON.parse(typer.dataset.words || '[]'); } catch (e) { words = []; }
    if (words.length > 1) {
      let wi = 0;
      let ci = words[0].length;
      let deleting = true;
      const tick = () => {
        const word = words[wi];
        if (deleting) {
          ci -= 1;
          typer.textContent = word.slice(0, ci);
          if (ci <= 0) { deleting = false; wi = (wi + 1) % words.length; setTimeout(tick, 300); return; }
          setTimeout(tick, 30);
          return;
        }
        ci += 1;
        typer.textContent = word.slice(0, ci);
        if (ci >= word.length) { deleting = true; setTimeout(tick, 2300); return; }
        setTimeout(tick, 60 + Math.random() * 45);
      };
      setTimeout(tick, 3400);
    }
  }

  /* ---------- Hero: the pen draws the logo stroke ---------- */
  const art = $('.artboard');
  const abPath = $('.ab-path');
  const nib = $('.ab-nib');
  if (art && abPath && nib && abPath.getTotalLength && !reduce()) {
    const len = abPath.getTotalLength();
    const begin = performance.now() + 1350;
    const dur = 1600;
    art.classList.add('is-drawing');
    abPath.style.strokeDashoffset = '1';
    const step = (t) => {
      const k = Math.max(0, Math.min(1, (t - begin) / dur));
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      abPath.style.strokeDashoffset = String(1 - e);
      const pt = abPath.getPointAtLength(len * e);
      nib.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      if (k < 1) { requestAnimationFrame(step); return; }
      art.classList.remove('is-drawing');
      setTimeout(() => art.classList.add('is-done'), 900);
    };
    requestAnimationFrame(step);
  }

  /* ---------- Hero: board parallax ---------- */
  const board = $('#board');
  if (hero && board && finePointer && !reduce()) {
    let praf = 0, nx = 0, ny = 0;
    hero.addEventListener('pointermove', (e) => {
      const r = board.getBoundingClientRect();
      nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
      ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
      if (praf) return;
      praf = requestAnimationFrame(() => {
        praf = 0;
        board.style.setProperty('--mx', nx.toFixed(3));
        board.style.setProperty('--my', ny.toFixed(3));
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      board.style.setProperty('--mx', '0');
      board.style.setProperty('--my', '0');
    });
  }

  /* ---------- Ticker: seamless loop ---------- */
  $$('.ticker-track').forEach((track) => {
    const items = Array.from(track.childNodes);
    const group = document.createElement('div');
    group.className = 'ticker-group';
    group.append(...items, ...items.map((n) => n.cloneNode(true)));
    const copy = group.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    track.append(group, copy);
    track.classList.add('is-ready');
  });

  /* ---------- Services: filter with a sliding pill and FLIP ---------- */
  const filters = $('.filters');
  const glider = $('.filter-glider');
  const cardsWrap = $('#service-cards');
  if (filters && glider && cardsWrap) {
    const btns = $$('.filter', filters);
    const cards = $$('.card', cardsWrap);
    const activeBtn = () => btns.find((b) => b.classList.contains('is-active')) || btns[0];
    const placeGlider = (btn, instant) => {
      if (instant) glider.style.transition = 'none';
      glider.style.width = `${btn.offsetWidth}px`;
      glider.style.height = `${btn.offsetHeight}px`;
      glider.style.top = `${btn.offsetTop}px`;
      glider.style.bottom = 'auto';
      glider.style.transform = `translateX(${btn.offsetLeft}px)`;
      if (instant) { void glider.offsetWidth; glider.style.transition = ''; }
    };
    filters.classList.add('has-glider');
    placeGlider(activeBtn(), true);
    addEventListener('resize', () => placeGlider(activeBtn(), true));
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeGlider(activeBtn(), true));

    btns.forEach((btn) => btn.addEventListener('click', () => {
      if (btn.classList.contains('is-active')) return;
      btns.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      placeGlider(btn);
      const f = btn.dataset.filter;
      const before = new Map(cards.map((c) => [c, c.getBoundingClientRect()]));
      cards.forEach((c) => { c.hidden = !(f === 'all' || c.dataset.cat === f); });
      if (reduce()) return;
      let n = 0;
      cards.forEach((c) => {
        if (c.hidden) return;
        const a = before.get(c);
        const b = c.getBoundingClientRect();
        if (!a.width && !a.height) {
          c.animate(
            [{ opacity: 0, transform: 'translateY(18px) scale(.92)' }, { opacity: 1, transform: 'none' }],
            { duration: 560, delay: 40 + n++ * 50, easing: EASE, fill: 'backwards' }
          );
          return;
        }
        const dx = a.left - b.left;
        const dy = a.top - b.top;
        if (dx || dy) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 620, easing: EASE });
      });
    }));
  }

  /* ---------- Pointer effects: card tilt, spotlight, magnetic buttons ---------- */
  if (finePointer && !reduce()) {
    $$('.card').forEach((card) => {
      let traf = 0;
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--sx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--sy', `${(py * 100).toFixed(1)}%`);
        if (traf) return;
        traf = requestAnimationFrame(() => {
          traf = 0;
          card.style.transform = `perspective(900px) rotateX(${((0.5 - py) * 7).toFixed(2)}deg) rotateY(${((px - 0.5) * 9).toFixed(2)}deg) translateY(-4px)`;
        });
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
    $$('.magnetic').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${(x * 0.22).toFixed(1)}px, ${(y * 0.32).toFixed(1)}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  document.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('.btn, .filter, .try-opt');
    if (!el || reduce() || el.disabled) return;
    const r = el.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2.2;
    const s = document.createElement('span');
    s.className = 'ripple';
    s.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
    el.append(s);
    s.addEventListener('animationend', () => s.remove());
  });

  /* ---------- FAQ: smooth accordion ---------- */
  const faqItems = $$('.faq-item');
  const closeFaq = (d) => {
    const body = $('.faq-body', d);
    if (reduce() || !body.animate) { d.open = false; return; }
    d.dataset.busy = '1';
    const a = body.animate([{ height: `${body.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: EASE });
    a.onfinish = () => { d.open = false; delete d.dataset.busy; };
  };
  faqItems.forEach((d) => {
    $('summary', d).addEventListener('click', (e) => {
      e.preventDefault();
      if (d.dataset.busy) return;
      if (d.open) { closeFaq(d); return; }
      faqItems.forEach((o) => { if (o !== d && o.open) closeFaq(o); });
      d.open = true;
      const body = $('.faq-body', d);
      if (reduce() || !body.animate) return;
      d.dataset.busy = '1';
      const a = body.animate([{ height: '0px', opacity: 0 }, { height: `${body.offsetHeight}px`, opacity: 1 }], { duration: 440, easing: EASE });
      a.onfinish = () => { delete d.dataset.busy; };
    });
  });

  /* ---------- Sample quiz question ---------- */
  const burst = (el) => {
    if (reduce()) return;
    const r = el.getBoundingClientRect();
    const colors = ['var(--marker)', 'var(--accent)', 'var(--good)'];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('span');
      s.className = 'spark';
      s.style.left = `${r.left + r.width * (0.15 + Math.random() * 0.7)}px`;
      s.style.top = `${r.top + r.height / 2}px`;
      s.style.background = colors[i % colors.length];
      document.body.append(s);
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.3;
      const dist = 50 + Math.random() * 70;
      s.animate(
        [
          { transform: 'translate(-50%, -50%) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(calc(-50% + ${(Math.cos(ang) * dist).toFixed(1)}px), calc(-50% + ${(Math.sin(ang) * dist).toFixed(1)}px)) rotate(${Math.round(Math.random() * 360)}deg) scale(.3)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 350, easing: 'cubic-bezier(.2, .7, .3, 1)' }
      ).onfinish = () => s.remove();
    }
  };
  const tryCard = $('#try-card');
  if (tryCard) {
    const opts = $$('.try-opt', tryCard);
    const explain = $('#try-explain');
    const resetBtn = $('#try-reset');
    const reason = explain.textContent;
    opts.forEach((o) => o.addEventListener('click', () => {
      const ok = o.hasAttribute('data-correct');
      opts.forEach((b) => {
        b.disabled = true;
        if (b.hasAttribute('data-correct')) b.classList.add('is-correct');
        else if (b !== o) b.classList.add('is-dim');
      });
      if (!ok) {
        o.classList.add('is-wrong');
        if (!reduce()) o.classList.add('shake');
      }
      const strong = document.createElement('strong');
      strong.textContent = ok ? 'Correct! ' : 'Not quite. ';
      explain.replaceChildren(strong, reason);
      explain.classList.toggle('is-miss', !ok);
      explain.hidden = false;
      if (!reduce()) explain.animate([{ opacity: 0, transform: 'translateY(-6px)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
      if (ok) burst(o);
      resetBtn.hidden = false;
    }));
    resetBtn.addEventListener('click', () => {
      opts.forEach((b) => { b.disabled = false; b.classList.remove('is-correct', 'is-wrong', 'is-dim', 'shake'); });
      explain.hidden = true;
      resetBtn.hidden = true;
      opts[0].focus();
    });
  }

  /* ---------- Copy helper ---------- */
  const flashCopied = (btn, ok) => {
    if (!btn) return;
    const use = $('use', btn);
    const label = btn.dataset.label || btn.textContent.trim();
    if (use) {
      use.setAttribute('href', ok ? '#i-check' : '#i-copy');
      setTimeout(() => use.setAttribute('href', '#i-copy'), 1600);
    }
    if (btn.id === 'copy-msg') {
      btn.dataset.label = label;
      btn.lastChild.textContent = ok ? 'تم النسخ' : 'تعذّر النسخ';
      setTimeout(() => { btn.lastChild.textContent = label; }, 1600);
    }
  };
  const copyText = (text, btn) => {
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;opacity:0';
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      flashCopied(btn, ok);
    };
    try {
      navigator.clipboard.writeText(text).then(() => flashCopied(btn, true), fallback);
    } catch (e) {
      fallback();
    }
  };

  /* ---------- Contact channels from CONFIG ---------- */
  const wa = String(CONFIG.whatsapp || '').replace(/\D/g, '');
  const handle = (v) => String(v || '').trim().replace(/^@/, '');
  const channelData = {
    whatsapp: wa ? { text: `+${wa}`, href: `https://wa.me/${wa}`, copy: `+${wa}` } : null,
    email: CONFIG.email ? { text: CONFIG.email.trim(), href: `mailto:${CONFIG.email.trim()}`, copy: CONFIG.email.trim() } : null,
    instagram: handle(CONFIG.instagram) ? { text: `@${handle(CONFIG.instagram)}`, href: `https://instagram.com/${handle(CONFIG.instagram)}` } : null,
    telegram: handle(CONFIG.telegram) ? { text: `@${handle(CONFIG.telegram)}`, href: `https://t.me/${handle(CONFIG.telegram)}` } : null,
  };
  let anyChannel = false;
  Object.entries(channelData).forEach(([key, v]) => {
    const li = $(`[data-channel="${key}"]`);
    if (!li || !v) return;
    anyChannel = true;
    li.hidden = false;
    const a = $('.ch-value', li);
    a.textContent = v.text;
    a.href = v.href;
    $('.ch-copy', li)?.addEventListener('click', (e) => copyText(v.copy, e.currentTarget));
  });
  const setupNote = $('#channel-setup');
  if (setupNote) setupNote.hidden = anyChannel;
  const fab = $('#fab-wa');
  if (fab && wa) { fab.href = `https://wa.me/${wa}`; fab.hidden = false; }

  /* ---------- Order form → WhatsApp message ---------- */
  const form = $('#order-form');
  if (form) {
    const f = { name: $('#f-name'), service: $('#f-service'), date: $('#f-date'), details: $('#f-details') };
    const bubble = $('#bubble');
    const bubbleText = $('#bubble-text');
    const sendLink = $('#send-link');
    const note = $('#form-note');
    const fmtDate = (v) => {
      if (!v) return '';
      try { return new Date(`${v}T00:00:00`).toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return v; }
    };
    const hasInput = () => Boolean(f.name.value.trim() || f.service.value || f.date.value || f.details.value.trim());
    const compose = () => {
      const lines = ['مرحباً يونس، أريد طلب خدمة.'];
      if (f.name.value.trim()) lines.push(`الاسم: ${f.name.value.trim()}`);
      if (f.service.value) lines.push(`الخدمة: ${f.service.value}`);
      if (f.date.value) lines.push(`موعد التسليم: ${fmtDate(f.date.value)}`);
      if (f.details.value.trim()) lines.push(`التفاصيل: ${f.details.value.trim()}`);
      return lines.join('\n');
    };
    const update = () => {
      const filled = hasInput();
      bubbleText.textContent = filled ? compose() : '';
      bubble.classList.toggle('has-text', filled);
      sendLink.href = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(compose())}` : '#contact';
    };
    const say = (text, warn) => { note.textContent = text; note.classList.toggle('is-warn', !!warn); };
    const validate = () => {
      let first = null;
      [f.name, f.service, f.details].forEach((el) => {
        const bad = !el.value.trim();
        el.closest('.field').classList.toggle('is-invalid', bad);
        el.setAttribute('aria-invalid', String(bad));
        if (bad && !first) first = el;
      });
      if (first) first.focus();
      return !first;
    };
    ['input', 'change'].forEach((type) => form.addEventListener(type, (e) => {
      update();
      const fld = e.target.closest('.field');
      if (fld && fld.classList.contains('is-invalid') && String(e.target.value).trim()) {
        fld.classList.remove('is-invalid');
        e.target.setAttribute('aria-invalid', 'false');
      }
    }));
    sendLink.addEventListener('click', (e) => {
      update();
      if (!validate()) { e.preventDefault(); say('أكمل الحقول المطلوبة أولاً.', true); return; }
      if (!wa) {
        e.preventDefault();
        say('رقم واتساب غير مضبوط بعد. انسخ الرسالة وأرسلها بنفسك، أو أضف الرقم في أعلى ملف js/main.js.', true);
        return;
      }
      say(`يُفتح واتساب الآن مع رسالتك. إن لم يُفتح، انسخ الرسالة وأرسلها إلى +${wa}.`);
    });
    form.addEventListener('submit', (e) => { e.preventDefault(); sendLink.click(); });
    $('#copy-msg')?.addEventListener('click', (e) => copyText(compose(), e.currentTarget));
    update();
  }
})();
