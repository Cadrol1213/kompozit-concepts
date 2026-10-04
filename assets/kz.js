/* Общие интерактивные компоненты для концептов «Композит».
   Подключение: <script src="assets/data.js"></script><script src="assets/kz.js"></script>
   Внешний вид каждого компонента задаёт сам вариант дизайна (CSS), здесь — разметка и поведение.
   Отправка заявок в концептах не происходит: payload пишется в консоль (в боевой версии — в Telegram через серверную функцию). */
(function () {
  'use strict';
  var D = window.KZ_DATA;
  var KZ = window.KZ = {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  var num = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
  var money = function (n) { return num(n) + ' ₽'; };
  KZ.num = num;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  KZ.$ = $; KZ.$$ = $$; KZ.esc = esc; KZ.money = money; KZ.data = D;
  KZ.img = function (name, small) { return 'img/' + name + (small ? '-sm' : '') + '.jpg'; };
  KZ.render = function (el, items, tpl) { if (el) el.innerHTML = items.map(tpl).join(''); };

  /* ---------- базовые стили служебных слоёв (модалки, лайтбокс, тост, бейдж) ---------- */
  var baseCss = [
    '.kz-ov{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(10,10,12,.82);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s}',
    '.kz-ov.is-open{opacity:1;visibility:visible}',
    '.kz-x{position:absolute;top:12px;right:12px;width:44px;height:44px;border:0;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;font-size:26px;line-height:1;cursor:pointer}',
    '.kz-x:hover{background:rgba(255,255,255,.24)}',
    '.kz-lb-img{max-width:min(1400px,100%);max-height:calc(100vh - 140px);border-radius:6px;box-shadow:0 20px 60px rgba(0,0,0,.5);object-fit:contain}',
    '.kz-lb-cap{position:absolute;left:0;right:0;bottom:14px;text-align:center;color:#fff;font:14px/1.4 system-ui,sans-serif;padding:0 70px;opacity:.9}',
    '.kz-lb-nav{position:absolute;top:50%;transform:translateY(-50%);width:52px;height:52px;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:28px;cursor:pointer}',
    '.kz-lb-nav:hover{background:rgba(255,255,255,.28)}.kz-lb-prev{left:12px}.kz-lb-next{right:12px}',
    '.kz-vid{width:min(1100px,100%);aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.5)}',
    '.kz-vid iframe{width:100%;height:100%;border:0;display:block}',
    '.kz-dialog{position:relative;width:min(520px,100%);max-height:calc(100vh - 32px);overflow:auto;background:var(--kz-dialog-bg,#fff);color:var(--kz-dialog-fg,#16161a);border-radius:var(--kz-radius,16px);padding:32px 28px 28px;box-shadow:0 30px 80px rgba(0,0,0,.35);font-family:var(--kz-font,inherit)}',
    '.kz-dialog .kz-x{background:rgba(0,0,0,.06);color:inherit;top:10px;right:10px}',
    '.kz-dialog h3{margin:0 40px 8px 0;font-size:24px;line-height:1.2;font-family:var(--kz-head-font,inherit)}',
    '.kz-dialog p{margin:0 0 16px;opacity:.75;line-height:1.5}',
    '.kz-toast{position:fixed;left:50%;bottom:90px;transform:translate(-50%,20px);z-index:1100;background:#16161a;color:#fff;padding:12px 18px;border-radius:10px;font:14px/1.4 system-ui,sans-serif;opacity:0;transition:.25s;max-width:calc(100vw - 32px);box-shadow:0 10px 30px rgba(0,0,0,.25)}',
    '.kz-toast.is-on{opacity:1;transform:translate(-50%,0)}',
    '.kz-badge{position:fixed;left:12px;bottom:12px;z-index:900;display:flex;gap:8px;align-items:center;background:rgba(20,20,24,.86);color:#fff;font:600 12px/1 system-ui,sans-serif;padding:9px 12px;border-radius:999px;text-decoration:none;backdrop-filter:blur(6px);letter-spacing:.02em}',
    '.kz-badge:hover{background:#000}.kz-badge span{opacity:.6;font-weight:500}',
    '@media (max-width:860px){.kz-badge{display:none}}',
    /* в открытом меню снимаем blur с шапки: иначе fixed-панель меню позиционируется внутри шапки */
    'html.menu-open header,html.menu-open .hdr{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
    'html.menu-open{overflow:hidden}',
    'html.kz-lock{overflow:hidden}',
    '[data-reveal]{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}',
    '[data-reveal].is-in{opacity:1;transform:none}',
    '@media (prefers-reduced-motion:reduce){[data-reveal]{opacity:1;transform:none;transition:none}}',
    '.kz-sr{position:absolute!important;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}',
    /* слайдер до/после — механика */
    '.ba{position:relative;overflow:hidden;user-select:none;touch-action:pan-y;background:#ddd}',
    '.ba img{display:block;width:100%;height:100%;object-fit:cover;pointer-events:none}',
    '.ba-before{position:absolute;inset:0;clip-path:inset(0 calc(100% - var(--pos,50%)) 0 0)}',
    '.ba-line{position:absolute;top:0;bottom:0;left:var(--pos,50%);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.15);pointer-events:none}',
    '.ba-knob{position:absolute;top:50%;left:var(--pos,50%);width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:#fff;box-shadow:0 6px 20px rgba(0,0,0,.3);pointer-events:none;display:flex;align-items:center;justify-content:center;color:#222;font:700 16px/1 system-ui}',
    '.ba-range{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0;-webkit-appearance:none;appearance:none}',
    '.ba-tag{position:absolute;top:12px;padding:7px 10px;border-radius:6px;background:rgba(0,0,0,.74);color:#fff;font:600 12px/1 system-ui;letter-spacing:.03em;pointer-events:none}',
    '.ba-tag-b{left:12px}.ba-tag-a{right:12px}',
    '.ba:focus-within .ba-knob{outline:3px solid var(--kz-accent,#e2572b);outline-offset:2px}',
    /* формы — значения по умолчанию (нулевая специфичность, варианты переопределяют) */
    ':where(.lead-form){display:grid;gap:14px}',
    ':where(.lf-field){display:grid;gap:6px;position:relative}',
    ':where(.lf-label){font-size:13px;font-weight:600;opacity:.7}',
    ':where(.lf-input){font:inherit;font-size:16px;padding:13px 14px;border:1px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:calc(var(--kz-radius,16px) / 2);background:transparent;color:inherit;width:100%;box-sizing:border-box}',
    ':where(.lf-input):focus{outline:2px solid var(--kz-accent,#e2572b);outline-offset:1px;border-color:transparent}',
    ':where(.is-invalid) .lf-input{border-color:#d93025}',
    '.lf-err{display:none;color:#d93025;font-size:13px;line-height:1.3}',
    '.is-invalid .lf-err,.lf-err.is-on{display:block}',
    ':where(.lf-chips){display:flex;gap:8px;flex-wrap:wrap}',
    ':where(.lf-chip){position:relative}',
    '.lf-chip input{position:absolute;opacity:0;width:1px;height:1px}',
    ':where(.lf-chip span){display:inline-flex;align-items:center;min-height:44px;padding:9px 16px;border:1px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:999px;cursor:pointer;font-size:14px}',
    '.lf-chip input:checked + span{background:var(--kz-accent,#e2572b);border-color:var(--kz-accent,#e2572b);color:var(--kz-on-accent,#fff)}',
    '.lf-chip input:focus-visible + span{outline:2px solid var(--kz-accent,#e2572b);outline-offset:2px}',
    ':where(.lf-consent){display:flex;gap:10px;align-items:flex-start;font-size:13px;line-height:1.4;cursor:pointer;padding:10px 0;min-height:44px}',
    ':where(.lf-consent input){margin:1px 0 0;width:18px;height:18px;flex:none;accent-color:var(--kz-accent,#e2572b)}',
    ':where(.lf-consent a){color:inherit}',
    ':where(.lf-submit){font:inherit;font-weight:700;font-size:16px;padding:16px 20px;border:0;border-radius:calc(var(--kz-radius,16px) / 2);background:var(--kz-accent,#e2572b);color:var(--kz-on-accent,#fff);cursor:pointer;transition:filter .15s}',
    ':where(.lf-submit):hover{filter:brightness(1.08)}',
    ':where(.lf-note){margin:0;font-size:13px;opacity:.75;text-align:center}',
    ':where(.lead-done){text-align:center;padding:16px 0}',
    ':where(.ld-icon){width:56px;height:56px;margin:0 auto 12px;border-radius:50%;background:var(--kz-accent,#e2572b);color:var(--kz-on-accent,#fff);display:flex;align-items:center;justify-content:center;font-size:28px}',
    ':where(.ld-title){margin:0 0 8px;font-size:20px}',
    ':where(.ld-text){margin:0;opacity:.75;line-height:1.5}',
    /* квиз — значения по умолчанию */
    ':where(.qz){display:flex;flex-direction:column;gap:20px}',
    ':where(.qz-head){display:flex;align-items:center;gap:14px}',
    ':where(.qz-count){font-size:13px;font-weight:600;opacity:.65;white-space:nowrap}',
    ':where(.qz-bar){flex:1;height:6px;border-radius:9px;background:color-mix(in srgb,currentColor 14%,transparent);overflow:hidden}',
    ':where(.qz-bar span){display:block;height:100%;width:0;background:var(--kz-accent,#e2572b);transition:width .35s}',
    ':where(.qz-q){margin:0 0 16px;font-size:clamp(22px,2.4vw,28px);line-height:1.2}',
    ':where(.qz-opts){display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px}',
    ':where(.qz-opt){font:inherit;text-align:left;padding:16px;border:1.5px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:calc(var(--kz-radius,16px) * .75);background:transparent;color:inherit;cursor:pointer;display:grid;gap:4px;transition:border-color .15s,background .15s}',
    ':where(.qz-opt):hover{border-color:var(--kz-accent,#e2572b)}',
    '.qz-opt[aria-pressed=true]{border-color:var(--kz-accent,#e2572b);background:color-mix(in srgb,var(--kz-accent,#e2572b) 12%,transparent)}',
    ':where(.qz-opt-l){font-weight:700}',
    ':where(.qz-opt-h){font-size:13px;opacity:.65}',
    ':where(.qz-range-top){display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:14px}',
    ':where(.qz-range-label){opacity:.7}',
    ':where(.qz-range-val){font-size:34px;font-weight:800;line-height:1}',
    ':where(.qz-range input){width:100%;accent-color:var(--kz-accent,#e2572b);height:28px}',
    ':where(.qz-range-scale){display:flex;justify-content:space-between;font-size:12px;opacity:.6;margin-top:4px}',
    ':where(.qz-nav){display:flex;justify-content:space-between;align-items:center;gap:12px}',
    ':where(.qz-back,.qz-restart){font:inherit;font-weight:600;border:0;background:none;color:inherit;cursor:pointer;padding:12px 0;min-height:44px}',
    ':where(.qz-next){font:inherit;font-weight:700;border:0;cursor:pointer;background:var(--kz-accent,#e2572b);color:var(--kz-on-accent,#fff);padding:12px 22px;border-radius:calc(var(--kz-radius,16px) / 2)}',
    '.qz-next[hidden]{display:none}',
    ':where(.qz-sum-label){font-size:12px;opacity:.65;font-weight:700;text-transform:uppercase;letter-spacing:.08em}',
    ':where(.qz-sum){font-size:clamp(30px,4vw,44px);font-weight:800;line-height:1.1;margin:8px 0 10px}',
    ':where(.qz-sum-sm){font-size:clamp(22px,3vw,28px)}',
    ':where(.qz-note,.qz-fix){margin:0 0 10px;opacity:.8;line-height:1.5}',
    ':where(.qz-fix){font-weight:600;opacity:1;margin-bottom:18px}',
    ':where(.qz-restart){margin-top:12px;text-decoration:underline}',
    /* FAQ и видео — минимум */
    '.faq-q{list-style:none;cursor:pointer}.faq-q::-webkit-details-marker{display:none}',
    ':where(.vd-card){align-self:start;font:inherit;color:inherit;background:none;border:0;padding:0;text-align:left;cursor:pointer}',
    ':where(.vd-thumb){position:relative;display:block;overflow:hidden;aspect-ratio:16/9;border-radius:calc(var(--kz-radius,16px) * .75);background:#111}',
    ':where(.vd-thumb img){width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s}',
    '.vd-card:hover .vd-thumb img{transform:scale(1.04)}',
    ':where(.vd-play){position:absolute;left:50%;top:50%;width:58px;height:58px;margin:-29px 0 0 -29px;border-radius:50%;background:rgba(255,255,255,.92);box-shadow:0 6px 20px rgba(0,0,0,.3)}',
    '.vd-play::after{content:"";position:absolute;left:23px;top:18px;border-style:solid;border-width:11px 0 11px 18px;border-color:transparent transparent transparent #111}',
    ':where(.pf-media){display:block;width:100%;padding:0;border:0;background:#ddd;cursor:zoom-in;position:relative;overflow:hidden}',
    ':where(.pf-media img){display:block;width:100%;height:100%;object-fit:cover;transition:transform .5s}',
    '.pf-media:hover img{transform:scale(1.04)}',
    ':where(.pf-count){position:absolute;right:10px;bottom:10px;background:rgba(0,0,0,.74);color:#fff;font:600 12px/1 system-ui;padding:6px 9px;border-radius:999px}',
    '[data-carousel]{cursor:grab}',
    '.is-drag{scroll-snap-type:none!important;scroll-behavior:auto!important;cursor:grabbing!important;user-select:none}',
    '.is-drag *{pointer-events:none}',
    '[hidden]{display:none!important}'
  ].join('\n');
  var st = document.createElement('style'); st.id = 'kz-base'; st.textContent = baseCss;
  document.head.insertBefore(st, document.head.firstChild);

  /* ---------- оверлеи ---------- */
  var lastFocus = null;
  function overlay(inner, cls) {
    var ov = document.createElement('div');
    ov.className = 'kz-ov ' + (cls || '');
    ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('data-lenis-prevent', '');
    ov.innerHTML = inner;
    document.body.appendChild(ov);
    lastFocus = document.activeElement;
    document.documentElement.classList.add('kz-lock');
    requestAnimationFrame(function () { ov.classList.add('is-open'); });
    var close = function () {
      ov.classList.remove('is-open');
      document.documentElement.classList.remove('kz-lock');
      document.removeEventListener('keydown', onKey);
      setTimeout(function () { ov.remove(); }, 260);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    var onKey = function (e) { if (e.key === 'Escape') close(); if (ov._key) ov._key(e); };
    document.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov || e.target.closest('.kz-x')) close(); });
    ov._close = close;
    setTimeout(function () { var f = ov.querySelector('.kz-x'); if (f) f.focus(); }, 30);
    return ov;
  }
  KZ.overlay = overlay;

  KZ.toast = function (msg) {
    var t = document.createElement('div'); t.className = 'kz-toast'; t.textContent = msg; document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('is-on'); });
    setTimeout(function () { t.classList.remove('is-on'); setTimeout(function () { t.remove(); }, 300); }, 3200);
  };

  /* ---------- лайтбокс ---------- */
  KZ.lightbox = function (names, start, caption) {
    var i = start || 0;
    var ov = overlay('<button class="kz-x" aria-label="Закрыть">×</button>' +
      '<button class="kz-lb-nav kz-lb-prev" aria-label="Предыдущее фото">‹</button>' +
      '<img class="kz-lb-img" alt="">' +
      '<button class="kz-lb-nav kz-lb-next" aria-label="Следующее фото">›</button>' +
      '<div class="kz-lb-cap"></div>', 'kz-lb');
    var img = $('.kz-lb-img', ov), cap = $('.kz-lb-cap', ov);
    var show = function () {
      img.src = KZ.img(names[i]); img.alt = caption || '';
      cap.textContent = (caption ? caption + ' · ' : '') + (i + 1) + ' / ' + names.length;
    };
    var go = function (d) { i = (i + d + names.length) % names.length; show(); };
    $('.kz-lb-prev', ov).onclick = function () { go(-1); };
    $('.kz-lb-next', ov).onclick = function () { go(1); };
    if (names.length < 2) { $('.kz-lb-prev', ov).hidden = true; $('.kz-lb-next', ov).hidden = true; }
    ov._key = function (e) { if (e.key === 'ArrowLeft') go(-1); if (e.key === 'ArrowRight') go(1); };
    var x0 = null;
    ov.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    ov.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); x0 = null; });
    show();
  };

  /* ---------- видео ---------- */
  KZ.video = function (id) {
    overlay('<button class="kz-x" aria-label="Закрыть">×</button><div class="kz-vid"><iframe src="https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(id) + '?autoplay=1&rel=0" title="Видеоотзыв" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>', 'kz-video');
  };

  /* ---------- модалка заявки ---------- */
  KZ.leadForm = function (opts) {
    opts = opts || {};
    return '<form class="lead-form" data-lead novalidate>' +
      (opts.summary ? '<input type="hidden" name="summary" value="' + esc(opts.summary) + '">' : '') +
      '<label class="lf-field"><span class="lf-label">Имя</span><input class="lf-input" name="name" autocomplete="name" placeholder="Как к вам обращаться"></label>' +
      '<label class="lf-field"><span class="lf-label">Телефон *</span><input class="lf-input" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" required><span class="lf-err">Введите номер полностью</span></label>' +
      '<div class="lf-field"><span class="lf-label">Удобный способ связи</span><div class="lf-chips" role="radiogroup">' +
      ['Звонок', 'WhatsApp', 'Telegram'].map(function (c, k) {
        return '<label class="lf-chip"><input type="radio" name="channel" value="' + c + '"' + (k === 0 ? ' checked' : '') + '><span>' + c + '</span></label>';
      }).join('') + '</div></div>' +
      '<label class="lf-consent"><input type="checkbox" name="consent" required> <span>Согласен на обработку персональных данных в соответствии с <a href="#" data-privacy>политикой</a></span></label>' +
      '<span class="lf-err lf-err-consent">Нужно согласие на обработку данных</span>' +
      '<button class="lf-submit" type="submit">' + esc(opts.button || 'Отправить заявку') + '</button>' +
      '<p class="lf-note">Перезвоним в рабочее время: ' + D.contacts.hours + '</p>' +
      '</form>';
  };
  KZ.openLead = function (title, sub, summary) {
    var ov = overlay('<div class="kz-dialog"><button class="kz-x" aria-label="Закрыть">×</button>' +
      '<h3>' + esc(title || 'Бесплатный выезд специалиста') + '</h3>' +
      '<p>' + esc(sub || 'Оставьте телефон — руководитель проекта свяжется с вами и договорится о встрече. Замер и смета — бесплатно.') + '</p>' +
      KZ.leadForm({ summary: summary }) + '</div>', 'kz-lead');
    initForms(ov);
    setTimeout(function () { var p = $('input[name=phone]', ov); if (p) p.focus(); }, 60);
  };

  /* ---------- маска телефона ---------- */
  function formatPhone(v) {
    var d = v.replace(/\D/g, '');
    if (!d) return '';
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var r = '+7';
    if (d.length > 1) r += ' (' + d.slice(1, 4);
    if (d.length >= 4) r += ')';
    if (d.length > 4) r += ' ' + d.slice(4, 7);
    if (d.length > 7) r += '-' + d.slice(7, 9);
    if (d.length > 9) r += '-' + d.slice(9, 11);
    return r;
  }
  KZ.phoneOk = function (v) { return v.replace(/\D/g, '').length === 11; };
  function initPhones(root) {
    $$('input[type=tel]', root).forEach(function (inp) {
      if (inp._kz) return; inp._kz = 1;
      inp.addEventListener('input', function () { inp.value = formatPhone(inp.value); inp.closest('.lf-field') && inp.closest('.lf-field').classList.remove('is-invalid'); });
      inp.addEventListener('focus', function () { if (!inp.value) inp.value = '+7 ('; });
      inp.addEventListener('blur', function () { if (inp.value.replace(/\D/g, '').length <= 1) inp.value = ''; });
    });
  }

  /* ---------- формы ---------- */
  function initForms(root) {
    initPhones(root);
    $$('form[data-lead]', root).forEach(function (f) {
      if (f._kz) return; f._kz = 1;
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var phone = f.querySelector('input[name=phone]');
        var consent = f.querySelector('input[name=consent]');
        var ok = true;
        if (phone && !KZ.phoneOk(phone.value)) { phone.closest('.lf-field').classList.add('is-invalid'); ok = false; }
        var ce = f.querySelector('.lf-err-consent');
        if (consent && !consent.checked) { if (ce) ce.classList.add('is-on'); ok = false; } else if (ce) ce.classList.remove('is-on');
        if (!ok) { var inv = f.querySelector('.is-invalid input') || (consent && !consent.checked ? consent : null); if (inv) inv.focus(); return; }
        var payload = {};
        new FormData(f).forEach(function (v, k) { payload[k] = v; });
        payload.page = document.title; payload.variant = document.body.dataset.variant;
        console.info('[Концепт] Заявка (в боевой версии уйдёт в Telegram):', payload);
        var done = document.createElement('div');
        done.className = 'lead-done';
        done.setAttribute('role', 'status');
        done.innerHTML = '<div class="ld-icon" aria-hidden="true">✓</div><h4 class="ld-title">Спасибо, заявка принята!</h4>' +
          '<p class="ld-text">Руководитель проекта свяжется с вами в рабочее время (' + D.contacts.hours + ') и договорится о бесплатном выезде.</p>';
        f.replaceWith(done);
      });
      var c = f.querySelector('input[name=consent]');
      if (c) c.addEventListener('change', function () { var ce = f.querySelector('.lf-err-consent'); if (ce && c.checked) ce.classList.remove('is-on'); });
    });
  }
  KZ.initForms = initForms;

  /* ---------- квиз ---------- */
  KZ.estimate = function (a) {
    var r = D.quiz.rates, area = +a.area || 0;
    if (a.kind === 'bath') return { kind: 'bath' };
    if (a.kind === 'unknown' || !a.kind) return { kind: 'range', min: r.cosmetic * area, max: r.design * area };
    return { kind: 'sum', sum: r[a.kind] * area, rate: r[a.kind] };
  };
  KZ.quiz = function (el, opts) {
    if (!el) return;
    opts = opts || {};
    var steps = D.quiz.steps, n = steps.length, i = 0, ans = { area: steps[2].range.value };
    var live = opts.live ? $(opts.live) : null;
    el.classList.add('qz');
    el.innerHTML = '<div class="qz-head"><div class="qz-count"></div><div class="qz-bar"><span></span></div></div>' +
      '<div class="qz-stage" aria-live="polite"></div>' +
      '<div class="qz-nav"><button type="button" class="qz-back">← Назад</button><button type="button" class="qz-next">Далее →</button></div>';
    var stage = $('.qz-stage', el), back = $('.qz-back', el), next = $('.qz-next', el), bar = $('.qz-bar span', el), count = $('.qz-count', el);

    function updateLive() {
      if (!live) return;
      var e = KZ.estimate(ans);
      var t = e.kind === 'bath' ? 'по прайсу' : e.kind === 'range' ? 'от ' + money(e.min) : 'от ' + money(e.sum);
      live.textContent = t;
      var lr = document.querySelector('[data-qz-live-area]'); if (lr) lr.textContent = ans.area + ' м²';
    }
    function rangeFor() {
      var base = steps[2].range;
      if (ans.kind === 'bath') return { min: 2, max: 20, step: 1, value: Math.min(Math.max(ans.area, 2), 20) === ans.area ? ans.area : 5, unit: 'м²', label: 'Площадь пола санузла' };
      return { min: base.min, max: base.max, step: base.step, value: ans.area, unit: base.unit, label: 'Общая площадь квартиры' };
    }
    var navBox = $('.qz-nav', el);
    function draw() {
      var s = steps[i];
      navBox.hidden = false;
      count.textContent = i < n ? 'Шаг ' + (i + 1) + ' из ' + n : 'Готово';
      bar.style.width = (i < n ? (i / n) * 100 : 100) + '%';
      back.style.visibility = i === 0 ? 'hidden' : 'visible';
      if (i >= n) return result();
      var h = '<h3 class="qz-q">' + esc(s.q) + '</h3>';
      if (s.range) {
        var rg = rangeFor(); ans.area = rg.value;
        h += '<div class="qz-range"><div class="qz-range-top"><span class="qz-range-label">' + rg.label + '</span><output class="qz-range-val">' + rg.value + ' ' + rg.unit + '</output></div>' +
          '<input type="range" min="' + rg.min + '" max="' + rg.max + '" step="' + rg.step + '" value="' + rg.value + '" aria-label="' + rg.label + '">' +
          '<div class="qz-range-scale"><span>' + rg.min + '</span><span>' + rg.max + ' ' + rg.unit + '</span></div></div>';
        next.hidden = false;
      } else {
        h += '<div class="qz-opts">' + s.opts.map(function (o) {
          return '<button type="button" class="qz-opt" data-v="' + o.v + '" aria-pressed="' + (ans[s.key] === o.v) + '"><span class="qz-opt-l">' + esc(o.l) + '</span>' + (o.h ? '<span class="qz-opt-h">' + esc(o.h) + '</span>' : '') + '</button>';
        }).join('') + '</div>';
        next.hidden = !ans[s.key];
      }
      stage.innerHTML = h;
      var rng = $('input[type=range]', stage);
      if (rng) {
        var out = $('.qz-range-val', stage);
        var paint = function () { var p = (rng.value - rng.min) / (rng.max - rng.min) * 100; rng.style.setProperty('--p', p + '%'); };
        paint();
        rng.addEventListener('input', function () { ans.area = +rng.value; out.textContent = rng.value + ' м²'; paint(); updateLive(); });
      }
      $$('.qz-opt', stage).forEach(function (b) {
        b.addEventListener('click', function () {
          ans[s.key] = b.dataset.v;
          $$('.qz-opt', stage).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
          updateLive();
          setTimeout(function () { i++; draw(); }, reduceMotion ? 0 : 220);
        });
      });
      updateLive();
    }
    function result() {
      next.hidden = true;
      navBox.hidden = true;
      var e = KZ.estimate(ans), label = function (k, v) { var o = steps.filter(function (s) { return s.key === k; })[0].opts.filter(function (o) { return o.v === v; })[0]; return o ? o.l : ''; };
      var sumHtml, note;
      if (e.kind === 'bath') {
        sumHtml = '<div class="qz-sum qz-sum-sm">Считаем по прайсу после замера</div>';
        note = 'Ремонт санузла зависит от объёма плитки и сантехники. Например: укладка плитки на стены — от 800 ₽/м², гидроизоляция — от 360 ₽/м², монтаж инсталляции — от 2 900 ₽. Цены за работы, без материалов.';
      } else if (e.kind === 'range') {
        sumHtml = '<div class="qz-sum">от ' + money(e.min) + '</div>';
        note = 'Это косметический ремонт (от 3 400 ₽/м²) на ' + ans.area + ' м². Капитальный — от 7 900 ₽/м², дизайнерский — от 10 800 ₽/м². Подскажем, какой вариант нужен именно вам.';
      } else {
        sumHtml = '<div class="qz-sum">от ' + money(e.sum) + '</div>';
        note = label('kind', ans.kind) + ' ремонт · ' + ans.area + ' м² × ' + money(e.rate).replace(' ₽', '') + ' ₽/м². Стоимость работ без материалов.';
      }
      if (ans.project === 'need') note += ' Дизайн-проект — отдельная услуга, стоимость назовём после обмеров.';
      var summary = [label('kind', ans.kind), label('home', ans.home), ans.area + ' м²', 'проект: ' + label('project', ans.project), 'старт: ' + label('when', ans.when)].join(' · ');
      stage.innerHTML = '<div class="qz-result"><div class="qz-sum-label">Ориентировочная стоимость работ</div>' + sumHtml +
        '<p class="qz-note">' + esc(note) + '</p>' +
        '<p class="qz-fix">Точную смету составим бесплатно после выезда специалиста — и зафиксируем её до конца работ.</p>' +
        KZ.leadForm({ summary: summary, button: 'Получить точную смету' }) +
        '<button type="button" class="qz-restart">Пересчитать</button></div>';
      initForms(stage);
      $('.qz-restart', stage).onclick = function () { i = 0; ans = { area: steps[2].range.value }; draw(); };
      updateLive();
      if (opts.onDone) opts.onDone(ans, e);
    }
    back.onclick = function () { if (i > 0) { i--; draw(); } };
    next.onclick = function () { if (i < n) { i++; draw(); } };
    draw();
  };

  /* ---------- до/после ---------- */
  KZ.ba = function (el, pair, labels) {
    if (!el || !pair) return;
    labels = labels || ['В процессе', 'Готово'];
    el.classList.add('ba');
    el.innerHTML = '<img src="' + KZ.img(pair.after) + '" alt="' + esc(pair.caption) + ' — готово" loading="lazy">' +
      '<div class="ba-before"><img src="' + KZ.img(pair.before) + '" alt="' + esc(pair.caption) + ' — в процессе ремонта" loading="lazy"></div>' +
      '<span class="ba-tag ba-tag-b">' + labels[0] + '</span><span class="ba-tag ba-tag-a">' + labels[1] + '</span>' +
      '<span class="ba-line"></span><span class="ba-knob" aria-hidden="true">⇆</span>' +
      '<input class="ba-range" type="range" min="0" max="100" value="50" aria-label="Сравнить: ' + esc(pair.caption) + '">';
    var r = $('.ba-range', el);
    var set = function (v) { el.style.setProperty('--pos', v + '%'); };
    r.addEventListener('input', function () { set(r.value); });
    set(50);
  };

  /* ---------- портфолио ---------- */
  KZ.cardTpl = function (o) {
    return '<article class="pf-card" data-type="' + o.type + '" data-district="' + esc(o.district) + '">' +
      '<button type="button" class="pf-media" data-gallery="' + o.id + '" aria-label="Открыть фото: ' + esc(o.title) + '">' +
      '<img src="' + KZ.img(o.imgs[0], true) + '" alt="' + esc(o.title) + '" loading="lazy"><span class="pf-count">' + o.imgs.length + ' фото</span></button>' +
      '<div class="pf-body"><div class="pf-meta"><span class="pf-tag">' + esc(o.typeLabel) + '</span><span class="pf-district">' + esc(o.district) + '</span></div>' +
      '<h3 class="pf-title">' + esc(o.title) + '</h3><p class="pf-text">' + esc(o.text) + '</p>' +
      '<div class="pf-foot"><span>' + esc(o.place) + ' · ' + esc(o.house) + '</span><span>' + esc(o.by) + '</span></div></div></article>';
  };
  KZ.portfolio = function (el, opts) {
    if (!el) return;
    opts = opts || {};
    var list = D.objects.filter(opts.only || function () { return true; });
    if (opts.limit) list = list.slice(0, opts.limit);
    KZ.render(el, list, opts.template || KZ.cardTpl);
    if (opts.filterEl) {
      var fe = $(opts.filterEl), by = opts.filterBy || 'type';
      var groups = by === 'type'
        ? [['all', 'Все'], ['capital', 'Капитальный'], ['cosmetic', 'Косметический'], ['bath', 'Ванные и санузлы']]
        : [['all', 'Все районы']].concat(list.map(function (o) { return o.district; }).filter(function (v, k, a) { return a.indexOf(v) === k; }).map(function (d) { return [d, d]; }));
      fe.innerHTML = groups.map(function (g, k) {
        var cnt = g[0] === 'all' ? list.length : list.filter(function (o) { return (by === 'type' ? o.type : o.district) === g[0]; }).length;
        return '<button type="button" class="pf-filter" data-f="' + esc(g[0]) + '" aria-pressed="' + (k === 0) + '">' + esc(g[1]) + ' <sup>' + cnt + '</sup></button>';
      }).join('');
      fe.addEventListener('click', function (e) {
        var b = e.target.closest('.pf-filter'); if (!b) return;
        $$('.pf-filter', fe).forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        $$('[data-type]', el).forEach(function (c) {
          var v = by === 'type' ? c.dataset.type : c.dataset.district;
          c.hidden = !(b.dataset.f === 'all' || v === b.dataset.f);
        });
      });
    }
  };

  /* ---------- видео, FAQ ---------- */
  KZ.videoTpl = function (v) {
    return '<button type="button" class="vd-card" data-video="' + v.id + '"><span class="vd-thumb"><img src="img/video/' + v.id + '.jpg" alt="" loading="lazy"><span class="vd-play" aria-hidden="true"></span></span>' +
      '<span class="vd-title">' + esc(v.t) + '</span></button>';
  };
  KZ.videos = function (el, opts) { opts = opts || {}; KZ.render(el, D.videos.slice(0, opts.limit || 12), opts.template || KZ.videoTpl); };
  KZ.faq = function (el, opts) {
    if (!el) return;
    opts = opts || {};
    KZ.render(el, D.faq, function (f, k) {
      return '<details class="faq-item"' + (opts.openFirst && k === 0 ? ' open' : '') + '><summary class="faq-q"><span>' + esc(f.q) + '</span><span class="faq-icon" aria-hidden="true"></span></summary><div class="faq-a"><p>' + esc(f.a) + '</p></div></details>';
    });
    if (opts.single) $$('details', el).forEach(function (d) {
      d.addEventListener('toggle', function () { if (d.open) $$('details', el).forEach(function (x) { if (x !== d) x.open = false; }); });
    });
  };

  /* ---------- калькулятор по прайсу ---------- */
  KZ.priceCalc = function (el) {
    if (!el) return;
    var items = D.priceItems, qty = items.map(function () { return 0; });
    var groups = items.map(function (x) { return x.g; }).filter(function (v, k, a) { return a.indexOf(v) === k; });
    el.classList.add('pc');
    el.innerHTML = '<div class="pc-tabs" role="tablist">' + groups.map(function (g, k) { return '<button type="button" role="tab" class="pc-tab" aria-selected="' + (k === 0) + '" data-g="' + esc(g) + '">' + esc(g) + '</button>'; }).join('') + '</div>' +
      '<div class="pc-rows">' + items.map(function (x, k) {
        return '<div class="pc-row" data-g="' + esc(x.g) + '"' + (x.g !== groups[0] ? ' hidden' : '') + '><div class="pc-name">' + esc(x.n) + '<span class="pc-price">от ' + money(x.p) + ' / ' + x.u + '</span></div>' +
          '<div class="pc-qty"><button type="button" class="pc-dec" aria-label="Меньше">−</button><input type="number" min="0" step="1" inputmode="numeric" value="0" data-k="' + k + '" aria-label="Количество: ' + esc(x.n) + ', ' + x.u + '"><span class="pc-unit">' + x.u + '</span><button type="button" class="pc-inc" aria-label="Больше">+</button></div>' +
          '<div class="pc-sum" data-sum="' + k + '">—</div></div>';
      }).join('') + '</div>' +
      '<div class="pc-total"><div><div class="pc-total-label">Итого за выбранные работы</div><div class="pc-total-val">0 ₽</div><div class="pc-total-note">Цены из прайс-листа 2026 года, работы без материалов. Точную сумму назовём после замера.</div></div>' +
      '<button type="button" class="pc-send" disabled>Отправить расчёт</button></div>';
    var totalEl = $('.pc-total-val', el), send = $('.pc-send', el);
    function upd() {
      var t = 0;
      items.forEach(function (x, k) { var s = qty[k] * x.p; t += s; $('[data-sum="' + k + '"]', el).textContent = qty[k] ? 'от ' + money(s) : '—'; });
      totalEl.textContent = t ? 'от ' + money(t) : '0 ₽'; send.disabled = t === 0;
    }
    el.addEventListener('input', function (e) {
      if (e.target.matches('input[type=number]')) { var k = +e.target.dataset.k; qty[k] = Math.max(0, Math.floor(+e.target.value || 0)); upd(); }
    });
    el.addEventListener('click', function (e) {
      var tab = e.target.closest('.pc-tab');
      if (tab) {
        $$('.pc-tab', el).forEach(function (t) { t.setAttribute('aria-selected', t === tab); });
        $$('.pc-row', el).forEach(function (r) { r.hidden = r.dataset.g !== tab.dataset.g; });
        return;
      }
      var b = e.target.closest('.pc-inc,.pc-dec');
      if (b) {
        var inp = $('input', b.parentNode), k = +inp.dataset.k;
        qty[k] = Math.max(0, qty[k] + (b.classList.contains('pc-inc') ? 1 : -1)); inp.value = qty[k]; upd();
      }
    });
    send.addEventListener('click', function () {
      var lines = items.map(function (x, k) { return qty[k] ? x.n + ' — ' + qty[k] + ' ' + x.u : null; }).filter(Boolean);
      KZ.openLead('Отправить расчёт', 'Итого ' + totalEl.textContent + ' за работы. Руководитель проекта проверит расчёт и предложит бесплатный выезд для точной сметы.', lines.join('; '));
    });
  };

  /* ---------- подгонка крупной надписи под ширину: [data-fit] ---------- */
  KZ.fit = function () {
    $$('[data-fit]').forEach(function (el) {
      var span = el.querySelector('.fit-in');
      if (!span) { span = document.createElement('span'); span.className = 'fit-in'; span.style.display = 'inline-block'; span.style.whiteSpace = 'nowrap'; while (el.firstChild) span.appendChild(el.firstChild); el.appendChild(span); }
      var cs = getComputedStyle(el), cw = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      el.style.fontSize = '100px';
      var w = span.getBoundingClientRect().width;
      if (!w || !cw) return;
      el.style.fontSize = (100 * cw * (+el.dataset.fit || 0.97) / w).toFixed(2) + 'px';
    });
  };

  /* ---------- карусель: стрелки, свайп, перетаскивание мышью; вертикальную прокрутку не трогает ---------- */
  KZ.carousel = function (vp, o) {
    if (!vp) return;
    o = o || {};
    var list = function () { return vp.firstElementChild ? vp.firstElementChild.children : vp.children; };
    var step = function () {
      var it = list()[0]; if (!it) return vp.clientWidth * 0.8;
      var ps = getComputedStyle(it.parentElement), g = parseFloat(ps.columnGap) || parseFloat(ps.gap) || 0;
      return it.getBoundingClientRect().width + g;
    };
    var go = function (d) { vp.scrollBy({ left: d * step(), behavior: 'smooth' }); };
    if (o.prev) o.prev.addEventListener('click', function () { go(-1); });
    if (o.next) o.next.addEventListener('click', function () { go(1); });
    var upd = function () {
      var max = vp.scrollWidth - vp.clientWidth, p = max > 0 ? vp.scrollLeft / max : 0;
      if (o.progress) o.progress.style.transform = 'scaleX(' + Math.max(0.04, p) + ')';
      if (o.count) { var n = list().length, i = Math.min(n, Math.round(vp.scrollLeft / step()) + 1); if (p > 0.98) i = n; o.count.textContent = String(i).padStart(2, '0'); }
      if (o.prev) o.prev.disabled = vp.scrollLeft < 4;
      if (o.next) o.next.disabled = vp.scrollLeft > max - 4;
    };
    vp.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd); window.addEventListener('load', upd); upd();
    var down = false, x0 = 0, s0 = 0, moved = false;
    vp.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse' || e.button !== 0) return; down = true; moved = false; x0 = e.clientX; s0 = vp.scrollLeft; });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 5) { moved = true; vp.classList.add('is-drag'); }
      if (moved) vp.scrollLeft = s0 - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return; down = false;
      if (moved) { vp.classList.remove('is-drag'); var st = step(); vp.scrollTo({ left: Math.round(vp.scrollLeft / st) * st, behavior: 'smooth' }); setTimeout(function () { moved = false; }, 60); }
    });
    vp.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    vp.addEventListener('dragstart', function (e) { e.preventDefault(); });
  };

  /* ---------- общее поведение страницы ---------- */
  function init() {
    // меню
    $$('[data-menu-toggle]').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = document.documentElement.classList.toggle('menu-open');
        b.setAttribute('aria-expanded', open);
      });
    });
    $$('[data-menu] a').forEach(function (a) { a.addEventListener('click', function () { document.documentElement.classList.remove('menu-open'); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') document.documentElement.classList.remove('menu-open'); });
    // шапка при прокрутке
    var onScroll = function () { document.documentElement.classList.toggle('scrolled', window.scrollY > 10); };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    // делегирование кликов
    document.addEventListener('click', function (e) {
      var g = e.target.closest('[data-gallery]');
      if (g) { var o = D.objects.filter(function (x) { return x.id === g.dataset.gallery; })[0]; if (o) KZ.lightbox(o.imgs, +(g.dataset.index || 0), o.title + ', ' + o.place); return; }
      var v = e.target.closest('[data-video]');
      if (v) { KZ.video(v.dataset.video); return; }
      var l = e.target.closest('[data-open-lead]');
      if (l) { e.preventDefault(); KZ.openLead(l.dataset.leadTitle, l.dataset.leadSub); return; }
      var p = e.target.closest('[data-privacy]');
      if (p) { e.preventDefault(); KZ.toast('Политика обработки персональных данных будет опубликована после получения реквизитов компании.'); return; }
      var q = e.target.closest('[data-goto-quiz]');
      if (q) { var qz = $('#quiz'); if (qz) { e.preventDefault(); document.documentElement.classList.remove('menu-open'); if (window.M && M.scrollTo) M.scrollTo(qz); else qz.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); } }
    });
    // появление при прокрутке
    var rv = $$('[data-reveal]');
    if ('IntersectionObserver' in window && !reduceMotion) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } }); }, { rootMargin: '0px 0px -8% 0px' });
      rv.forEach(function (x) { io.observe(x); });
    } else rv.forEach(function (x) { x.classList.add('is-in'); });
    // формы, год, бейдж концепта
    initForms(document);
    $$('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
    KZ.fit(); window.addEventListener('resize', KZ.fit); window.addEventListener('load', KZ.fit); if (document.fonts && document.fonts.ready) document.fonts.ready.then(KZ.fit);
    var vr = document.body.dataset.variant;
    if (vr) {
      var b = document.createElement('a'); b.className = 'kz-badge'; b.href = 'index.html';
      b.innerHTML = 'Концепт ' + vr + ' из 5 <span>· все варианты</span>'; document.body.appendChild(b);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
