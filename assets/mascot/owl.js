/* Сова-проводник: оживляет <div class="owl" data-owl-mood="idle"> встроенным SVG-ригом (rig/owl-rig.svg).
   API: window.LibraryOwl = { mount(el), say(el, ms), mood(el, name, holdMs?), blink(el) }.
   Настроения: idle | happy | surprised | wave | think. Анимация только через transform/opacity,
   только если движение разрешено (prefers-reduced-motion и класс версии для слабовидящих access-no-motion);
   иначе сова стоит спокойно с открытыми глазами. Вне экрана и на скрытой вкладке циклы останавливаются. */
(function () {
  'use strict';
  if (window.LibraryOwl) return;
  var d = document;
  var script = d.currentScript;
  var SRC = script && script.src ? new URL('rig/owl-rig.svg', script.src).href : '/assets/mascot/rig/owl-rig.svg';
  var LABEL = 'Сова-проводник';
  var MOODS = ['idle', 'happy', 'surprised', 'wave', 'think'];
  var reduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var finePointer = window.matchMedia ? matchMedia('(hover: hover) and (pointer: fine)') : { matches: false };
  var owls = new Set();
  var states = new WeakMap();
  var svgText = null;

  function motionOK() {
    if (reduce.matches) return false;
    if (d.body && d.body.classList.contains('access-no-motion')) return false;
    if (d.documentElement.classList.contains('no-motion')) return false;
    return true;
  }

  // Стили рига: transform-origin задан в файле в единицах viewBox (viewBox начинается с 0 0).
  function injectStyle() {
    if (d.getElementById('owl-rig-style')) return;
    var s = d.createElement('style');
    s.id = 'owl-rig-style';
    s.textContent = '.owl{display:inline-block;line-height:0;position:relative}' +
      '.owl>svg{display:block;width:100%;height:auto;overflow:visible}' +
      '.owl [data-part]{transform-box:view-box!important}' +
      '.owl.owl-live [data-part=pupils],.owl.owl-live [data-part=glasses],.owl.owl-live [data-part=eyes-open]{transition:transform .18s ease-out}';
    d.head.appendChild(s);
  }

  function loadSvg() {
    if (!svgText) {
      svgText = fetch(SRC).then(function (r) {
        if (!r.ok) throw new Error('owl-rig.svg: ' + r.status);
        return r.text();
      });
      svgText.catch(function () { svgText = null; });
    }
    return svgText;
  }

  // Обёртка: Motion, если загружен, иначе Web Animations API. Длительность в секундах.
  function anim(el, kf, o) {
    o = o || {};
    var M = window.Motion;
    if (M && typeof M.animate === 'function') {
      return M.animate(el, kf, { duration: o.duration || 0.4, repeat: o.repeat || 0, ease: o.ease || 'easeInOut', delay: o.delay || 0 });
    }
    if (el.animate) {
      return el.animate(kf, {
        duration: (o.duration || 0.4) * 1000,
        iterations: o.repeat === Infinity ? Infinity : (o.repeat || 0) + 1,
        easing: 'ease-in-out', delay: (o.delay || 0) * 1000
      });
    }
    return null;
  }
  function done(c) {
    if (!c) return Promise.resolve();
    var p = c.finished || (typeof c.then === 'function' ? Promise.resolve(c) : null);
    return p ? p.then(null, function () {}) : Promise.resolve();
  }
  function stop(c) { try { if (c) (c.cancel || c.stop).call(c); } catch (e) { /* уже остановлена */ } }

  function part(st, name) { return st.parts[name]; }
  function show(el, on) { if (el) el.setAttribute('visibility', on ? 'visible' : 'hidden'); }
  function setEyes(st, which) {
    st.eyes = which;
    show(part(st, 'eyes-open'), which === 'open');
    show(part(st, 'eyes-closed'), which === 'closed');
    show(part(st, 'eyes-happy'), which === 'happy');
  }
  function setBeak(st, open) {
    show(part(st, 'beak-open'), open);
    show(part(st, 'beak-closed'), !open);
  }
  function pupilTransform(st) {
    var p = part(st, 'pupils');
    if (p) p.style.transform = 'translate(' + st.look[0].toFixed(1) + 'px,' + st.look[1].toFixed(1) + 'px) scale(' + st.pupilScale + ')';
  }

  // ---- циклы покоя ----
  function stopLoops(st) {
    st.loops.forEach(stop);
    st.loops = [];
    clearTimeout(st.blinkTimer);
    st.blinkTimer = 0;
  }
  function headBase(st) { return st.mood === 'think' ? 'rotate(-9deg)' : 'rotate(0deg)'; }
  function startLoops(st) {
    stopLoops(st);
    if (!st.active || !motionOK()) return;
    var hb = headBase(st), T = 3.4;
    st.loops.push(
      anim(part(st, 'body'), { transform: ['scale(1,1)', 'scale(1.012,1.022)', 'scale(1,1)'] }, { duration: T, repeat: Infinity }),
      anim(part(st, 'head'), { transform: [hb + ' translateY(0px)', hb + ' translateY(-5px)', hb + ' translateY(0px)'] }, { duration: T, repeat: Infinity }),
      anim(part(st, 'scarf-front'), { transform: ['translateY(0px)', 'translateY(-3px)', 'translateY(0px)'] }, { duration: T, repeat: Infinity }),
      anim(part(st, 'tassel'), { transform: ['translateY(0px) rotate(0deg)', 'translateY(-3px) rotate(4deg)', 'translateY(0px) rotate(0deg)'] }, { duration: T, repeat: Infinity })
    );
    scheduleBlink(st);
  }
  function scheduleBlink(st) {
    clearTimeout(st.blinkTimer);
    st.blinkTimer = setTimeout(function () {
      if (!st.active || !motionOK()) return;
      doBlink(st);
      scheduleBlink(st);
    }, 3000 + Math.random() * 3000);
  }
  function doBlink(st) {
    if (st.eyes !== 'open' || st.blinking || !motionOK()) return Promise.resolve();
    st.blinking = true;
    setEyes(st, 'closed');
    return new Promise(function (res) {
      setTimeout(function () {
        st.blinking = false;
        if (st.eyes === 'closed') setEyes(st, 'open');
        res();
      }, 130);
    });
  }

  // ---- статичная поза (без движения) ----
  function resetPose(st) {
    ['owl', 'body', 'head', 'wing-r', 'wing-l', 'tassel', 'scarf-front', 'glasses', 'eyes-open'].forEach(function (n) {
      var el = part(st, n);
      if (el) el.style.transform = '';
    });
    st.look = [0, 0];
    st.pupilScale = 1;
    pupilTransform(st);
    clearTimeout(st.sayTimer);
    st.blinking = false;
    setEyes(st, 'open');
    setBeak(st, false);
  }
  function applyMotionMode(st) {
    st.el.classList.toggle('owl-live', motionOK());
    if (!motionOK()) {
      stopLoops(st);
      st.oneShots.forEach(stop);
      st.oneShots = [];
      resetPose(st);
      return;
    }
    applyMood(st, st.mood, true);
  }

  // ---- настроения ----
  function oneShot(st, c) {
    if (!c) return Promise.resolve();
    st.oneShots.push(c);
    return done(c).then(function () { st.oneShots = st.oneShots.filter(function (x) { return x !== c; }); });
  }
  function applyMood(st, name, quiet) {
    var prev = st.mood;
    st.mood = name;
    st.el.setAttribute('data-owl-mood', name);
    if (!motionOK()) { resetPose(st); return Promise.resolve(); }
    var glasses = part(st, 'glasses'), eo = part(st, 'eyes-open'), head = part(st, 'head');
    // лицо
    setBeak(st, name === 'surprised');
    setEyes(st, name === 'happy' ? 'happy' : 'open');
    st.pupilScale = name === 'surprised' ? 1.12 : 1;
    if (name === 'think') st.look = [-5, -6];
    else if (prev === 'think') st.look = [0, 0];
    pupilTransform(st);
    var wide = name === 'surprised' ? 'scale(1.06)' : '';
    if (glasses) glasses.style.transform = wide;
    if (eo) eo.style.transform = wide;
    startLoops(st);
    if (quiet) return Promise.resolve();
    var p = Promise.resolve();
    if (name === 'happy') {
      p = oneShot(st, anim(part(st, 'owl'), { transform: ['translateY(0px)', 'translateY(-34px)', 'translateY(0px)', 'translateY(-12px)', 'translateY(0px)'] }, { duration: 0.8, ease: 'easeOut' }));
    } else if (name === 'surprised') {
      p = oneShot(st, anim(head, { transform: ['rotate(0deg) translateY(0px)', 'rotate(0deg) translateY(-14px)', 'rotate(0deg) translateY(0px)'] }, { duration: 0.35, ease: 'easeOut' }))
        .then(function () { if (st.mood === 'surprised') startLoops(st); });
    } else if (name === 'think' && prev !== 'think') {
      stopLoops(st);
      p = oneShot(st, anim(head, { transform: ['rotate(0deg) translateY(0px)', 'rotate(-9deg) translateY(0px)'] }, { duration: 0.45 })).then(function () { if (st.mood === 'think') startLoops(st); });
    } else if (prev === 'think' && name !== 'think') {
      stopLoops(st);
      p = oneShot(st, anim(head, { transform: ['rotate(-9deg) translateY(0px)', 'rotate(0deg) translateY(0px)'] }, { duration: 0.4 })).then(function () { startLoops(st); });
    } else if (name === 'wave') {
      var waves = 2 + Math.round(Math.random());
      var kf = ['rotate(0deg)', 'rotate(145deg)'];
      for (var i = 0; i < waves; i++) kf.push('rotate(118deg)', 'rotate(145deg)');
      kf.push('rotate(0deg)');
      p = oneShot(st, anim(part(st, 'wing-r'), { transform: kf }, { duration: 0.75 + waves * 0.42 })).then(function () {
        if (st.mood === 'wave') applyMood(st, st.afterWave || 'idle', true);
      });
    }
    return p;
  }

  // ---- монтирование ----
  function setActive(st, on) {
    on = !!on && !d.hidden;
    if (on === st.active) return;
    st.active = on;
    if (on && motionOK()) startLoops(st); else stopLoops(st);
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var st = states.get(en.target);
      if (st) { st.inView = en.isIntersecting; setActive(st, st.inView); }
    });
  }, { rootMargin: '40px' }) : null;

  function mount(el) {
    if (!el) return Promise.reject(new Error('LibraryOwl: нет элемента'));
    if (el.__owlReady) return el.__owlReady;
    injectStyle();
    el.__owlReady = loadSvg().then(function (text) {
      var doc = new DOMParser().parseFromString(text, 'image/svg+xml');
      var svg = d.importNode(doc.documentElement, true);
      var parts = {};
      Array.prototype.forEach.call(svg.querySelectorAll('[id]'), function (n) {
        n.setAttribute('data-part', n.id);
        parts[n.id] = n;
        n.removeAttribute('id');
      });
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.setAttribute('focusable', 'false');
      var decorative = el.getAttribute('aria-hidden') === 'true' || el.hasAttribute('data-owl-decorative');
      if (decorative) svg.setAttribute('aria-hidden', 'true');
      else { svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', el.getAttribute('data-owl-label') || LABEL); }
      if (parts.glasses && parts['eyes-open']) parts.glasses.style.transformOrigin = parts['eyes-open'].style.transformOrigin;
      el.textContent = '';
      el.appendChild(svg);
      el.classList.add('owl');
      var st = {
        el: el, svg: svg, parts: parts, mood: 'idle', eyes: 'open', look: [0, 0], pupilScale: 1,
        loops: [], oneShots: [], blinkTimer: 0, sayTimer: 0, active: false, inView: !io
      };
      states.set(el, st);
      owls.add(st);
      var m = el.getAttribute('data-owl-mood');
      st.mood = MOODS.indexOf(m) >= 0 && m !== 'wave' ? m : 'idle';
      applyMotionMode(st);
      if (io) io.observe(el); else setActive(st, true);
      if (m === 'wave') applyMood(st, 'wave');
      return st;
    });
    el.__owlReady.catch(function () { el.__owlReady = null; });
    return el.__owlReady;
  }
  function withOwl(el, fn) {
    if (el && el.closest) el = el.closest('.owl') || el;
    return mount(el).then(fn);
  }

  // ---- взгляд за указателем (только мышь/трекпад) ----
  var raf = 0, px = 0, py = 0;
  function lookAll() {
    raf = 0;
    owls.forEach(function (st) {
      if (!st.active || !motionOK() || st.eyes !== 'open' || st.mood === 'think') return;
      var g = part(st, 'glasses');
      if (!g || !g.isConnected) return;
      var r = g.getBoundingClientRect();
      var dx = px - (r.left + r.width / 2), dy = py - (r.top + r.height / 2);
      var dist = Math.hypot(dx, dy) || 1;
      var k = Math.min(dist / 320, 1) * 7 / dist;
      st.look = [dx * k, dy * k * 0.8];
      pupilTransform(st);
    });
  }
  function onPointer(e) {
    if (!finePointer.matches || e.pointerType === 'touch') return;
    px = e.clientX; py = e.clientY;
    if (!raf) raf = requestAnimationFrame(lookAll);
  }
  d.addEventListener('pointermove', onPointer, { passive: true });

  // ---- смена режима движения и видимости вкладки ----
  function refreshAll() { owls.forEach(applyMotionMode); }
  if (reduce.addEventListener) reduce.addEventListener('change', refreshAll);
  function watchBody() {
    if (!d.body || !window.MutationObserver) return;
    var last = motionOK();
    new MutationObserver(function () {
      var now = motionOK();
      if (now !== last) { last = now; refreshAll(); }
    }).observe(d.body, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(function () {
      var now = motionOK();
      if (now !== last) { last = now; refreshAll(); }
    }).observe(d.documentElement, { attributes: true, attributeFilter: ['class'] });
  }
  d.addEventListener('visibilitychange', function () {
    owls.forEach(function (st) { setActive(st, !d.hidden && st.inView); });
  });

  window.LibraryOwl = {
    mount: mount,
    mood: function (el, name, holdMs) {
      if (MOODS.indexOf(name) < 0) name = 'idle';
      return withOwl(el, function (st) {
        clearTimeout(st.holdTimer);
        if (name === 'wave') st.afterWave = st.mood === 'wave' ? (st.afterWave || 'idle') : st.mood;
        var p = applyMood(st, name);
        if (holdMs > 0 && name !== 'idle' && name !== 'wave') {
          st.holdTimer = setTimeout(function () { if (st.mood === name) applyMood(st, 'idle'); }, holdMs);
        }
        return p;
      });
    },
    say: function (el, ms) {
      ms = ms > 0 ? ms : 1500;
      return withOwl(el, function (st) {
        clearTimeout(st.sayTimer);
        if (!motionOK()) return new Promise(function (res) { setTimeout(res, ms); });
        var end = Date.now() + ms, open = false;
        return new Promise(function (res) {
          (function step() {
            if (Date.now() >= end || !motionOK()) { setBeak(st, st.mood === 'surprised'); res(); return; }
            open = !open;
            setBeak(st, open);
            st.sayTimer = setTimeout(step, open ? 110 + Math.random() * 70 : 80 + Math.random() * 60);
          })();
        });
      });
    },
    blink: function (el) { return withOwl(el, doBlink); }
  };

  function autoMount() {
    watchBody();
    Array.prototype.forEach.call(d.querySelectorAll('div.owl[data-owl-mood]'), function (el) {
      mount(el).catch(function (e) { if (window.console) console.warn(e); });
    });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', autoMount); else autoMount();
})();
