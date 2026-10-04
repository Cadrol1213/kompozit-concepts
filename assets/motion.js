/* Движок анимаций концептов «Композит»: GSAP 3.13 (ScrollTrigger, SplitText) + Lenis.
   Подключение (в конце body, после kz.js):
     assets/vendor/gsap.min.js, ScrollTrigger.min.js, SplitText.min.js, lenis.min.js, assets/motion.js
   В <head> — assets/motion.css и строка, ставящая html.m-anim / html.m-static.
   Атрибуты:
     data-header                — шапка прячется при прокрутке вниз
     data-intro                 — экран-заставка с логотипом (paths .lm-r / .lm-b)
     data-split[="lines|words|chars"]  — появление текста; внутри [data-hero] — сразу после заставки
     data-fade                  — плавное появление снизу; data-stagger — по очереди для детей
     data-reveal-img            — «шторка» на фото; img внутри слегка уменьшается
     data-speed="0.2"           — параллакс картинки внутри рамки (img выше рамки на 20–30%)
     data-count="7900"          — счётчик; data-count-prefix / data-count-suffix
     data-marquee               — бегущая строка (скорость реагирует на прокрутку)
     data-magnetic              — магнитная кнопка (только мышь)
     data-hover-img             — список: строки с data-img показывают фото у курсора
     data-scrub-text            — слова «проявляются» по мере прокрутки
     data-hscroll + [data-hscroll-track] — горизонтальная лента, закреплённая при прокрутке (≥ 900px)
     data-stack                 — карточки наслаиваются (дети .stack-card, CSS sticky)
     data-ba-pin                — «до/после» проявляется прокруткой (внутри .ba от KZ.ba)
     data-draw                  — SVG-линии «рисуются» */
