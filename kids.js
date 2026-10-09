// «Детям» (/detyam/): the hub, «Что почитать?», the literary quiz and reader badges. Loaded by app.js only on these pages.
// Data (edited by the library, docs/DETYAM.md): /data/chto-pochitat.json, /data/viktorina.json, /data/znachki.json.
// Uses from app.js: esc, pathOf, motionAllowed, catalog, window.libraryLoadOwl. Badges live in localStorage 'taralib-badges'
// on this device only (no accounts, no personal data); without localStorage everything works, badges are just not remembered.
(function () {
  'use strict';
  if (window.__kidsStarted) return;
  window.__kidsStarted = true;
  const KEY = 'taralib-badges';
  const h = s => (typeof esc === 'function' ? esc(s) : String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]));
  const linkTo = key => (typeof pathOf === 'function' ? pathOf(key) : '/');
  const motionOk = () => (typeof motionAllowed === 'function' ? motionAllowed() : !matchMedia('(prefers-reduced-motion: reduce)').matches);
  const catalogUrl = typeof catalog === 'string' ? catalog : 'http://opac.omsklib.ru/cgiopac/opacg/opac.exe?arg0=BIS00&arg1=BIS00&TypeAccess=PayAccess';
  const arrowSvg = '<svg aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg>';
  const extSvg = '<svg class="i-ext" aria-hidden="true" focusable="false"><use href="#i-external"/></svg>';
  const pageKey = (document.getElementById('page') || {}).dataset?.page || document.documentElement.dataset.page || '';
  const params = new URLSearchParams(location.search);
  let uid = 0;
  const nextId = p => p + '-' + (++uid);

  // ---------- storage ----------
  let canStore = true;
  let state;
  function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY) || '{}'); state = d && typeof d === 'object' && !Array.isArray(d) ? d : {}; }
    catch { state = {}; canStore = false; }
    state.earned = state.earned && typeof state.earned === 'object' ? state.earned : {};
    state.quizzes = state.quizzes && typeof state.quizzes === 'object' ? state.quizzes : {};
    state.shown = Array.isArray(state.shown) ? state.shown : [];
    state.visits = Array.isArray(state.visits) ? state.visits : [];
    return state;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); canStore = true; } catch { canStore = false; }
  }
  load();
  try { localStorage.setItem(KEY + '-test', '1'); localStorage.removeItem(KEY + '-test'); } catch { canStore = false; }

  const getJson = url => fetch(url, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  let badgesData;
  const badgesReady = () => badgesData ??= getJson('/data/znachki.json').catch(() => null);

  // ---------- badges ----------
  const rules = {
    'подбор книг': d => !!d.picker,
    'викторина': d => Object.values(d.quizzes).some(q => q && q.done),
    'викторина без ошибок': d => Object.values(d.quizzes).some(q => q && q.done && q.best > 0 && q.best === q.total),
    'все викторины': d => Array.isArray(d.quizIds) && d.quizIds.length > 0 && d.quizIds.every(id => d.quizzes[id] && d.quizzes[id].done),
    'афиша': d => d.visits.includes('Афиша'),
    'библиотеки': d => d.visits.includes('Филиалы') || !!d.map,
    'пять разделов': d => new Set(d.visits).size >= 5,
    'код в библиотеке': d => !!d.kod,
  };
  const today = () => new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Omsk', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  // Grants every badge whose rule holds; announces those not shown before (also ones earned on other pages of the site).
  function checkBadges() {
    return badgesReady().then(data => {
      if (!data || !Array.isArray(data['значки'])) return [];
      load();
      for (const b of data['значки']) {
        const rule = rules[b['правило']];
        if (rule && !state.earned[b.id] && rule(state)) state.earned[b.id] = today();
      }
      const fresh = data['значки'].filter(b => state.earned[b.id] && !state.shown.includes(b.id));
      if (fresh.length) { state.shown.push(...fresh.map(b => b.id)); }
      save();
      fresh.forEach((b, i) => setTimeout(() => celebrate(b), i * 2400));
      updateCount(data);
      return fresh;
    });
  }
  function updateCount(data) {
    const n = data['значки'].filter(b => state.earned[b.id]).length, total = data['значки'].length;
    document.querySelectorAll('[data-kids-count]').forEach(el => { el.textContent = `Собрано: ${n} из ${total}`; el.hidden = false; });
  }
  const badgePic = (id, locked, size = 192, alt = '') => {
    const b = '/assets/badges/' + id + (locked ? '-locked' : '');
    if (locked) return `<picture><source type="image/avif" srcset="${b}-192.avif"><img src="${b}-192.webp" width="192" height="192" alt="${h(alt)}" loading="lazy" decoding="async"></picture>`;
    return `<picture><source type="image/avif" srcset="${b}-96.avif 96w, ${b}-192.avif 192w, ${b}-384.avif 384w" sizes="${size}px"><img src="${b}-192.webp" srcset="${b}-96.webp 96w, ${b}-192.webp 192w, ${b}-384.webp 384w" sizes="${size}px" width="192" height="192" alt="${h(alt)}" loading="lazy" decoding="async"></picture>`;
  };

  // ---------- toast and owl ----------
  let toastBox;
  function toastRegion() {
    if (toastBox && toastBox.isConnected) return toastBox;
    toastBox = document.createElement('div');
    toastBox.className = 'kids-toasts';
    toastBox.setAttribute('role', 'status');
    toastBox.setAttribute('aria-live', 'polite');
    document.body.append(toastBox);
    return toastBox;
  }
  function celebrate(b) {
    const box = toastRegion();
    const t = document.createElement('div');
    t.className = 'kids-toast';
    t.innerHTML = `<span class="kids-toast-badge" aria-hidden="true">${badgePic(b.id, false, 72)}</span><span><strong>Новый значок!</strong> ${h(b['название'])}</span><button type="button" class="kids-toast-close" aria-label="Закрыть сообщение">×</button>`;
    box.append(t);
    t.querySelector('button').addEventListener('click', () => t.remove());
    const art = t.querySelector('.kids-toast-badge');
    if (motionOk() && window.Motion) {
      window.Motion.animate(t, { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });
      window.Motion.animate(art, { scale: [0.4, 1.12, 1], rotate: [-12, 6, 0] }, { duration: 0.6, ease: 'easeOut' });
    }
    document.querySelectorAll(`[data-badge-card="${b.id}"]`).forEach(card => {
      if (motionOk() && window.Motion) window.Motion.animate(card.querySelector('.kids-badge-art') || card, { scale: [0.7, 1.08, 1] }, { duration: 0.55, ease: 'easeOut' });
    });
    owlMood('happy', 1800);
    setTimeout(() => t.remove(), 7000);
  }
  let owlEl = null;
  function mountOwl(el) {
    if (!el || !window.libraryLoadOwl) return Promise.resolve(null);
    owlEl = el;
    return window.libraryLoadOwl().then(O => (O ? O.mount(el).then(() => O) : null)).catch(() => null);
  }
  function owlMood(mood, hold) {
    if (!owlEl || !window.LibraryOwl) return;
    window.LibraryOwl.mood(owlEl, mood, hold).catch(() => {});
  }
  function owlSay(ms) { if (owlEl && window.LibraryOwl) window.LibraryOwl.say(owlEl, ms).catch(() => {}); }

  const failNote = what => `<div class="kids-empty"><p><strong>Не удалось загрузить ${what}.</strong> Проверьте интернет и обновите страницу.</p><p><a class="text-link" href="${linkTo('ask')}">Спросить библиотекаря</a></p></div>`;
  const app = document.querySelector('#page [data-kids]');

  // ---------- hub ----------
  function initHub() {
    const el = document.querySelector('#page [data-kids-owl]');
    mountOwl(el).then(O => { if (!O) return; O.mood(el, 'wave'); O.say(el, 2200); });
    checkBadges();
  }

  // ---------- «Что почитать?» ----------
  function initBooks(root) {
    root.innerHTML = '<p class="page-loading">Загружаем списки…</p>';
    getJson('/data/chto-pochitat.json').then(d => renderBooks(root, d)).catch(() => { root.innerHTML = failNote('списки книг'); });
  }
  function renderBooks(root, d) {
    const ages = Array.isArray(d['возрасты']) ? d['возрасты'] : [], genres = Array.isArray(d['жанры']) ? d['жанры'] : [];
    const lists = Object.fromEntries((Array.isArray(d['списки']) ? d['списки'] : []).map(l => [l.id, l]));
    const books = (Array.isArray(d['книги']) ? d['книги'] : []).filter(b => b && b['название'] && Array.isArray(b['возраст']) && Array.isArray(b['жанры']));
    let age = ages.some(a => a.id === params.get('age')) ? params.get('age') : '';
    let genre = genres.some(g => g.id === params.get('genre')) ? params.get('genre') : '';
    const count = (a, g) => books.filter(b => b['возраст'].includes(a) && b['жанры'].includes(g)).length;
    const n = nextId('kb');
    root.innerHTML = `<div class="kids-picker">
<fieldset class="kids-choice kids-ages"><legend><span class="kids-step">Шаг 1</span> Сколько тебе лет?</legend><div class="kids-options">${ages.map(a => `<label class="kids-option kids-age"><input type="radio" name="${n}-age" value="${h(a.id)}"${a.id === age ? ' checked' : ''}><span><strong>${h(a['название'])}</strong>${a['подпись'] ? `<small>${h(a['подпись'])}</small>` : ''}</span></label>`).join('')}</div></fieldset>
<fieldset class="kids-choice kids-genres"${age ? '' : ' hidden'}><legend><span class="kids-step">Шаг 2</span> Что ты любишь читать?</legend><div class="kids-options kids-genre-grid">${genres.map(g => `<label class="kids-option kids-genre"><input type="radio" name="${n}-genre" value="${h(g.id)}"${g.id === genre ? ' checked' : ''}><span class="kids-genre-art" aria-hidden="true"><picture><source type="image/avif" srcset="/assets/genres/${h(g.id)}-160.avif 180w, /assets/genres/${h(g.id)}-320.avif 360w" sizes="(max-width: 600px) 96px, 140px"><img src="/assets/genres/${h(g.id)}-160.webp" srcset="/assets/genres/${h(g.id)}-160.webp 180w, /assets/genres/${h(g.id)}-320.webp 360w" sizes="(max-width: 600px) 96px, 140px" width="360" height="320" alt="" loading="lazy" decoding="async"></picture></span><span class="kids-genre-text"><strong>${h(g['название'])}</strong><small data-genre-count="${h(g.id)}"></small></span></label>`).join('')}</div></fieldset>
<div class="kids-picker-status"><div class="kids-picker-owl" data-picker-owl aria-hidden="true"></div><p class="kids-result-note" aria-live="polite"></p></div>
<div class="kids-results" tabindex="-1"></div></div>`;
    const genresBox = root.querySelector('.kids-genres'), note = root.querySelector('.kids-result-note'), out = root.querySelector('.kids-results');
    const updateCounts = () => root.querySelectorAll('[data-genre-count]').forEach(s => { const c = age ? count(age, s.dataset.genreCount) : 0; s.textContent = age ? (c ? `${c} ${plural(c, 'книга', 'книги', 'книг')}` : 'пока нет подборки') : ''; });
    const syncUrl = () => { try { const u = new URL(location.href); u.searchParams.delete('age'); u.searchParams.delete('genre'); if (age) u.searchParams.set('age', age); if (genre) u.searchParams.set('genre', genre); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch {} };
    const show = () => {
      updateCounts(); syncUrl();
      if (!age || !genre) { out.innerHTML = ''; note.textContent = age ? 'Теперь выбери жанр.' : ''; return; }
      const a = ages.find(x => x.id === age), g = genres.find(x => x.id === genre);
      const found = books.filter(b => b['возраст'].includes(age) && b['жанры'].includes(genre));
      if (!found.length) {
        note.textContent = `${g['название']}, ${a['название']}: подборки пока нет.`;
        out.innerHTML = `<div class="kids-empty"><p><strong>Пока подборки нет — спросите библиотекаря.</strong> Мы показываем только книги из списков, которые составила библиотека.</p><p><a class="button dark" href="${linkTo('ask')}">Спросить библиотекаря ${arrowSvg}</a></p><p>Или выберите другой жанр выше.</p></div>`;
        return;
      }
      note.textContent = `${g['название']}, ${a['название']}: ${found.length} ${plural(found.length, 'книга', 'книги', 'книг')}.`;
      const usedLists = [...new Set(found.map(b => b['список']))].map(id => lists[id]).filter(Boolean);
      out.innerHTML = `<h2 class="kids-results-title">${h(g['название'])} · ${h(a['название'])}</h2><ul class="kids-books">${found.map(bookCard).join('')}</ul>
<div class="kids-sources"><h3>Откуда эти книги</h3><ul>${usedLists.map(l => `<li><a href="${h(l['адрес'])}" target="_blank" rel="noopener">${h(l['название'])}${extSvg}</a>${l['кто составил'] ? ` <small>${h(l['кто составил'])}</small>` : ''}</li>`).join('')}</ul><p>Наличие книги уточните в каталоге или у библиотекаря: <a href="tel:+73817122020">+7 (38171) 2-20-20</a>.</p></div>`;
      out.querySelectorAll('[data-copy]').forEach(btn => btn.addEventListener('click', () => copyText(btn)));
      if (!state.picker) { state.picker = true; save(); }
      checkBadges();
      owlMood('happy', 1500);
    };
    const bookCard = b => {
      const surname = String(b['автор'] || '').split(',')[0].trim();
      const query = [surname, String(b['название']).replace(/[«»"„“.…]/g, '').trim()].filter(Boolean).join(' ');
      const id = nextId('book');
      return `<li class="kids-book"><h3 id="${id}">${h(b['название'])}</h3>${b['автор'] ? `<p class="kids-book-author">${h(b['автор'])}</p>` : ''}${b['о книге'] ? `<p>${h(b['о книге'])}</p>` : ''}${b['где напечатано'] ? `<p class="kids-book-where">${h(b['где напечатано'])}</p>` : ''}<div class="kids-book-actions"><a class="button small outline" href="${h(catalogUrl)}" target="_blank" rel="noopener" aria-describedby="${id}">Найти в каталоге ${extSvg}</a><button type="button" class="kids-copy" data-copy="${h(query)}" aria-describedby="${id}">Скопировать для поиска</button></div><p class="kids-book-query">В каталоге наберите: <span>${h(query)}</span></p></li>`;
    };
    root.querySelectorAll(`[name="${n}-age"]`).forEach(r => r.addEventListener('change', () => {
      age = r.value; const first = genresBox.hidden; genresBox.hidden = false; show();
      if (first) { owlMood('think', 1200); }
    }));
    root.querySelectorAll(`[name="${n}-genre"]`).forEach(r => r.addEventListener('change', () => { genre = r.value; show(); }));
    if (age) show(); else updateCounts();
    mountOwl(root.querySelector('[data-picker-owl]'));
  }
  const plural = (n, one, few, many) => { const a = n % 10, b = n % 100; return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many; };
  function copyText(btn) {
    const text = btn.dataset.copy, done = ok => { const old = btn.dataset.label || btn.textContent; btn.dataset.label = old; btn.textContent = ok ? 'Скопировано' : 'Выделите текст ниже'; setTimeout(() => { btn.textContent = old; }, 2200); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => done(true), () => done(false));
    else {
      const span = btn.closest('.kids-book')?.querySelector('.kids-book-query span');
      if (span) { const r = document.createRange(); r.selectNodeContents(span); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
      let ok = false; try { ok = document.execCommand('copy'); } catch {}
      done(ok);
    }
  }

  // ---------- quiz ----------
  const kinds = { 'эмодзи': 'Угадай по эмодзи', 'кто сказал': 'Кто это сказал?', 'правда или выдумка': 'Правда или выдумка?', 'порядок': 'Что было раньше?', 'найди лишнего': 'Найди лишнего', 'выбор': 'Выбери ответ' };
  const visit = 'Приходите в детскую библиотеку: Тара, ул. Александровская, 58. Пн–пт 09:00–18:00, вс 10:00–17:00, суббота — выходной. Телефон <a href="tel:+73817122020">+7 (38171) 2-20-20</a>.';
  function initQuiz(root) {
    root.innerHTML = '<p class="page-loading">Загружаем вопросы…</p>';
    getJson('/data/viktorina.json').then(d => {
      const quizzes = (Array.isArray(d['викторины']) ? d['викторины'] : []).map(q => ({ ...q, 'вопросы': (Array.isArray(q['вопросы']) ? q['вопросы'] : []).filter(x => x && x['вопрос'] && Array.isArray(x['варианты']) && x['варианты'].includes(x['ответ'])) })).filter(q => q.id && q['вопросы'].length);
      load(); state.quizIds = quizzes.map(q => q.id); save();
      const pick = quizzes.find(q => q.id === params.get('v'));
      if (pick) runQuiz(root, pick, quizzes); else quizMenu(root, quizzes);
    }).catch(() => { root.innerHTML = failNote('вопросы викторины'); });
  }
  function quizMenu(root, quizzes, focus) {
    load();
    root.innerHTML = `<div class="kids-quiz-menu"><h2>Выбери викторину</h2><ul class="kids-quiz-list">${quizzes.map((q, i) => { const s = state.quizzes[q.id]; return `<li><button type="button" class="kids-quiz-pick t-${['sun', 'sky', 'rowan', 'teal', 'sun'][i % 5]}" data-quiz="${h(q.id)}"><span class="kids-quiz-age">${h(q['возраст'] || '')}</span><strong>${h(q['название'])}</strong><small>${h(q['описание'] || '')}</small><span class="kids-quiz-meta">${q['вопросы'].length} ${plural(q['вопросы'].length, 'вопрос', 'вопроса', 'вопросов')}${s && s.done ? ` · лучший результат: ${s.best} из ${s.total}` : ''}</span></button></li>`; }).join('')}</ul></div>`;
    root.querySelectorAll('[data-quiz]').forEach(b => b.addEventListener('click', () => { const q = quizzes.find(x => x.id === b.dataset.quiz); setQuizUrl(q.id); runQuiz(root, q, quizzes); }));
    if (focus) root.querySelector('h2')?.setAttribute('tabindex', '-1'), root.querySelector('h2')?.focus();
  }
  function setQuizUrl(id) { try { const u = new URL(location.href); if (id) u.searchParams.set('v', id); else u.searchParams.delete('v'); history.replaceState(history.state, '', u.pathname + u.search); } catch {} }
  function runQuiz(root, quiz, quizzes) {
    const qs = quiz['вопросы'], total = qs.length, n = nextId('q');
    let i = 0, score = 0;
    const sources = [];
    root.innerHTML = `<div class="kids-quiz"><div class="kids-quiz-top"><p class="kids-quiz-name"><strong>${h(quiz['название'])}</strong> <span>${h(quiz['возраст'] || '')}</span></p><p class="kids-quiz-count" id="${n}-count"></p><div class="kids-progress" role="progressbar" aria-labelledby="${n}-count" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0"><span></span></div></div><div class="kids-quiz-stage"><div class="kids-quiz-owl" data-quiz-owl aria-hidden="true"></div><div class="kids-quiz-card" tabindex="-1"></div></div></div>`;
    const card = root.querySelector('.kids-quiz-card'), bar = root.querySelector('.kids-progress'), countEl = root.querySelector('.kids-quiz-count');
    mountOwl(root.querySelector('[data-quiz-owl]'));
    const progress = done => { bar.setAttribute('aria-valuenow', String(done)); bar.firstElementChild.style.width = (done / total * 100) + '%'; };
    const ask = () => {
      const q = qs[i];
      countEl.textContent = `Вопрос ${i + 1} из ${total}`;
      progress(i);
      card.innerHTML = `<fieldset class="kids-q"><legend><span class="kids-kind">${h(kinds[q['вид']] || kinds['выбор'])}</span><span class="kids-qtext">${h(q['вопрос'])}</span></legend><div class="kids-answers">${q['варианты'].map((v, k) => `<label class="kids-answer"><input type="radio" name="${n}-a${i}" value="${k}"><span>${h(v)}</span></label>`).join('')}</div></fieldset><div class="kids-q-actions"><button type="button" class="button dark" data-answer disabled>Ответить</button></div><div class="kids-feedback" aria-live="polite"></div>`;
      const btn = card.querySelector('[data-answer]'), radios = [...card.querySelectorAll('input')];
      let thinking = false;
      radios.forEach(r => r.addEventListener('change', () => { btn.disabled = false; if (!thinking) { thinking = true; owlMood('think'); } }));
      btn.addEventListener('click', () => {
        const chosen = radios.find(r => r.checked); if (!chosen) return;
        const right = q['варианты'][+chosen.value] === q['ответ'];
        if (right) score++;
        if (q['источник'] && !sources.some(s => s.url === q['источник'])) sources.push({ url: q['источник'], title: q['книга'] || q['источник'] });
        radios.forEach(r => { r.disabled = true; const l = r.closest('label'), ok = q['варианты'][+r.value] === q['ответ']; if (ok) { l.classList.add('is-right'); l.insertAdjacentHTML('beforeend', '<em class="kids-mark">верный ответ</em>'); } else if (r.checked) { l.classList.add('is-wrong'); l.insertAdjacentHTML('beforeend', '<em class="kids-mark">ваш ответ</em>'); } });
        owlMood(right ? 'happy' : 'surprised', 1600);
        const fb = card.querySelector('.kids-feedback');
        fb.innerHTML = `<p class="kids-verdict ${right ? 'is-right' : 'is-wrong'}">${right ? 'Верно!' : 'Не совсем. Правильный ответ: ' + h(q['ответ'])}</p>${q['пояснение'] ? `<p class="kids-know"><strong>А знаешь ли ты…</strong> ${h(q['пояснение'])}</p>` : ''}${q['книга'] ? `<p class="kids-book-ref">Книга: ${h(q['книга'])}</p>` : ''}${q['источник'] && q['источник'].startsWith('/') ? `<p><a class="text-link" href="${h(q['источник'])}">Узнать больше</a></p>` : ''}`;
        btn.remove();
        const last = i === total - 1;
        const next = document.createElement('button');
        next.type = 'button'; next.className = 'button dark'; next.innerHTML = (last ? 'Узнать итог ' : 'Следующий вопрос ') + arrowSvg;
        card.querySelector('.kids-q-actions').append(next);
        progress(i + 1);
        next.addEventListener('click', () => { if (last) finish(); else { i++; ask(); card.focus(); } });
        next.focus();
      });
      if (window.Motion && motionOk()) window.Motion.animate(card, { opacity: [0, 1], x: [16, 0] }, { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] });
    };
    const finish = () => {
      progress(total);
      countEl.textContent = 'Итог';
      load();
      const prev = state.quizzes[quiz.id];
      state.quizzes[quiz.id] = { done: true, best: Math.max(score, prev && prev.best || 0), total };
      save();
      const ratio = score / total;
      const word = ratio === 1 ? 'Без единой ошибки!' : ratio >= 0.7 ? 'Отличный результат!' : ratio >= 0.4 ? 'Хорошее начало!' : 'Есть куда расти!';
      owlMood(ratio >= 0.5 ? 'happy' : 'surprised', 2400);
      const learn = sources.filter(s => s.url.startsWith('/'));
      const ext = sources.filter(s => !s.url.startsWith('/')).concat(quiz['источник'] && !sources.some(s => s.url === quiz['источник']) ? [{ url: quiz['источник'], title: 'Ответы на вопросы диктанта' }] : []);
      card.innerHTML = `<div class="kids-result"><h2 tabindex="-1">${word}</h2><p class="kids-score"><strong>${score}</strong> из ${total} правильных ответов</p>${learn.length ? `<h3>Узнать больше</h3><ul class="kids-learn">${learn.map(s => `<li><a href="${h(s.url)}">${h(s.title)}</a></li>`).join('')}</ul>` : ''}${ext.length ? `<p class="kids-book-ref">Вопросы взяты из опубликованных материалов: ${ext.map(s => `<a href="${h(s.url)}" target="_blank" rel="noopener">${h(s.title.replace(/, вопрос \d+$/, ''))}</a>`).join(', ')}.</p>` : ''}<div class="kids-invite"><p><strong>Ещё больше книг и викторин — в библиотеке.</strong> ${visit}</p></div><div class="hero-actions"><button type="button" class="button dark" data-again>Пройти ещё раз</button><button type="button" class="button outline" data-menu>Другая викторина</button><a class="button outline" href="${linkTo('kids-badges')}">Мои значки</a></div></div>`;
      card.querySelector('h2').focus();
      card.querySelector('[data-again]').addEventListener('click', () => runQuiz(root, quiz, quizzes));
      card.querySelector('[data-menu]').addEventListener('click', () => { setQuizUrl(''); quizMenu(root, quizzes, true); });
      checkBadges();
    };
    ask();
  }

  // ---------- badges page ----------
  function initBadges(root) {
    root.innerHTML = '<p class="page-loading">Загружаем значки…</p>';
    badgesReady().then(data => {
      if (!data || !Array.isArray(data['значки'])) { root.innerHTML = failNote('значки'); return; }
      let codeNote = '';
      const kod = params.get('kod');
      if (kod !== null) {
        const ok = String(data['код'] || '').trim() !== '' && kod.trim().toLowerCase() === String(data['код']).trim().toLowerCase();
        load();
        if (ok) { state.kod = true; save(); codeNote = `<p class="kids-code is-ok" role="status"><strong>Код принят!</strong> Спасибо, что пришли в библиотеку.${canStore ? '' : ' Этот браузер не запоминает значки, поэтому после закрытия страницы он пропадёт.'}</p>`; }
        else codeNote = '<p class="kids-code is-bad" role="status"><strong>Код не подошёл.</strong> Попросите библиотекаря показать свежий QR-код.</p>';
        try { const u = new URL(location.href); u.searchParams.delete('kod'); history.replaceState(history.state, '', u.pathname + u.search + u.hash); } catch {}
      }
      // quiz ids for «Знаток викторин»: known after any visit to the quiz page; fetched here too
      const ids = state.quizIds ? Promise.resolve() : getJson('/data/viktorina.json').then(d => { load(); state.quizIds = (d['викторины'] || []).map(q => q.id).filter(Boolean); save(); }).catch(() => {});
      ids.then(() => checkBadges()).then(() => {
        load();
        const list = data['значки'], got = list.filter(b => state.earned[b.id]).length;
        root.innerHTML = `${codeNote}<div class="kids-badges-top"><div class="kids-badges-owl" data-kids-owl aria-hidden="true"></div><p class="kids-badges-count"><strong>${got}</strong> из ${list.length} значков</p></div>${canStore ? '' : '<p class="kids-note">Этот браузер не запоминает значки (выключено хранение данных сайта). Играть можно, но после закрытия страницы значки пропадут.</p>'}<ul class="kids-badges">${list.map(b => { const on = !!state.earned[b.id]; return `<li class="kids-badge ${on ? 'is-on' : 'is-off'}" data-badge-card="${h(b.id)}"><span class="kids-badge-art" aria-hidden="true">${badgePic(b.id, !on, 140)}</span><h3>${h(b['название'])}</h3><p>${h(b['условие'])}</p><p class="kids-badge-state">${on ? `Получен: ${h(state.earned[b.id])}` : 'Пока не получен'}</p></li>`; }).join('')}</ul><details class="kids-reset"><summary>Начать коллекцию заново</summary><p>Значки хранятся только в этом браузере. Если стереть их, начать придётся сначала.</p><button type="button" class="button outline" data-reset>Стереть значки на этом устройстве</button></details>`;
        mountOwl(root.querySelector('[data-kids-owl]')).then(O => { if (O && kod !== null) O.mood(root.querySelector('[data-kids-owl]'), 'happy', 2000); });
        root.querySelector('[data-reset]').addEventListener('click', () => {
          if (!confirm('Стереть все значки на этом устройстве?')) return;
          try { localStorage.removeItem(KEY); } catch {}
          location.reload();
        });
      });
    });
  }

  function start() {
    if (pageKey === 'kids') initHub();
    else if (app && app.dataset.kids === 'books') { initBooks(app); }
    else if (app && app.dataset.kids === 'quiz') { initQuiz(app); checkBadges(); }
    else if (app && app.dataset.kids === 'badges') initBadges(app);
  }
  start();
})();
