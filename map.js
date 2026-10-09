/* Карта библиотек Тарского района.
   Использование: window.LibraryMap.mount(el, {dataUrl:'/data/karta-bibliotek.json'})
   Без зависимостей. Анимация только через window.Motion и только когда движение разрешено. */
(function () {
  'use strict';

  var DEFAULTS = {
    dataUrl: '/data/karta-bibliotek.json',
    basemapUrl: '/assets/map/tarskiy-rayon.svg',
    assetBase: '/assets/',          // где лежит mascot/confused-240.*
    linkBase: '',                   // префикс к путям страниц библиотек
    initial: '',                    // id библиотеки, выбранной при открытии (например 'crb')
    heading: 'Библиотеки на карте района'
  };

  var KIND_ORDER = { central: 0, children: 1, city: 2, village: 3 };
  // Смещения (в em) для библиотек, стоящих в одной точке (все библиотеки Тары — в центре города).
  var FAN = [[0, 0], [-1.9, 0.6], [1.9, 0.6], [0, 1.95], [-1.9, -1.3], [1.9, -1.3]];
  var uid = 0;

  function h(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'class') n.className = v;
      else n.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }

  function norm(s) {
    return String(s || '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"().,№\-–—]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function motionOK() {
    var body = document.body;
    if (typeof window.motionAllowed === 'function') { try { if (!window.motionAllowed()) return false; } catch (e) { /* ignore */ } }
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    if (body.classList.contains('access-no-motion') || body.classList.contains('access-mode')) return false;
    return !!(window.Motion && window.Motion.animate);
  }

  function place(lib) {
    return (lib.settlementType ? lib.settlementType + ' ' : '') + lib.settlement;
  }

  // Короткая подпись для списка и маркера
  function shortName(lib) {
    if (lib.kind === 'central') return 'Центральная районная библиотека';
    if (lib.kind === 'children') return 'Детская библиотека';
    if (lib.kind === 'city') return 'Городской филиал № ' + lib.number;
    return lib.settlement + ' · филиал № ' + lib.number;
  }

  function ariaName(lib) {
    var s = lib.name;
    if (lib.name.indexOf(lib.settlement) === -1) s += ', ' + place(lib);
    if (lib.status === 'closed') s += ', закрыта';
    else if (lib.status === 'suspended') s += ', работа приостановлена';
    else if (lib.status === 'unknown') s += ', сведения не опубликованы';
    return s;
  }

  function mount(el, options) {
    if (!el) throw new Error('LibraryMap.mount: нет элемента');
    var opt = {};
    Object.keys(DEFAULTS).forEach(function (k) { opt[k] = DEFAULTS[k]; });
    Object.keys(options || {}).forEach(function (k) { opt[k] = options[k]; });
    var id = 'lm' + (++uid);

    el.classList.add('lm');
    el.setAttribute('aria-busy', 'true');
    el.innerHTML = '';
    var loading = h('p', { class: 'lm-status', text: 'Загружаем список библиотек…' });
    el.appendChild(loading);

    var dataP = fetch(opt.dataUrl, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
    var svgP = fetch(opt.basemapUrl, { credentials: 'same-origin' }).then(function (r) {
      return r.ok ? r.text() : '';
    }).catch(function () { return ''; });

    return Promise.all([dataP, svgP]).then(function (res) {
      render(el, opt, id, res[0], res[1]);
      el.removeAttribute('aria-busy');
      return el.__libraryMap;
    }).catch(function () {
      el.removeAttribute('aria-busy');
      loading.textContent = 'Не удалось загрузить список библиотек. Обновите страницу или позвоните в центральную библиотеку: ';
      loading.appendChild(h('a', { href: 'tel:+73817121242', text: '8 (38171) 2-12-42' }));
    });
  }

  function render(el, opt, id, data, svgText) {
    var libs = (data.libraries || []).slice();
    var open = libs.filter(function (l) { return l.status !== 'closed'; });
    var closed = libs.filter(function (l) { return l.status === 'closed'; });
    var inTown = open.filter(function (l) { return l.kind !== 'village'; })
      .sort(function (a, b) { return (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || ((a.number || 0) - (b.number || 0)); });
    var villages = open.filter(function (l) { return l.kind === 'village'; })
      .sort(function (a, b) { return a.settlement.localeCompare(b.settlement, 'ru'); });
    closed.sort(function (a, b) { return a.settlement.localeCompare(b.settlement, 'ru'); });

    var byId = {};
    libs.forEach(function (l) {
      byId[l.id] = l;
      l._q = norm([l.name, l.settlement, l.settlementType + ' ' + l.settlement, (l.aliases || []).join(' '), l.address, l.number ? 'филиал ' + l.number : ''].join(' '));
    });

    el.innerHTML = '';

    /* ---------- поиск ---------- */
    var inputId = id + '-q';
    var input = h('input', { id: inputId, class: 'lm-input', type: 'search', autocomplete: 'off', spellcheck: 'false',
      'aria-describedby': id + '-count', 'aria-controls': id + '-list', enterkeyhint: 'search' });
    var count = h('p', { id: id + '-count', class: 'lm-count', 'aria-live': 'polite' });
    var search = h('div', { class: 'lm-search', role: 'search' }, [
      h('label', { for: inputId, class: 'lm-label', text: 'Найдите своё село' }),
      h('div', { class: 'lm-input-wrap' }, [input]),
      count
    ]);

    /* ---------- карта ---------- */
    var proj = null, mapBox = null, markerLayer = null, mapFig = null;
    var markers = {};
    if (svgText) {
      var tmp = document.createElement('div');
      tmp.innerHTML = svgText.trim();
      var svg = tmp.querySelector('svg');
      if (svg) {
        try { proj = JSON.parse(svg.getAttribute('data-projection')); } catch (e) { proj = null; }
      }
      if (svg && proj) {
        svg.removeAttribute('data-projection');
        svg.setAttribute('class', 'lm-basemap');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        var vb = proj.viewBox || [0, 0, proj.width, proj.height];
        mapBox = h('div', { class: 'lm-mapbox' });
        mapBox.style.aspectRatio = vb[2] + ' / ' + vb[3];
        mapBox.appendChild(svg);
        markerLayer = h('div', { class: 'lm-markers' });
        mapBox.appendChild(markerLayer);

        var groups = {};
        open.forEach(function (l) {
          if (!l.geo) return;
          var key = l.geo.lat + ',' + l.geo.lon;
          (groups[key] = groups[key] || []).push(l);
        });
        Object.keys(groups).forEach(function (key) {
          var g = groups[key].sort(function (a, b) { return (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || ((a.number || 0) - (b.number || 0)); });
          g.forEach(function (l, i) {
            var x = (l.geo.lon - proj.minLon) * proj.k * proj.scale + proj.pad;
            var y = (proj.maxLat - l.geo.lat) * proj.scale + proj.pad;
            var fan = FAN[i] || [0, 0];
            var cls = 'lm-marker lm-' + l.kind + (l.central ? ' is-central' : '') + (l.status !== 'open' ? ' is-' + l.status : '');
            var b = h('button', { type: 'button', class: cls, 'aria-label': ariaName(l), 'aria-pressed': 'false', 'data-id': l.id },
              [h('span', { class: 'lm-dot', 'aria-hidden': 'true' }), h('span', { class: 'lm-tip', 'aria-hidden': 'true', text: l.kind === 'village' ? l.settlement : shortName(l) })]);
            b.style.left = ((x - vb[0]) / vb[2] * 100).toFixed(3) + '%';
            b.style.top = ((y - vb[1]) / vb[3] * 100).toFixed(3) + '%';
            b.style.setProperty('--dx', fan[0] + 'em');
            b.style.setProperty('--dy', fan[1] + 'em');
            b.addEventListener('click', function () { select(l.id, 'map'); });
            markers[l.id] = b;
          });
        });
        // порядок Tab: сначала библиотеки Тары (центральная первой), затем сёла по алфавиту
        var ordered = inTown.concat(villages).filter(function (l) { return markers[l.id]; });
        ordered.forEach(function (l) { markerLayer.appendChild(markers[l.id]); });
        var town = inTown.filter(function (l) { return l.geo; })[0];
        if (town) {
          var tl = h('span', { class: 'lm-townlabel', 'aria-hidden': 'true', text: town.settlement });
          tl.style.left = markers[town.id].style.left;
          tl.style.top = markers[town.id].style.top;
          markerLayer.insertBefore(tl, markerLayer.firstChild);
        }

        var attr = data.attribution || {};
        mapFig = h('figure', { class: 'lm-map' }, [
          h('a', { class: 'lm-skip', href: '#' + id + '-list', text: 'Перейти к списку библиотек' }),
          mapBox,
          h('figcaption', { class: 'lm-caption' }, [
            h('span', { text: 'Точка — центр населённого пункта, а не здание библиотеки. Библиотеки Тары показаны рядом друг с другом, адреса — в карточке. Северная часть района на карте не показана.' })
          ])
        ]);
        mapBox.appendChild(h('a', { class: 'lm-attr-inline', href: attr.url || 'https://www.openstreetmap.org/copyright', rel: 'noopener', target: '_blank', text: attr.text || '© участники OpenStreetMap' }));
      }
    }

    /* ---------- карточка ---------- */
    var card = h('div', { class: 'lm-card', id: id + '-card', 'aria-live': 'polite', tabindex: '-1' });
    var cardHint = h('p', { class: 'lm-card-hint', text: 'Выберите библиотеку на карте или в списке — здесь появятся адрес, телефон и режим работы.' });
    card.appendChild(cardHint);

    /* ---------- список ---------- */
    var list = h('div', { class: 'lm-list', id: id + '-list', tabindex: '-1' });
    var items = {};
    function group(title, arr, extraClass) {
      if (!arr.length) return null;
      var ul = h('ul', { class: 'lm-items' });
      arr.forEach(function (l) {
        var label = l.kind === 'village'
          ? [h('span', { class: 'lm-item-place', text: l.settlement }), h('span', { class: 'lm-item-sub', text: 'филиал № ' + l.number })]
          : [h('span', { class: 'lm-item-place', text: shortName(l) }), h('span', { class: 'lm-item-sub', text: l.address })];
        if (l.status === 'suspended') label.push(h('span', { class: 'lm-badge', text: 'работа приостановлена' }));
        if (l.status === 'unknown') label.push(h('span', { class: 'lm-badge', text: 'нет сведений' }));
        if (l.status === 'closed') label.push(h('span', { class: 'lm-badge', text: 'закрыта' }));
        var b = h('button', { type: 'button', class: 'lm-item' + (l.central ? ' is-central' : ''), 'aria-pressed': 'false', 'data-id': l.id, 'aria-label': ariaName(l) }, label);
        b.addEventListener('click', function () { select(l.id, 'list'); });
        var li = h('li', null, [b]);
        items[l.id] = li;
        ul.appendChild(li);
      });
      var gid = id + '-g' + Math.random().toString(36).slice(2, 7);
      ul.setAttribute('aria-labelledby', gid);
      return h('section', { class: 'lm-group' + (extraClass ? ' ' + extraClass : '') }, [h('h3', { id: gid, class: 'lm-group-title', text: title }), ul]);
    }
    var gTown = group('В Таре', inTown);
    var gVill = group('В сёлах района', villages);
    var gClosed = group('Закрытые филиалы', closed, 'lm-group-closed');
    [gTown, gVill, gClosed].forEach(function (g) { if (g) list.appendChild(g); });

    var empty = h('div', { class: 'lm-empty', hidden: true }, [
      h('picture', { class: 'lm-owl' }, [
        h('source', { type: 'image/avif', srcset: opt.assetBase + 'mascot/confused-240.avif' }),
        h('source', { type: 'image/webp', srcset: opt.assetBase + 'mascot/confused-240.webp' }),
        h('img', { src: opt.assetBase + 'mascot/confused-240.webp', alt: '', width: '120', height: '120', loading: 'lazy', decoding: 'async' })
      ]),
      h('div', null, [
        h('p', { class: 'lm-empty-title', text: 'Такого села не нашлось' }),
        h('p', null, ['Проверьте написание или позвоните в центральную библиотеку: ', h('a', { href: 'tel:+73817121242', text: '8 (38171) 2-12-42' })])
      ])
    ]);
    list.appendChild(empty);

    /* ---------- сборка ---------- */
    var mainCol = h('div', { class: 'lm-main' }, [mapFig, card]);
    var side = h('div', { class: 'lm-side' }, [list]);
    el.appendChild(search);
    el.appendChild(h('div', { class: 'lm-body' + (mapFig ? '' : ' no-map') }, [mainCol, side]));

    /* ---------- поведение ---------- */
    var selected = '';
    function select(libId, from) {
      var l = byId[libId];
      if (!l) return;
      if (selected && markers[selected]) { markers[selected].classList.remove('is-selected'); markers[selected].setAttribute('aria-pressed', 'false'); }
      if (selected && items[selected]) { items[selected].firstChild.classList.remove('is-selected'); items[selected].firstChild.setAttribute('aria-pressed', 'false'); }
      selected = libId;
      if (markers[libId]) { markers[libId].classList.add('is-selected'); markers[libId].setAttribute('aria-pressed', 'true'); }
      if (items[libId]) { items[libId].firstChild.classList.add('is-selected'); items[libId].firstChild.setAttribute('aria-pressed', 'true'); }
      fillCard(l);
      var smooth = motionOK() ? 'smooth' : 'auto';
      if (from === 'map' && items[libId]) {
        var li = items[libId], box = list.getBoundingClientRect(), r = li.getBoundingClientRect();
        if (list.scrollHeight > list.clientHeight + 4 && (r.top < box.top || r.bottom > box.bottom)) {
          list.scrollTo({ top: li.offsetTop - list.offsetTop - 8, behavior: smooth });
        }
      }
      if (from) {
        var cr = card.getBoundingClientRect();
        if (cr.top < 0 || cr.bottom > (window.innerHeight || document.documentElement.clientHeight)) {
          card.scrollIntoView({ block: 'nearest', behavior: smooth });
        }
      }
      try { el.dispatchEvent(new CustomEvent('librarymap:select', { detail: { id: libId, library: l } })); } catch (e) { /* старые браузеры */ }
    }

    function row(term, value) {
      return [h('dt', { text: term }), h('dd', null, [].concat(value))];
    }

    function fillCard(l) {
      card.innerHTML = '';
      var kids = [h('h3', { class: 'lm-card-title', text: l.name })];
      if (l.name.indexOf(l.settlement) === -1 || l.kind !== 'village') kids.push(h('p', { class: 'lm-card-place', text: place(l) }));
      if (l.statusNote) kids.push(h('p', { class: 'lm-card-status', text: l.statusNote }));
      var dl = h('dl', { class: 'lm-card-facts' });
      if (l.address) {
        var addr = (l.postcode ? l.postcode + ', ' : '') + place(l) + ', ' + l.address;
        row('Адрес', addr).forEach(function (n) { dl.appendChild(n); });
      }
      if (l.phone) {
        row('Телефон', l.phoneHref ? h('a', { href: 'tel:' + l.phoneHref, text: l.phone }) : l.phone).forEach(function (n) { dl.appendChild(n); });
      }
      if (l.hours && l.hours.length) {
        var ul = h('ul', { class: 'lm-hours' });
        l.hours.forEach(function (t) { ul.appendChild(h('li', { text: t })); });
        row('Режим работы', ul).forEach(function (n) { dl.appendChild(n); });
      } else if (l.status === 'open') {
        row('Режим работы', 'не опубликован, уточните по телефону').forEach(function (n) { dl.appendChild(n); });
      }
      if (dl.childNodes.length) kids.push(dl);
      (l.notes || []).forEach(function (t) { kids.push(h('p', { class: 'lm-card-note', text: t })); });
      if (l.path) kids.push(h('p', { class: 'lm-card-link' }, [h('a', { href: opt.linkBase + l.path, text: 'Страница библиотеки' })]));
      kids.forEach(function (k) { card.appendChild(k); });
      card.classList.add('is-filled');
    }

    var total = open.length;
    function filter() {
      var q = norm(input.value);
      var shown = 0, shownClosed = 0;
      libs.forEach(function (l) {
        var ok = !q || l._q.indexOf(q) !== -1;
        if (items[l.id]) items[l.id].hidden = !ok;
        if (markers[l.id]) markers[l.id].classList.toggle('is-dim', !!q && !ok);
        if (markers[l.id]) markers[l.id].classList.toggle('is-match', !!q && ok);
        if (ok && l.status !== 'closed') shown++;
        if (ok && l.status === 'closed') shownClosed++;
      });
      [gTown, gVill, gClosed].forEach(function (g) {
        if (!g) return;
        g.hidden = !g.querySelector('li:not([hidden])');
      });
      empty.hidden = shown + shownClosed > 0;
      if (!q) count.textContent = 'Всего ' + plural(total, 'библиотека', 'библиотеки', 'библиотек') + (closed.length ? ' и ' + plural(closed.length, 'закрытый филиал', 'закрытых филиала', 'закрытых филиалов') : '');
      else if (shown + shownClosed === 0) count.textContent = 'Ничего не найдено';
      else count.textContent = 'Найдено: ' + plural(shown + shownClosed, 'библиотека', 'библиотеки', 'библиотек');
      // Если найдена ровно одна — сразу показываем её карточку
      if (q && shown + shownClosed === 1) {
        var one = libs.filter(function (l) { return items[l.id] && !items[l.id].hidden; })[0];
        if (one && one.id !== selected) select(one.id, '');
      }
    }
    input.addEventListener('input', filter);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && input.value) { input.value = ''; filter(); e.preventDefault(); }
      if (e.key === 'Enter') {
        e.preventDefault();
        var first = list.querySelector('li:not([hidden]) .lm-item');
        if (first) first.focus();
      }
    });
    filter();

    // Мягкое появление маркеров — только через Motion и только если движение разрешено
    if (markerLayer && motionOK()) {
      try {
        var dots = markerLayer.querySelectorAll('.lm-dot');
        window.Motion.animate(dots, { opacity: [0, 1], transform: ['scale(0.5)', 'scale(1)'] },
          { duration: 0.45, delay: window.Motion.stagger ? window.Motion.stagger(0.02) : 0, easing: [0.22, 1, 0.36, 1] });
      } catch (e) { /* без анимации */ }
    }

    var api = {
      select: function (libId) { select(libId, 'api'); },
      filter: function (q) { input.value = q || ''; filter(); },
      data: data
    };
    el.__libraryMap = api;
    if (opt.initial && byId[opt.initial]) select(opt.initial, '');
  }

  function plural(n, one, few, many) {
    var m10 = n % 10, m100 = n % 100;
    var w = (m10 === 1 && m100 !== 11) ? one : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) ? few : many;
    return n + ' ' + w;
  }

  window.LibraryMap = { mount: mount, version: '1.0' };
})();