(function () {
  'use strict';
  var html = document.documentElement;
  var reduce = html.classList.contains('m-static');
  var M = window.M = { reduce: reduce, lenis: null };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var headerH = function () { var h = document.querySelector('[data-header]'); return h ? h.offsetHeight : 0; };

  M.scrollTo = function (target) {
    if (typeof target === 'string') target = document.querySelector(target);
    if (!target) return;
    if (M.lenis) M.lenis.scrollTo(target, { offset: -headerH() + 1, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  // якорные ссылки — через Lenis
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    html.classList.remove('menu-open');
    M.scrollTo(t);
  });

  var finish = function () { html.classList.remove('m-anim'); html.classList.add('m-static'); };

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    finish();
    $$('[data-count]').forEach(function (el) { el.textContent = fmtCount(el, +el.dataset.count); });
    $$('[data-intro]').forEach(function (el) { el.remove(); });
    document.dispatchEvent(new Event('intro:done'));
    return;
  }

  var gsap = window.gsap, ST = window.ScrollTrigger, Split = window.SplitText;
  gsap.registerPlugin(ST); if (Split) gsap.registerPlugin(Split);
  gsap.defaults({ ease: 'power3.out', duration: 1 });

  /* ---------- Lenis ---------- */
  if (window.Lenis) {
    var lenis = M.lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    // стоп прокрутки фона, когда открыто меню или модалка
    new MutationObserver(function () {
      var c = html.classList;
      if (c.contains('kz-lock') || c.contains('menu-open')) lenis.stop(); else lenis.start();
    }).observe(html, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- шапка ---------- */
  var hdr = document.querySelector('[data-header]');
  if (hdr) {
    ST.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        html.classList.toggle('hdr-hidden', self.direction === 1 && y > 320);
        html.classList.toggle('scrolled', y > 10);
      }
    });
  }

  /* ---------- текст ---------- */
  function splitReveal(el, onLoad) {
    var type = el.dataset.split || 'lines';
    gsap.set(el, { autoAlpha: 1 });
    if (!Split) { gsap.from(el, { y: 40, autoAlpha: 0, scrollTrigger: onLoad ? null : { trigger: el, start: 'top 88%' } }); return; }
    Split.create(el, {
      type: type === 'chars' ? 'lines,chars' : type === 'words' ? 'lines,words' : 'lines',
      mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: function (self) {
        var targets = type === 'chars' ? self.chars : type === 'words' ? self.words : self.lines;
        return gsap.from(targets, {
          yPercent: 115, duration: type === 'chars' ? 1 : 1.15, ease: 'expo.out',
          stagger: type === 'chars' ? 0.025 : type === 'words' ? 0.04 : 0.1,
          delay: onLoad ? (+el.dataset.delay || 0) : 0,
          scrollTrigger: onLoad ? null : { trigger: el, start: 'top 88%', toggleActions: 'play none none none' }
        });
      }
    });
  }

  function fmtCount(el, v) {
    var n = String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (el.dataset.countPrefix || '') + n + (el.dataset.countSuffix || '');
  }

  function heroIn() {
    $$('[data-hero] [data-split]').forEach(function (el) { splitReveal(el, true); });
    var hf = $$('[data-hero] [data-fade]');
    if (hf.length) gsap.fromTo(hf, { y: 30, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.08, delay: 0.35 });
    $$('[data-hero] [data-reveal-img]').forEach(function (el, k) {
      gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', delay: 0.15 + k * 0.12 });
      var im = el.querySelector('img'); if (im) gsap.fromTo(im, { scale: 1.3 }, { scale: 1, duration: 2, ease: 'expo.out', delay: 0.15 + k * 0.12 });
    });
    $$('[data-hero] [data-count]').forEach(countUp);
  }

  function countUp(el) {
    var o = { v: 0 }, to = +el.dataset.count;
    el.textContent = fmtCount(el, 0);
    gsap.to(o, { v: to, duration: 1.8, ease: 'power2.out', onUpdate: function () { el.textContent = fmtCount(el, o.v); },
      scrollTrigger: el.closest('[data-hero]') ? null : { trigger: el, start: 'top 90%', toggleActions: 'play none none none' } });
  }

  function initScroll() {
    $$('[data-split]').forEach(function (el) { if (!el.closest('[data-hero]')) splitReveal(el, false); });
    $$('[data-fade]').forEach(function (el) {
      if (el.closest('[data-hero]')) return;
      if (!el.getClientRects().length) { gsap.set(el, { autoAlpha: 1 }); return; }
      gsap.fromTo(el, { y: 44, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' } });
    });
    $$('[data-stagger]').forEach(function (el) {
      gsap.fromTo(el.children, { y: 50, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.09, duration: 1.1, scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } });
    });
    $$('[data-reveal-img]').forEach(function (el) {
      if (el.closest('[data-hero]')) return;
      if (!el.getClientRects().length) { gsap.set(el, { clipPath: 'none' }); return; }
      var im = el.querySelector('img');
      var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' } });
      tl.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' });
      if (im && !im.hasAttribute('data-speed')) tl.fromTo(im, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: 'expo.out' }, 0);
    });
    $$('[data-speed]').forEach(function (im) {
      var s = +im.dataset.speed || 0.15, box = im.parentElement;
      gsap.fromTo(im, { yPercent: -s * 50 }, { yPercent: s * 50, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    $$('[data-count]').forEach(function (el) { if (!el.closest('[data-hero]')) countUp(el); });

    // бегущая строка
    $$('[data-marquee]').forEach(function (el) {
      var tr = el.querySelector('.mq-track'); if (!tr) return;
      tr.innerHTML += tr.innerHTML;
      var dir = el.dataset.marquee === 'right' ? 1 : -1;
      var tw = gsap.fromTo(tr, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: +el.dataset.duration || 30, ease: 'none', repeat: -1 });
      ST.create({ trigger: el, start: 'top bottom', end: 'bottom top', onUpdate: function (self) {
        var v = Math.min(Math.abs(self.getVelocity()) / 400, 4);
        gsap.to(tw, { timeScale: 1 + v, duration: 0.2, overwrite: true, onComplete: function () { gsap.to(tw, { timeScale: 1, duration: 0.8 }); } });
      } });
    });

    // проявление слов
    $$('[data-scrub-text]').forEach(function (el) {
      gsap.set(el, { autoAlpha: 1 });
      if (!Split) return;
      var sp = new Split(el, { type: 'words' });
      gsap.fromTo(sp.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });

    // рисование линий
    $$('[data-draw]').forEach(function (svg) {
      $$('path,line,polyline,circle,rect', svg).forEach(function (p) {
        var L = p.getTotalLength ? p.getTotalLength() : 0; if (!L) return;
        gsap.fromTo(p, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut',
          scrollTrigger: { trigger: svg, start: 'top 85%', toggleActions: 'play none none none' } });
      });
    });

    var mm = gsap.matchMedia();
    // горизонтальная лента
    mm.add('(min-width: 900px)', function () {
      $$('[data-hscroll]').forEach(function (el) {
        var tr = el.querySelector('[data-hscroll-track]'); if (!tr) return;
        var bar = el.querySelector('[data-hscroll-progress]'), cnt = el.querySelector('[data-hscroll-count]');
        var dist = function () { return Math.max(0, tr.scrollWidth - tr.parentElement.clientWidth); };
        gsap.to(tr, { x: function () { return -dist(); }, ease: 'none',
          scrollTrigger: { trigger: el, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
            onUpdate: function (self) {
              if (bar) bar.style.transform = 'scaleX(' + self.progress + ')';
              if (cnt) { var n = tr.children.length; cnt.textContent = String(Math.min(n, Math.floor(self.progress * (n - 0.001)) + 1)).padStart(2, '0'); }
            } } });
      });
    });
    // карточки, наслаивающиеся друг на друга
    $$('[data-stack]').forEach(function (el) {
      var cards = $$('.stack-card', el);
      cards.forEach(function (c, k) {
        if (k === cards.length - 1) return;
        gsap.to(c, { scale: 0.92, ease: 'none',
          scrollTrigger: { trigger: cards[k + 1], start: 'top bottom', end: 'top ' + (parseInt(getComputedStyle(cards[k + 1]).top) || 100) + 'px', scrub: true } });
      });
    });
    // до/после прокруткой
    $$('[data-ba-pin]').forEach(function (sec) {
      var ba = sec.querySelector('.ba'); if (!ba) return;
      var o = { p: 96 };
      gsap.to(o, { p: 4, ease: 'none', onUpdate: function () {
        ba.style.setProperty('--pos', o.p + '%'); var r = ba.querySelector('.ba-range'); if (r) r.value = o.p;
      }, scrollTrigger: { trigger: sec, start: 'top top', end: '+=110%', pin: true, scrub: 0.6, anticipatePin: 1 } });
    });

    // мышь: магнитные кнопки и фото у курсора
    mm.add('(hover: hover) and (pointer: fine)', function () {
      $$('[data-magnetic]').forEach(function (b) {
        var xT = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'elastic.out(1,0.4)' }), yT = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'elastic.out(1,0.4)' });
        b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); xT((e.clientX - r.left - r.width / 2) * 0.3); yT((e.clientY - r.top - r.height / 2) * 0.4); });
        b.addEventListener('mouseleave', function () { xT(0); yT(0); });
      });
      $$('[data-hover-img]').forEach(function (list) {
        var fl = document.createElement('div'); fl.className = 'hv-float'; fl.innerHTML = '<img alt="">'; document.body.appendChild(fl);
        var im = fl.querySelector('img');
        var xT = gsap.quickTo(fl, 'left', { duration: 0.5, ease: 'power3' }), yT = gsap.quickTo(fl, 'top', { duration: 0.5, ease: 'power3' });
        list.addEventListener('mousemove', function (e) { xT(e.clientX + 24); yT(e.clientY); });
        $$('[data-img]', list).forEach(function (row) {
          row.addEventListener('mouseenter', function () { im.src = row.dataset.img; gsap.to(fl, { autoAlpha: 1, scale: 1, duration: 0.4, overwrite: 'auto' }); });
          row.addEventListener('mouseleave', function () { gsap.to(fl, { autoAlpha: 0, scale: 0.85, duration: 0.3, overwrite: 'auto' }); });
        });
      });
    });

    // пересчёт после загрузки картинок и шрифтов
    window.addEventListener('load', function () { ST.refresh(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }

  /* ---------- заставка ---------- */
  function intro(done) {
    var el = document.querySelector('[data-intro]');
    if (!el) { done(); return; }
    var seen = false;
    try { seen = sessionStorage.getItem('kz-intro-' + location.pathname) === '1'; sessionStorage.setItem('kz-intro-' + location.pathname, '1'); } catch (e) {}
    if (M.lenis) M.lenis.stop();
    var tl = gsap.timeline({ onComplete: function () { el.remove(); if (M.lenis) M.lenis.start(); } });
    var bars = $$('.lm-r, .lm-b', el), word = $$('.intro-word span', el);
    if (seen) {
      tl.to(el, { autoAlpha: 0, duration: 0.35 }).add(done, 0.05);
      return;
    }
    tl.from(bars, { x: function (i) { return (i % 2 ? 1 : -1) * 260; }, y: function (i) { return (i % 2 ? -1 : 1) * 260; }, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.06 })
      .from(word, { yPercent: 110, duration: 0.7, ease: 'expo.out', stagger: 0.03 }, 0.25)
      .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.9, ease: 'expo.inOut' }, '+=0.25')
      .add(done, '-=0.55');
  }

  initScroll();
  intro(function () { heroIn(); document.dispatchEvent(new Event('intro:done')); });
})();
