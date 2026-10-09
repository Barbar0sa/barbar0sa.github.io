const $ = (s) => document.querySelector(s);
// Clean addresses: page key -> /path/ (scripts/routes.cjs, written to sections-index.js). Articles are «article-<id>».
const libraryPaths=window.libraryPaths||{};
const keyByPath=Object.fromEntries(Object.entries(libraryPaths).map(([k,p])=>[p,k]));
const siteHosts=['taralib.ru','www.taralib.ru','tara-lib.ru','www.tara-lib.ru'];
// Events and news without a page of their own (added to site/data/afisha-i-novosti.json after the build): /afisha/?e=<id>, /novosti/?n=<id>.
const pathOf=key=>libraryPaths[key]||(key.startsWith('article-')?(libraryPaths.news||'/novosti/')+'?n='+encodeURIComponent(key.slice(8)):key.startsWith('event-')?(libraryPaths.events||'/afisha/')+'?e='+encodeURIComponent(key.slice(6)):'/?page='+key);
// Old in-page links "/?page=<key>#x" and "/?article=<id>" -> clean path (imported markup still uses them).
function cleanHref(h){const m=/^\/\?(page|article)=([^&#]+)(#.*)?$/.exec(h);if(!m)return h;const k=(m[1]==='article'?'article-':'')+decodeURIComponent(m[2]);return libraryPaths[k]?libraryPaths[k]+(m[3]||''):h;}
// Responsive variants made by scripts/build-images.py (npm run build:images): <name>-<width>.avif/.webp.
const imgWidths={'/assets/photos/poster-novels.webp':[480,800,1060],'/assets/photos/poster-debussy.webp':[480,800,1000],'/assets/photos/workshop.webp':[480,800,1200],'/assets/photos/museum.webp':[480,700]};
function pic(src,sizes,attrs){const w=imgWidths[src];if(!w)return `<img src="${src}" ${attrs}>`;const b=src.replace(/\.webp$/,''),set=ext=>w.map(n=>`${b}-${n}.${ext} ${n}w`).join(', ');return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${b}-${w[1]}.webp" srcset="${set('webp')}" sizes="${sizes}" ${attrs}></picture>`;}
const base='https://taralib.ru/content/';
const catalog='http://opac.omsklib.ru/cgiopac/opacg/opac.exe?arg0=BIS00&arg1=BIS00&TypeAccess=PayAccess';
// Resource lists are coloured tiles; the icon comes from the sprite in index.html, picked by the address or title.
const tileIcon=(url,title)=>{const t=String(url)+' '+String(title).toLowerCase();for(const [re,name] of [[/^tel:/,'phone'],[/afisha|event|bilet|афиш|событ/,'calendar'],[/novost|article|новост/,'news'],[/katalog|catalog|opac|каталог/,'search'],[/prodlen|renew|продл/,'renew'],[/knigi-na-dom|delivery|на дом/,'home'],[/dostavka-dokument|documents|dokument|копи|документ/,'file'],[/spravoch|virtualnaya|ask|библиотекар|вопрос/,'question'],[/pamyatka|firstvisit|читател/,'card'],[/biblioteki|kontakt|filial|contacts|библиотек|филиал|контакт/,'pin'],[/t\.me|telegram/,'send'],[/rutube|video|видео/,'play'],[/arhiv|архив|letopis|летопис|istori|истори/,'archive']])if(re.test(t))return name;return 'book';};
const resources=(items)=>'<div class="resource-list">'+items.map(([title,url,desc=''])=>`<a href="${url}"><svg class="ri" aria-hidden="true" focusable="false"><use href="#i-${tileIcon(url,title)}"/></svg><strong>${title}</strong>${desc?`<small>${desc}</small>`:''}</a>`).join('')+'</div>';
const pages={
about:{title:'Библиотека, которая объединяет',html:`<p>Тарская централизованная библиотечная система имени Л. Н. Чашечникова объединяет 24 сельских филиала, 2 городских филиала и 2 районные библиотеки.</p><h2>Книги. Люди. Родной город.</h2><p>С 1976 года библиотеки Тарского района работают как единая система. Здесь можно читать, учиться, встречаться и открывать историю Тарского Прииртышья.</p><p>В 2022 году библиотечной системе присвоено имя поэта и публициста Леонида Николаевича Чашечникова.</p>${resources([['Библиотеки и филиалы',pathOf('libraries')],['Документы учреждения',base+'dokumenty'],['Услуги читателям',base+'uslugi'],['Методическая служба',base+'metodicheskaya-sluzhba']])}<p class="source-note">Сведения об учреждении: <a href="${base}o-nas">taralib.ru</a>.</p>`},
catalog:{title:'Ваша следующая книга',html:`<p>Электронный каталог библиотек Омской области поможет найти издание по названию, автору или теме. Поиск откроется на сайте каталога.</p><a class="button dark" href="${catalog}" target="_blank" rel="noopener">Открыть каталог</a><h2>Уже читаете у нас?</h2>${resources([['Продлить книгу',base+'prodlenie-knig-onlayn','Заявка через действующий сервис библиотеки'],['Книги на дом',base+'usluga-knigi-na-dom'],['Электронная доставка документов',base+'elektronnaya-dostavka-dokumentov'],['Спросить библиотекаря',base+'virtualnaya-spravochnaya-sluzhba']])}`},
events:{title:'Афиша',html:''},
news:{title:'Жизнь библиотеки',html:''},
heritage:{title:'Тарское Прииртышье в историях',html:`<p>Литература, памятные места и судьбы земляков. Исследуйте родной край вместе с библиотекой.</p>${resources([['Литературная карта',base+'literaturnaya-karta-tarskogo-priirtyshya','Электронный архив Тарского Прииртышья'],['Музей книги',base+'muzey-knigi','Библиотечная коллекция'],['Научно-краеведческий центр им. А. А. Жирова',base+'nauchno-kraevedcheskiy-centr-im-aa-zhirova'],['Тара литературная',base+'tara-literaturnaya'],['Летопись Тарского Прииртышья',base+'letopis-tarskogo-priirtyshya'],['Наш земляк Михаил Ульянов',base+'nash-zemlyak-mihail-ulyanov']])}`},
contacts:{title:'До встречи в библиотеке',html:`<div class="contact-layout"><div><h2>Центральная районная библиотека</h2><p>г. Тара, ул. Александровская, 58<br>Омская область, 646530</p><p><a href="tel:+73817121242">+7 (38171) 2-12-42</a><br><a href="mailto:tara_libraru79@mail.ru">tara_libraru79@mail.ru</a></p><div class="hero-actions"><a class="button dark" href="https://yandex.ru/maps/?text=Тара%20Александровская%2058" target="_blank" rel="noopener">Открыть карту</a><a class="button outline" href="${mailtoHref('Обращение в библиотеку',['Ваше обращение: ','Как с вами связаться: '])}">Написать библиотеке</a></div></div><div class="hours"><h3>Режим работы</h3><p>Понедельник – пятница<br><strong>10:00 – 19:00</strong></p><p>Суббота: выходной.</p><p>Воскресенье<br><strong>10:00 – 17:00</strong></p><small>Последний рабочий день месяца: санитарный день. В предпраздничные дни библиотека закрывается на час раньше.</small></div></div><h2>Детская библиотека</h2><p>Тот же адрес: ул. Александровская, 58.<br><a href="tel:+73817122020">+7 (38171) 2-20-20</a> · <a href="mailto:detbibl_tara@mail.ru">detbibl_tara@mail.ru</a></p><p>Пн–пт: 09:00–18:00. Вс: 10:00–17:00. Сб: выходной.</p><p>С 15 июня по 31 августа действует летнее расписание: пн–чт 10:00–18:00, пт 10:00–17:00, вс 10:00–17:00, сб выходной.</p><p><a class="text-link" href="${base}rezhim-raboty">Проверить актуальный режим работы</a></p>`},
libraries:{title:'Найдите свою библиотеку',html:`<p>Районные библиотеки и филиалы в Таре и сёлах района.</p><div id="library-map" data-map></div>${resources([['Центральная районная библиотека',pathOf('contacts'),'Тара, ул. Александровская, 58 · +7 (38171) 2-12-42'],['Центральная районная детская библиотека',pathOf('contacts'),'Тара, ул. Александровская, 58 · +7 (38171) 2-20-20'],['Городская библиотека № 1',base+'gorodskaya-biblioteka-filial-no-1','Тара, ул. Радищева, 17 · +7 (38171) 2-00-59'],['Городская библиотека № 3',base+'gorodskaya-biblioteka-filial-no-3','Тара, ул. Елецкого, 28 · +7 (38171) 2-81-05'],['Екатерининская сельская библиотека',base+'biblioteka-filial-no-5-s-ekaterininskoe','с. Екатерининское, ул. Советская, 48 · +7 (38171) 31-2-62'],['Все библиотеки района',base+'kontakty','Адреса и контакты сельских филиалов']])}<p>Филиалы работают по индивидуальному расписанию. <a class="text-link" href="${base}biblioteki-filialy">Посмотреть режим работы филиалов</a></p>`}
};
Object.assign(pages,window.libraryContent||{});
pages.catalog.html=`<div class="catalog-intro"><div><p class="page-intro">Ищите книги по названию, автору или теме в едином каталоге библиотек Омской области.</p><a class="button dark" href="${catalog}" target="_blank" rel="noopener">Открыть каталог</a><small>Каталог откроется в новой вкладке.</small></div><div class="catalog-help"><h2>С чего начать</h2><ol><li>Введите автора или название.</li><li>Откройте карточку нужного издания.</li><li>Уточните наличие и возможность выдачи у библиотекаря.</li></ol></div></div><h2>Не нашли нужную книгу?</h2><p>Мы поможем проверить фонды и подобрать другие издания по вашей теме.</p>${resources([['Спросить библиотекаря',pathOf('ask')],['Впервые в библиотеке',pathOf('firstvisit')],['Продлить книгу',pathOf('renew')],['Книги на дом',pathOf('delivery')]])}`;
const internalRoutes={'prodlenie-knig-onlayn':'renew','pamyatka-chitatelyu':'firstvisit','usluga-knigi-na-dom':'delivery','elektronnaya-dostavka-dokumentov':'documents','virtualnaya-spravochnaya-sluzhba':'ask','uslugi':'services'};
for(const value of Object.values(pages))for(const [slug,key] of Object.entries(internalRoutes)){if(!['renew','delivery','documents','ask','services','firstvisit'].includes(Object.keys(pages).find(k=>pages[k]===value)))value.html=value.html.split(base+slug).join(pathOf(key));}

// Afisha and news: site/data/afisha-i-novosti.json, edited by the library by hand and uploaded by FTP (docs/AFISHA.md).
// Prerendered pages and the home blocks are a build-time snapshot of it (npm run build). On the pages that show the data
// the file is fetched again; a block is rendered anew only if its markup differs from the snapshot (data-render holds a
// hash of the markup), so an unchanged file causes no jump. A file that cannot be read leaves the snapshot as it is.
const dataUrl='/data/afisha-i-novosti.json';
let eventItems=[],newsItems=[],articles={},pdfPlan='',upcomingEvents=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const unesc=s=>String(s).replace(/&(amp|lt|gt|quot|#39);/g,(_,e)=>({amp:'&',lt:'<',gt:'>',quot:'"','#39':"'"})[e]);
// a line break typed in a teaser title ("\n") becomes <br>
const escLines=s=>esc(s).replace(/\s*\n\s*/g,' <br>');
// Links and images from the file: http(s) or a path on this site; javascript:, data: and the like are dropped.
function safeUrl(u){u=String(u??'').trim();if(/^https?:\/\/[^\s"'<>]+$/i.test(u))return u;if(!u||u.startsWith('//')||/[:"'<>\\\n]/.test(u))return '';return (u.startsWith('/')?u:'/'+u.replace(/^\.\//,'')).replace(/ /g,'%20');}
const hashOf=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
const itemId=/^[a-zа-яё0-9-]+$/i;
const isoDate=s=>{const d=new Date(s+'T12:00:00Z');return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(d)&&d.toISOString().slice(0,10)===s;};
const monthsGen=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const todayKey=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Omsk'}).format(new Date());
const weekdaysShort=['вс','пн','вт','ср','чт','пт','сб'],weekdaysFull=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота'];
// Icons live in the sprite at the top of index.html (<symbol id="i-…">).
const icon=(name,cls='')=>`<svg${cls?` class="${cls}"`:''} aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
const arrow=icon('arrow');
const newsDate=iso=>{const [y,m,d]=iso.split('-');return `${+d} ${monthsGen[+m-1]} ${y}`;};
const homeDate=iso=>{const [y,m,d]=iso.split('-');return `${d} ${monthsGen[+m-1]} ${y}`;};
// a teaser when the item has none: the first sentence of the text
function firstSentence(s){const t=(/^[\s\S]{20,}?[.!?…](?=\s|$)/.exec(s||'')||[s||''])[0].trim();return t.length>180?t.slice(0,t.lastIndexOf(' ',177))+'…':t;}
// Prepared images (imgWidths) keep their <picture>; photos the library uploads (site/data/foto/) are a plain lazy <img>.
const photo=(src,sizes,attrs,extra='')=>imgWidths[src]?pic(src,sizes,attrs+(extra?' '+extra:'')):`<img src="${esc(src)}" ${attrs} loading="lazy" decoding="async">`;
const eventHref=id=>pathOf('event-'+id),newsHref=id=>pathOf('article-'+id);
// Reads the file into eventItems / newsItems. Items with a bad id, title or date are skipped (npm run check:data names them).
function readData(d){
 if(!d||typeof d!=='object'||!Array.isArray(d['события'])||!Array.isArray(d['новости']))throw new Error('нет списков «события» и «новости»');
 const str=v=>typeof v==='string'?v.trim():typeof v==='number'?String(v):'';
 const teaser=a=>a&&typeof a==='object'?{title:str(a['заголовок']),sign:str(a['подпись']),text:str(a['текст'])}:{title:'',sign:'',text:''};
 const skipped=[],seenE=new Set(),seenN=new Set(),events=[],news=[];
 for(const x of d['события']){const o=x&&typeof x==='object'?x:{},id=str(o.id),title=str(o['название']),date=str(o['дата']),t=/^(\d{1,2})[:.](\d{2})$/.exec(str(o['время']));
  if(!itemId.test(id)||seenE.has(id)||!title||!isoDate(date)||!t||+t[1]>23||+t[2]>59){skipped.push('событие '+(id||title||'без названия'));continue;}
  seenE.add(id);events.push({id,title,date,time:t[1].padStart(2,'0')+':'+t[2],age:str(o['возраст']),kind:str(o['вид']),description:str(o['описание']),image:safeUrl(o['афиша']),place:str(o['место']),teaser:teaser(o['анонс'])});}
 for(const x of d['новости']){const o=x&&typeof x==='object'?x:{},id=str(o.id),title=str(o['заголовок']),date=str(o['дата']);
  const text=(Array.isArray(o['текст'])?o['текст']:[o['текст']]).map(str).filter(Boolean);
  if(!itemId.test(id)||seenN.has(id)||!title||!isoDate(date)||!text.length){skipped.push('новость '+(id||title||'без заголовка'));continue;}
  const photos=(Array.isArray(o['галерея'])?o['галерея']:[]).map(p=>Array.isArray(p)?{href:safeUrl(p[0]),src:safeUrl(p[1]||p[0]),w:+p[2]||0,h:+p[3]||0}:{href:safeUrl(p),src:safeUrl(p),w:0,h:0}).filter(p=>p.href&&p.src);
  const links=(Array.isArray(o['ссылки'])?o['ссылки']:[]).filter(Array.isArray).map(([label,url])=>[str(label),safeUrl(url)]).filter(([l,u])=>l&&u);
  seenN.add(id);news.push({id,title,date,place:str(o['место']),rubric:str(o['рубрика']),teaser:teaser(o['анонс']),image:safeUrl(o['фото']),alt:str(o['описание фото'])||title,text,photos,links});}
 if(skipped.length)console.warn('Афиша и новости: пропущены записи с ошибками (проверка: npm run check:data): '+skipped.join(', '));
 for(const e of events){const [,m,day]=e.date.split('-');e.day=day;e.month=monthsGen[+m-1];e.today=e.date===todayKey;e.past=e.date<todayKey;e.weekday=weekdaysFull[new Date(e.date+'T12:00:00Z').getUTCDay()];}
 events.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 news.sort((a,b)=>b.date.localeCompare(a.date));
 eventItems=events;newsItems=news;articles=Object.fromEntries(news.map(n=>[n.id,n]));upcomingEvents=events.filter(e=>!e.past);pdfPlan=safeUrl(d['план месяца']);
 buildDataPages();
}
const plural=(n,one,few,many)=>{const a=n%10,b=n%100;return a===1&&b!==11?one:a>=2&&a<=4&&(b<12||b>14)?few:many;};
// /afisha/ and the event pages
function buildDataPages(){
 for(const k of Object.keys(pages))if(k.startsWith('event-'))delete pages[k];
 // Month strip: the month of the nearest upcoming event (or of today).
 const stripMonth=(upcomingEvents[0]?.date||todayKey).slice(0,7);
 const stripDays=new Date(Date.UTC(+stripMonth.slice(0,4),+stripMonth.slice(5,7),0)).getUTCDate();
 const stripMonthName=['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][+stripMonth.slice(5,7)-1];
 const stripMonthIn=['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'][+stripMonth.slice(5,7)-1];
 const stripMonthGen=monthsGen[+stripMonth.slice(5,7)-1];
 // Each day: event days are links with a full spoken name; plain days are hidden from screen readers (today keeps a short hidden note).
 const monthStrip=Array.from({length:stripDays},(_,i)=>{const key=`${stripMonth}-${String(i+1).padStart(2,'0')}`,dow=new Date(key+'T12:00:00Z').getUTCDay(),evs=eventItems.filter(e=>e.date===key),ev=evs[0],isToday=key===todayKey,isPast=key<todayKey;
  const cls=['day',dow===6?'is-closed':'',isToday?'is-today':'',isPast?'is-past':'',ev?'has-event':''].filter(Boolean).join(' ');
  const mark=isToday?'<i class="day-mark day-dot"></i>':dow===6&&!ev?'<i class="day-mark">вых</i>':'';
  const inner=`<span aria-hidden="true">${weekdaysShort[dow]}</span><strong aria-hidden="true">${i+1}</strong>${mark}`;
  const spoken=`${i+1} ${stripMonthGen}, ${weekdaysFull[dow]}${isToday?', сегодня':''}`;
  if(ev)return `<a class="${cls}" href="${esc(eventHref(ev.id))}" aria-label="${spoken}: ${evs.map(e=>`${esc(e.title)}, ${e.time}`).join('; ')}${isPast?', прошло':''}"${isToday?' aria-current="date"':''}>${inner}</a>`;
  return isToday?`<span class="${cls}" aria-current="date"><span class="month-sr">${spoken}, событий нет</span>${inner}</span>`:`<span class="${cls}" aria-hidden="true">${inner}</span>`;}).join('');
 const stripEvents=eventItems.filter(e=>e.date.startsWith(stripMonth));
 const stripDayList=[...new Set(stripEvents.map(e=>+e.day))];
 const stripSummary=stripEvents.length?`В ${stripMonthIn} ${stripEvents.length} ${plural(stripEvents.length,'событие','события','событий')}: ${stripDayList.length>1?stripDayList.slice(0,-1).join(', ')+' и '+stripDayList.at(-1):stripDayList[0]} ${stripMonthGen}.`:`В ${stripMonthIn} событий пока нет.`;
 // Compact list under the strip when the month is light (≤5 events): readable without the calendar.
 const monthListItem=e=>`<li${e.past?' class="is-past"':''}><time datetime="${e.date}T${e.time}">${+e.day} ${e.month}, ${weekdaysShort[new Date(e.date+'T12:00:00Z').getUTCDay()]}</time><a href="${esc(eventHref(e.id))}">${esc(e.title)}</a><span>${e.time}</span><span>${esc(e.age)}</span>${e.today?'<em>сегодня</em>':e.past?'<em>прошло</em>':''}</li>`;
 const monthList=stripEvents.length&&stripEvents.length<=5?`<div class="month-list"><h2>В этом месяце</h2><ul>${stripEvents.map(monthListItem).join('')}</ul></div>`:'';
 const nextEvent=upcomingEvents[0],laterEvents=upcomingEvents.slice(1),pastEvents=eventItems.filter(e=>e.past).reverse();
 const kicker=e=>[e.kind,e.age].filter(Boolean).map(esc).join(' · ');
 const where=e=>e.place?esc(e.place):'Центральная районная библиотека, ул. Александровская, 58';
 const featureCard=e=>`<article class="event-feature${e.image?'':' no-poster'}">${e.image?`<a class="event-feature-poster" href="${esc(eventHref(e.id))}" aria-label="${esc(e.title)}: подробнее">${photo(e.image,'(max-width: 700px) 90vw, 420px',`alt="Афиша: ${esc(e.title)}"`,'width="900" height="1273" loading="lazy"')}</a>`:''}<div class="event-feature-body"><p class="event-flag">${e.today?'<span class="today-badge">Сегодня</span>':'<span class="soon-badge">Ближайшее</span>'}${kicker(e)}</p><h2>${esc(e.title)}</h2><div class="event-feature-when"><strong>${e.day}</strong><span>${e.month}, ${e.weekday}<br>начало в ${e.time}</span></div>${e.description?`<p>${esc(e.description)}</p>`:''}<dl class="event-facts"><div><dt>Где</dt><dd>${where(e)}</dd></div><div><dt>Участие</dt><dd>Уточните по телефону <a href="tel:+73817121242">+7 (38171) 2-12-42</a></dd></div></dl><div class="hero-actions"><a class="button dark" href="${esc(eventHref(e.id))}">Подробнее ${arrow}</a><a class="button outline" href="tel:+73817121242">${icon('phone','i-phone')}Позвонить в библиотеку</a></div></div></article>`;
 const posterCard=e=>`<a class="event-poster-card" href="${esc(eventHref(e.id))}"><div class="poster-frame${e.image?'':' is-text'}">${e.image?photo(e.image,'(max-width: 700px) 46vw, 300px',`alt="Афиша: ${esc(e.title)}"`,'width="900" height="1273" loading="lazy"'):`<strong>${+e.day} ${e.month}</strong>`}</div><span class="meta">${[`${e.day} ${e.month}`,e.time,e.age].filter(Boolean).map(esc).join(' · ')}</span><h3>${esc(e.title)}</h3>${e.kind?`<p>${esc(e.kind)}</p>`:''}</a>`;
 const planButton=cls=>pdfPlan?`<a class="button ${cls}" href="${esc(pdfPlan)}" target="_blank" rel="noopener">План месяца · PDF</a>`:'';
 pages.events.title='Афиша: что будет в '+stripMonthIn;
 pages.events.hero=`<section class="events-hero page-head" data-tone="rowan"><div class="page-head-text events-hero-text">${breadcrumbs('Афиша')}<p class="eyebrow">Афиша · ${stripMonthName} ${stripMonth.slice(0,4)}</p><h1>Что будет в ${stripMonthIn}</h1><p>Литературные встречи, музыка и программы для всей семьи. Выберите день — и приходите на Александровскую, 58.</p><div class="hero-actions"><a class="button dark" href="#programme">Ближайшие события ${arrow}</a>${planButton('outline')}</div></div>${headArt('afisha')}<div class="events-hero-cal"><p class="month-sr" id="month-strip-note">${stripSummary} Календарь прокручивается вбок; дни с событиями — ссылки.</p><div class="month-strip" role="group" aria-label="Календарь: ${stripMonthName.toLowerCase()} ${stripMonth.slice(0,4)}" aria-describedby="month-strip-note">${monthStrip}</div><ul class="month-legend" aria-hidden="true"><li class="lg-event">событие</li><li class="lg-past">прошедшее событие</li><li class="lg-today">сегодня</li><li class="lg-closed">выходной</li></ul>${monthList}</div></section>`;
 pages.events.html=`<section class="events-programme" id="programme">${nextEvent?featureCard(nextEvent):`<div class="event-empty"><h2>Афиша обновляется</h2><p>Ближайшие события скоро появятся.${pdfPlan?' Пока можно посмотреть полный план месяца.':''}</p>${planButton('dark')}</div>`}
${laterEvents.length?`<div class="section-head"><h2>Дальше в программе</h2></div><div class="poster-grid">${laterEvents.map(posterCard).join('')}</div>`:''}
${pastEvents.length?`<div class="past-events"><h2>Недавно прошли</h2>${pastEvents.map(e=>`<a href="${esc(eventHref(e.id))}"><span>${e.day} ${e.month}</span><strong>${esc(e.title)}</strong>${e.kind?`<small>${esc(e.kind)}</small>`:''}</a>`).join('')}</div>`:''}</section>
<a class="concert-band" href="${pathOf('info-nacproekt-kultura')}"><div class="concert-keys" aria-hidden="true"></div><div><p class="eyebrow">Нацпроект «Культура»</p><h2>Виртуальный концертный зал</h2><p>Трансляции концертов и музыкальных программ в зале библиотеки. Афиши трансляций месяца собраны на одной странице.</p><span class="text-link">Афиши трансляций ${arrow}</span></div></a>
<!-- «Пушкинская карта»: вставка по официальному руководству по визуальному стилю. Логотип и гипсовый бюст — только официальные файлы; слот описан в docs/PUSHKIN.md --><section class="pk-insert" aria-labelledby="pk-title-afisha"><div class="pk-main"><picture><source srcset="/assets/pushkin/logo.webp" type="image/webp"><img class="pk-logo" src="/assets/pushkin/logo.png" alt="Пушкинская карта" width="600" height="171" loading="lazy" decoding="async"></picture><p class="pk-kicker">Пушкинская карта</p><h3 class="pk-title" id="pk-title-afisha">В библиотеку по&nbsp;Пушкинской карте</h3><p class="pk-text">Мероприятия по Пушкинской карте для участников <span class="pk-nw">14–22 лет</span>. Программы и билеты — на странице платных мероприятий.</p><div class="pk-actions"><a class="pk-button" href="${pathOf('info-platnye-meropriyatiya')}">Выбрать программу ${arrow}</a><a class="pk-link" href="/sites/default/files/plan_meropriyatiy_v_ramkah_realizacii_proekta_pushkinskaya_karta_na_2026_g.pdf">План мероприятий на 2026 год · PDF</a></div></div><div class="pk-brand"><p class="pk-slogan">Веди себя культурно</p></div></section>
<div class="section-head"><h2>Билеты, видео и анонсы</h2></div><div class="event-tiles"><a class="tile tile-ticket" href="${pathOf('info-kupit-bilet')}"><span class="tile-mark" aria-hidden="true">${icon('ticket')}</span><strong>Купить билет</strong><small>Платные программы библиотеки</small></a><a class="tile tile-video" href="https://rutube.ru/channel/25012035/" target="_blank" rel="noopener"><span class="tile-mark" aria-hidden="true">${icon('play')}</span><strong>Видеотека</strong><small>Записи программ на RUTUBE</small></a><a class="tile tile-news" href="https://t.me/s/taralib/" target="_blank" rel="noopener"><span class="tile-mark" aria-hidden="true">${icon('send')}</span><strong>Анонсы в Telegram</strong><small>Новости и афиши первыми</small></a><a class="tile tile-plan" href="${base}afisha"><span class="tile-mark" aria-hidden="true">${icon('calendar')}</span><strong>Архив афиш</strong><small>на сайте taralib.ru</small></a></div>
<p class="source-note">Даты и время взяты из опубликованных библиотекой афиш. Перед посещением уточните условия участия: <a href="tel:+73817121242">+7 (38171) 2-12-42</a>.</p>`;
 for(const e of eventItems)pages['event-'+e.id]={title:esc(e.title),html:`<div class="event-detail${e.image?'':' no-poster'}"><div>${kicker(e)?`<p class="event-kicker">${kicker(e)}</p>`:''}<p class="event-when">${e.day} ${e.month} · ${e.time}</p>${e.description?`<p>${esc(e.description)}</p>`:''}<dl><dt>Где</dt><dd>${e.place?esc(e.place):'Тарская центральная районная библиотека<br>ул. Александровская, 58'}</dd><dt>Условия участия</dt><dd>Уточните по телефону библиотеки.</dd></dl><div class="hero-actions"><a class="button dark" href="tel:+73817121242">Уточнить участие</a><a class="button outline" href="${pathOf('contacts')}">Как добраться</a></div><p><a class="text-link" href="${pathOf('events')}">Вся афиша</a></p></div>${e.image?`<a class="event-poster" href="${esc(e.image)}" target="_blank" rel="noopener" aria-label="Открыть афишу крупно">${photo(e.image,'(max-width: 900px) 92vw, 520px',`alt="Официальная афиша: ${esc(e.title)}, ${e.day} ${e.month}, ${e.time}"`,'width="900" height="1273"')}</a>`:''}</div>`};
 // /novosti/: the newest item with a photo leads, the rest are a list (newest first)
 const feature=newsItems.find(n=>n.image),list=newsItems.filter(n=>n!==feature);
 pages.news.html=(feature?`<a class="news-feature" href="${esc(newsHref(feature.id))}">${photo(feature.image,'(max-width: 900px) 92vw, 50vw',`alt="${esc(feature.alt)}"`,'width="1500" height="1000"')}<div><span class="meta">${esc([feature.rubric,feature.place].filter(Boolean).join(' · ')||newsDate(feature.date))}</span><h2>${escLines(feature.teaser.title||feature.title)}</h2><p>${esc(feature.teaser.text||firstSentence(feature.text[0]))}</p><span class="text-link">Читать новость</span></div></a>`:'')
  +resources([...list.map(n=>[esc(n.title),esc(newsHref(n.id)),esc([newsDate(n.date),n.rubric||n.place].filter(Boolean).join(' · '))]),['Новости библиотек-филиалов','https://taralib.ru/novosti-filialov'],['Архив всех новостей','https://taralib.ru/novosti']]);
}
// An article page (/novosti/<path>/ or /novosti/?n=<id>)
function articleData(a){return{title:esc(a.title),html:`<div class="meta">${esc(newsDate(a.date)+(a.place?' · '+a.place:''))}</div>${a.image?photo(a.image,'(max-width: 900px) 92vw, 900px',`class="article-image" alt="${esc(a.alt)}"`,'width="1500" height="1000"'):''}<div class="article-content">${a.text.map(t=>`<p>${esc(t)}</p>`).join('')}</div>${a.photos.length?`<div class="article-photos">${a.photos.map(p=>`<a href="${esc(p.href)}"><img src="${esc(p.src)}" alt="${esc(a.alt)}"${p.w&&p.h?` width="${p.w}" height="${p.h}"`:''} loading="lazy"${p.w?'':' decoding="async"'}></a>`).join('')}</div>`:''}${a.links.length?`<h2>Материалы</h2>${resources(a.links.map(([l,u])=>[esc(l),esc(u)]))}`:''}`};}
// Home: the nearest event (.month-feature) and the three newest news items (.journal-grid)
const dictationCover='<div class="dictation-cover"><span>Литературный <br>диктант</span><strong>Аа</strong><div>Тара читает<span>2026</span></div></div>';
function homeAgendaHtml(){const e=upcomingEvents[0];
 if(!e)return `<a class="month-feature" href="${pathOf('events')}"><div class="month-art programme-art"><div class="programme-type"><span>Афиша</span><strong>Афиша обновляется</strong><p>Ближайшие события скоро появятся</p></div></div><div class="feature-info"><div><h3>Вся афиша</h3><p>План месяца и прошедшие события</p></div><span class="circle-arrow" aria-hidden="true">${arrow}</span></div></a>`;
 const t=e.teaser;
 return `<a class="month-feature" href="${esc(eventHref(e.id))}"><div class="month-art programme-art"><div class="programme-type"><span>${[`${+e.day} ${e.month}`,e.time,e.age].filter(Boolean).map(esc).join(' · ')}</span><strong>${t.title?escLines(t.title):`${+e.day} ${e.month}`}</strong>${t.sign?`<p>${esc(t.sign)}</p>`:''}</div>${e.image?photo(e.image,'(max-width: 700px) 34vw, (max-width: 1100px) 20vw, 340px',`alt="Афиша: ${esc(e.title)}"`,'loading="lazy" width="900" height="1273"'):''}</div><div class="feature-info"><div><h3>${esc(e.title)}</h3>${t.text||e.description?`<p>${esc(t.text||firstSentence(e.description))}</p>`:''}</div><span class="circle-arrow" aria-hidden="true">${arrow}</span></div></a>`;}
function homeNewsHtml(){const [lead,...rest]=newsItems;if(!lead)return '';
 const meta=n=>esc([homeDate(n.date),n.rubric||n.place].filter(Boolean).join(' · ')),teaser=n=>esc(n.teaser.text||firstSentence(n.text[0]));
 const cover=n=>n.id==='dictation'?dictationCover:n.image?`<div class="journal-photo">${photo(n.image,'(max-width: 700px) 92vw, 40vw',`alt="${esc(n.alt)}"`,'loading="lazy" width="1500" height="1000"')}</div>`:`<div class="dictation-cover"><span>${esc(n.rubric||'Новости')}</span><strong>Аа</strong><div>Тарская библиотека<span>${n.date.slice(0,4)}</span></div></div>`;
 return `<a class="journal-lead" href="${esc(newsHref(lead.id))}">${cover(lead)}<div class="meta">${meta(lead)}</div><h3>${escLines(lead.teaser.title||lead.title)}</h3><p>${teaser(lead)}</p></a>\n<div class="journal-list">${rest.slice(0,2).map(n=>`<a href="${esc(newsHref(n.id))}"><div class="meta">${meta(n)}</div><h3>${escLines(n.teaser.title||n.title)}</h3><p>${teaser(n)}</p><span class="text-link">Читать новость ${arrow}</span></a>`).join('')}</div>`;}
// Both home blocks with their hashes (also used by scripts/build-pages.cjs to write the snapshot into index.html)
function homeBlocks(){const agenda=homeAgendaHtml(),journal=homeNewsHtml(),ha=hashOf(agenda);return{agenda:agenda.replace('<a class="month-feature"',`<a class="month-feature" data-render="${ha}"`),agendaHash:ha,journal,journalHash:hashOf(journal)};}
pages.about.html=`<figure class="document-photo is-small">${pic('/assets/photos/museum.webp','(max-width: 900px) 92vw, 700px','alt="Книжная выставка: старинная рукописная книга и подсвечник" width="700" height="525"')}<figcaption>Книжная выставка в библиотеке</figcaption></figure>`+pages.about.html+`<h2>Библиотека рядом</h2><p>Читайте новости, смотрите фотографии и узнавайте о встречах в официальных сообществах.</p><div class="hero-actions"><a class="button outline" href="https://vk.ru/taralib" target="_blank" rel="noopener">ВКонтакте</a><a class="button outline" href="https://ok.ru/taralib" target="_blank" rel="noopener">Одноклассники</a></div>`;

const sectionTitles=window.librarySectionTitles||{};
let sectionsLoading;
function loadSections(){return sectionsLoading??=new Promise(resolve=>{if(window.librarySections)return resolve();const s=document.createElement('script');s.src='/sections.js';s.onload=s.onerror=resolve;document.head.append(s);}).then(()=>Object.assign(pages,window.librarySections||{}));}
pages.libraries.html+=resources([['Полный справочник контактов',pathOf('fullcontacts'),'Все подразделения и адреса из справочника учреждения']]);
pages.contacts.html+=resources([['Контакты всех библиотек',pathOf('fullcontacts')]]);
// Current page: the clean path (/o-nas/), or the old query (?page=about, ?article=walk), which is replaced by the clean path.
const params=new URLSearchParams(location.search);
let page=params.get('page'),article=params.get('article');
const queryKey=article?'article-'+article:page;
// old "?page=<key>", "?article=<id>" links go to the clean path (or to the ?e= / ?n= address of an item without one)
let redirecting=!!(queryKey&&(libraryPaths[queryKey]||/^(article|event)-./.test(queryKey)));
if(redirecting)location.replace(pathOf(queryKey)+location.hash);
const pathname=(()=>{try{return decodeURI(location.pathname);}catch{return location.pathname;}})().replace(/\/index\.html$/,'/');
const pathKey=keyByPath[pathname]||keyByPath[pathname+'/'];
if(!queryKey&&pathKey){if(pathKey.startsWith('article-'))article=pathKey.slice(8);else page=pathKey;}
// /afisha/?e=<id>, /novosti/?n=<id>: the item is rendered from the data file; an item that has its own page is sent there.
const itemKey=!queryKey&&page==='events'&&params.get('e')?'event-'+params.get('e'):!queryKey&&page==='news'&&params.get('n')?'article-'+params.get('n'):'';
if(itemKey){if(libraryPaths[itemKey]){redirecting=true;location.replace(libraryPaths[itemKey]+location.hash);}else if(itemKey.startsWith('event-'))page=itemKey;else{page=null;article=itemKey.slice(8);}}
// Archive pages (scripts/build-archives.cjs) are not in libraryPaths: the prerender passes their data, the built page carries its key.
const archiveData=window.libraryArchivePage,archiveKey=archiveData?.key||(/^archive-/.test(document.documentElement.dataset.page||'')?document.documentElement.dataset.page:'');
if(!queryKey&&!pathKey&&archiveKey){page=archiveKey;if(archiveData)pages[page]=archiveData;}
const archiveSection=archiveData?.section||document.documentElement.dataset.section||'';
const isHome=!page&&!article&&pathname==='/';
// an address that is neither home nor a known page (a server that falls back to index.html): «Такой страницы нет»
const missingPath=!page&&!article&&!isHome;
const currentKey=article?'article-'+article:page||'',currentPath=libraryPaths[currentKey]||(archiveKey?pathname:'');
// Prerendered pages (scripts/build-pages.cjs) already hold the rendered page: keep the DOM and only bind behaviour.
// Pages built from site/data/afisha-i-novosti.json (home blocks, afisha, events, news) are checked against the file once it
// arrives and rendered again only if they differ (a new item, or another day: «сегодня», «прошло»).
const dataPage=isHome||page==='events'||page==='news'||!!article||!!page?.startsWith('event-');
const prerendered=document.documentElement.hasAttribute('data-prerendered')&&document.documentElement.dataset.page===currentKey;
// Imported pages are raw markup from the old site: turn contact blocks into cards,
// runs of single links into a grid and file links into a document list.
const fileExt=/\.(pdf|docx?|xlsx?|rtf|odt|pptx?|jpe?g|png|zip|rar)(?:$|[?#])/i;
const squash=s=>s.replace(/[\s ​﻿]+/g,'');
const cleanText=el=>el.textContent.replace(/[\s ​﻿]+/g,' ').trim();
const isEmptyP=el=>el.tagName==='P'&&!squash(el.textContent)&&!el.querySelector('img,iframe,video,table');
const onlyLink=el=>{const a=el.querySelectorAll('a');return el.tagName==='P'&&a.length===1&&squash(a[0].textContent)===squash(el.textContent)&&squash(el.textContent)!=='';};
const titleOf=el=>{if(el.tagName!=='P')return null;const st=el.querySelector('strong,b'),t=cleanText(el);return st&&t&&squash(st.textContent)===squash(t)&&t.length<160&&!onlyLink(el)&&!el.querySelector('details,img,iframe')?t:null;};
// "Адрес: …", "Тел.: …" — a contact line with a short label
const isLabelled=el=>{const i=cleanText(el).indexOf(':');return i>1&&i<45||!!el.querySelector('a[href^="mailto:"],a[href^="tel:"]');};
// A bold line like "Предлагает:" inside a contact block introduces a sub-list rather than a new card.
const subLabelOf=el=>{const t=titleOf(el);return t&&/:$/.test(t)&&t.length<60?t:null;};
// Old pages put a document title into two links or a link plus stray text: join them back into one link.
function joinSplitLinks(source){
 for(const a of [...source.querySelectorAll('a[href]')]){
  if(!a.isConnected)continue;const row=a.closest('p,li');if(!row)continue;
  for(;;){const next=[...row.querySelectorAll('a[href]')].find(b=>b!==a&&!a.contains(b)&&a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING);
   if(!next||next.getAttribute('href')!==a.getAttribute('href'))break;
   const range=document.createRange();range.setStartAfter(a);range.setEndBefore(next);if(squash(range.toString())||range.cloneContents().querySelector('img,br'))break;
   const gap=range.toString();range.deleteContents();if(gap)a.append(gap);a.append(...next.childNodes);next.remove();}
  if(!fileExt.test(a.getAttribute('href')))continue;
  // trailing text that continues the title ("…» на 2024 год", "имени …")
  let n=a.nextSibling;while(n&&n.nodeType===3&&!n.textContent.trim())n=n.nextSibling;
  if(n&&n.nodeType===3&&row.contains(n)&&/^[\s ]*[a-zа-яё»”")]/.test(n.textContent)&&n.textContent.trim().length<80&&!n.nextSibling){a.append(' ',n.textContent.trim());n.remove();}
 }
 // a separate paragraph that only continues the previous document title
 for(const p of [...source.querySelectorAll('p')]){const prev=p.previousElementSibling;if(!prev||prev.tagName!=='P'||p.querySelector('a,img')||!/^[a-zа-яё»”]/.test(p.textContent.replace(/^[\s ​]+/,''))||cleanText(p).length>80)continue;
  const a=prev.querySelectorAll('a[href]');if(a.length===1&&fileExt.test(a[0].getAttribute('href'))&&squash(a[0].textContent)===squash(prev.textContent)){a[0].append(' ',cleanText(p));p.remove();}}
}
// A table that only lays out columns of paragraphs becomes a stack of blocks; data tables stay tables.
function linearizeLayoutTables(source){
 for(const table of [...source.querySelectorAll('table')]){
  if(table.querySelector('th,table')||table.rows.length>4)continue;
  const cells=[...table.querySelectorAll('td')];
  if(!cells.some(td=>td.querySelectorAll(':scope>p,:scope>div,:scope>ul').length>=8))continue;
  const stack=document.createElement('div');stack.className='layout-stack';
  for(const td of cells){if(!squash(td.textContent)&&!td.querySelector('img,iframe,video'))continue;const cell=document.createElement('div');cell.className='layout-cell';cell.append(...td.childNodes);stack.append(cell);}
  const wrap=table.parentElement.classList.contains('table-scroll')&&table.parentElement.children.length===1?table.parentElement:table;
  wrap.replaceWith(stack);
 }
}
function makeHeading(level,cls,el){const h=document.createElement('h'+level);h.className=cls;h.append(...el.childNodes);el.replaceWith(h);
 const w=document.createTreeWalker(h,NodeFilter.SHOW_TEXT),t=[];while(w.nextNode())t.push(w.currentNode);if(t.length){t[0].textContent=t[0].textContent.replace(/^[\s\u00a0\u200b]+/,'');t.at(-1).textContent=t.at(-1).textContent.replace(/[\s\u00a0\u200b]+$/,'');}
 return h;}
function cardList(lines,labelled){const ul=document.createElement('ul');
 for(const el of lines){const li=document.createElement('li'),html=el.innerHTML.replace(/<br\s*\/?>\s*/g,' ').trim(),i=html.indexOf(':');
  if(labelled&&i>1&&i<45&&!html.slice(0,i).includes('<')){const label=document.createElement('span');label.className='info-label';label.textContent=html.slice(0,i).trim();li.append(label);li.insertAdjacentHTML('beforeend','<span>'+html.slice(i+1).trim()+'</span>');}
  else li.innerHTML=html;ul.append(li);el.remove();}
 return ul;}
function enhanceBlocks(box,ctx){
 const groups=[[]];for(const el of [...box.children]){if(isEmptyP(el)){el.remove();if(groups.at(-1).length)groups.push([]);}else groups.at(-1).push(el);}
 if(!groups.at(-1).length)groups.pop();
 let cards=null,links=null;
 const groupTitle=(els)=>{const h=makeHeading(ctx.base,'group-title',els.at(-1));for(const el of els.slice(0,-1).reverse()){const k=document.createElement('span');k.className='group-kicker';k.append(...el.childNodes);h.prepend(k,' ');el.remove();}ctx.titled=true;cards=null;links=null;return h;};
 for(const [gi,group] of groups.entries()){
  const next=groups[gi+1];
  // "Администрация ТЦБС" alone (or with a subtitle) right before a block that starts with its own bold title
  if(group.length<=3&&group.every(el=>titleOf(el)&&!subLabelOf(el))&&next&&titleOf(next[0])){groupTitle(group);continue;}
  // "Администрация ТЦБС" + "Директор: …": the first bold line is a group heading, the second titles the card.
  if(group.length>=3&&titleOf(group[0])&&titleOf(group[1])&&!subLabelOf(group[1])&&(group.length>=4||!titleOf(group[2]))){groupTitle([group.shift()]);}
  let title=titleOf(group[0]),lines=group.slice(1),hasSub=lines.some(subLabelOf);
  // "2026 год" over a run of plain paragraphs is a section heading, not a contact card
  if(title&&!subLabelOf(group[0])&&title.length<=60&&!/:/.test(title)&&lines.length&&!hasSub&&!lines.some(isLabelled)&&!(box.classList.contains('layout-cell')&&group.length<=4)
   // …unless it sits in a row of same-shaped blocks that become cards ("Учетный каталог", "Алфавитный каталог")
   &&!(next&&titleOf(next[0])&&next.slice(1).some(isLabelled)&&group.length>=3&&group.length<=14&&lines.every(el=>el.tagName==='P'&&cleanText(el).length<220&&!titleOf(el)))){groupTitle([group.shift()]);title=null;}
  const contactCard=title&&group.length>=3&&group.length<=(hasSub?45:14)&&!subLabelOf(group[0])&&lines.every(el=>el.tagName==='P'&&cleanText(el).length<(hasSub?260:220)&&(!titleOf(el)||subLabelOf(el)))&&!(hasSub&&subLabelOf(lines[0]));
  const textCard=!contactCard&&title&&ctx.titled&&box.classList.contains('layout-cell')&&group.length>=2&&group.length<=4&&lines.every(el=>el.tagName==='P'&&!titleOf(el)&&!onlyLink(el))&&lines.some(el=>cleanText(el).length>=100);
  if(contactCard||textCard){
   links=null;
   if(!cards){cards=document.createElement('div');cards.className='info-cards';group[0].before(cards);}
   const card=document.createElement('section');card.className='info-card'+(textCard?' info-card-text':'');
   const h=document.createElement('h'+(ctx.titled?ctx.base+1:ctx.base));h.className='info-card-title';h.textContent=title;card.append(h);
   if(textCard){for(const el of lines)card.append(el);}
   else{let run=[],labelled=true;const flush=()=>{if(run.length){const ul=cardList(run,labelled);if(!labelled)ul.className='info-items';card.append(ul);}run=[];};
    for(const el of lines){if(subLabelOf(el)){flush();labelled=false;const p=document.createElement('p');p.className='info-sub';p.append(...el.childNodes);el.remove();card.append(p);}else run.push(el);}flush();}
   group[0].remove();cards.append(card);continue;
  }
  cards=null;
  for(const el of group){
   if(onlyLink(el)&&!el.classList.contains('doc-row')){
    if(!links){links=document.createElement('div');links.className='link-grid';el.before(links);}
    const a=el.querySelector('a');a.classList.add('link-card');links.append(a);el.remove();
   }else links=null;
  }
 }
 for(const grid of box.querySelectorAll(':scope>.link-grid'))if(grid.children.length<3){for(const a of [...grid.children]){a.classList.remove('link-card');const p=document.createElement('p');p.append(a);grid.before(p);}grid.remove();}
 // Plain short lines right before a list ("Стандарт деятельности библиотеки" + list of files) are its heading.
 const isHeadLine=el=>el&&el.tagName==='P'&&!el.querySelector('a,img,iframe')&&!el.classList.contains('doc-row')&&(t=>t.length>=2&&t.length<=100&&!/[.:;,!?]$/.test(t)&&!/^[a-zа-яё]/.test(t))(cleanText(el));
 const heads=[];
 for(const el of [...box.children]){if(!isHeadLine(el))continue;const nx=el.nextElementSibling;
  if(nx&&(nx.classList.contains('doc-list')||(/^(UL|OL)$/.test(nx.tagName))))heads.push([el,0]);
  else if(isHeadLine(nx)&&nx.nextElementSibling&&nx.nextElementSibling.classList.contains('doc-list'))heads.push([el,1]);}
 const subs=new Set(heads.filter(([,f])=>f).map(([o])=>o.nextElementSibling));
 for(const [el] of heads){const sub=subs.has(el);const h=makeHeading(sub?ctx.base+1:ctx.base,'group-title'+(sub?' group-sub':''),el);if(!sub)ctx.titled=true;}
}
// The same contact card repeated further down the page (old layout tables) is shown once; extra lines are kept.
function dropDuplicateCards(source){
 const seen=new Map();let removed='';
 for(const card of [...source.querySelectorAll('.info-card')]){
  const key=squash(card.querySelector('.info-card-title').textContent),lines=[...card.querySelectorAll('li')];
  const first=seen.get(key);if(!first||card.querySelector('.info-sub,p')){if(!first)seen.set(key,card);continue;}
  const have=new Set([...first.querySelectorAll('li')].map(li=>squash(li.textContent)));
  if(![...have].every(t=>lines.some(li=>squash(li.textContent)===t)))continue;
  const ul=first.querySelector('ul');
  for(const li of lines){if(have.has(squash(li.textContent)))removed+=li.textContent+' | ';else ul.append(li);}
  removed+=card.querySelector('.info-card-title').textContent+' || ';
  const box=card.parentElement;card.remove();if(!box.children.length)box.remove();
 }
 // a group heading left without content, repeating an earlier heading
 const titles=new Set();
 for(const h of [...source.querySelectorAll('.group-title')]){const t=squash(h.textContent),nx=h.nextElementSibling;
  if(titles.has(t)&&(!nx||nx.classList.contains('group-title'))){removed+=h.textContent+' || ';h.remove();}else titles.add(t);}
 for(const cell of [...source.querySelectorAll('.layout-cell')])if(!squash(cell.textContent))cell.remove();
 if(removed)source.dataset.deduped=removed;
}
function addToc(root,source,base){
 const hs=[...source.querySelectorAll('h'+base)];
 if(hs.length<4||root.scrollHeight<innerHeight*3)return;
 const nav=document.createElement('nav');nav.className='page-toc';nav.setAttribute('aria-labelledby','page-toc-title');
 const t=document.createElement('p');t.className='page-toc-title';t.id='page-toc-title';t.textContent='На этой странице';
 const ol=document.createElement('ol');
 hs.forEach((h,i)=>{h.id||=('section-'+(i+1));const li=document.createElement('li'),a=document.createElement('a');a.href='#'+h.id;
  const k=h.querySelector('.group-kicker');a.textContent=k?cleanText(h).slice(cleanText(k).length).trim():cleanText(h);li.append(a);ol.append(li);});
 nav.append(t,ol);const wrap=document.createElement('div');wrap.className='toc-layout';source.before(wrap);wrap.append(nav,source);
}
// Phones in contact lines become tel: links in the site's format: +7 (38171) 2-12-42, +7 983 520-05-42 (digits unchanged).
const phoneRe=/(?:(?:\+7|8)[\s\u00a0-]*)?\(\s*38171\s*\)[\s\u00a0-]*(\d{1,3}(?:-\d{1,3}){1,3})|(?:\+7|8)[\s\u00a0-]*\(?(9\d\d)\)?[\s\u00a0-]*(\d{3})[\s\u00a0-]*(\d{2})[\s\u00a0-]*(\d{2})/g;
function linkPhones(source){
 const w=document.createTreeWalker(source,NodeFilter.SHOW_TEXT),nodes=[];
 while(w.nextNode()){const n=w.currentNode,row=n.parentElement.closest('li,p,td,dd');if(!row||n.parentElement.closest('a')||!/тел|факс|сот\./i.test(row.textContent))continue;phoneRe.lastIndex=0;if(phoneRe.test(n.textContent))nodes.push(n);}
 for(const n of nodes){const t=n.textContent,frag=document.createDocumentFragment();let last=0;phoneRe.lastIndex=0;
  for(const m of t.matchAll(phoneRe)){let text,tel;
   if(m[1]){const d=m[1].replace(/\D/g,'');if(d.length!==5)continue;text='+7 (38171) '+m[1];tel='+738171'+d;}
   else{text=`+7 ${m[2]} ${m[3]}-${m[4]}-${m[5]}`;tel='+7'+m[2]+m[3]+m[4]+m[5];}
   const a=document.createElement('a');a.href='tel:'+tel;a.className='tel-link';a.textContent=text;frag.append(t.slice(last,m.index),a);last=m.index+m[0].length;}
  if(last){frag.append(t.slice(last));n.replaceWith(frag);}}
}
// File links that only wrap a picture are named after the nearest title above them; pictures whose alt only repeats
// the page title take that title (or their figcaption). Nothing is named when no such text exists.
function nameMediaLinks(source,pageTitle){
 const headText=h=>{const k=h.querySelector('.group-kicker');return k?cleanText(h).slice(cleanText(k).length).trim():cleanText(h);};
 const titleNear=el=>{let n=el.closest('p,li,figure')||el;for(let up=0;up<3&&n&&n!==source;up++,n=n.parentElement){let p=n.previousElementSibling;for(let i=0;p&&i<6;i++,p=p.previousElementSibling){if(/^H[2-6]$/.test(p.tagName)||titleOf(p))return headText(p);}}return '';};
 const same=img=>!img.alt.trim()||img.alt.trim()===pageTitle;
 for(const img of source.querySelectorAll('img')){if(!same(img))continue;const cap=img.closest('figure')?.querySelector('figcaption'),t=cap?cleanText(cap):titleNear(img);if(t&&t!==pageTitle)img.alt=t;}
 for(const a of source.querySelectorAll('a.doc-link')){if(squash(a.textContent)||a.hasAttribute('aria-label'))continue;const img=a.querySelector('img'),ext=(a.dataset.ext||'').toUpperCase(),name=img&&!same(img)?img.alt.trim():titleNear(a);
  if(name)a.setAttribute('aria-label',`${name}, ${img?'изображение ':'файл '}${ext}`);}
}
function enhanceSource(root){
 for(const source of root.querySelectorAll('.source-content')){
  joinSplitLinks(source);
  for(const a of source.querySelectorAll('a[href]')){const m=a.getAttribute('href').match(fileExt);if(!m||source.classList.contains('archive-content')&&a.querySelector('img')&&!squash(a.textContent))continue;a.classList.add('doc-link');a.dataset.ext=m[1].toLowerCase().replace('jpeg','jpg');if(a.childNodes.length>1||a.firstElementChild){const t=document.createElement('span');t.className='doc-title';t.append(...a.childNodes);a.append(t);}
   const row=a.closest('p,li');if(row&&squash(row.textContent)===squash(a.textContent)){row.classList.add('doc-row');
    // the &nbsp; left after a hidden file icon would add an empty line above the link
    const w=document.createTreeWalker(row,NodeFilter.SHOW_TEXT);const blank=[];while(w.nextNode())if(!a.contains(w.currentNode)&&!squash(w.currentNode.textContent))blank.push(w.currentNode);blank.forEach(n=>n.remove());}}
  // a web link between file rows belongs to the same list
  for(const p of source.querySelectorAll('p')){if(!onlyLink(p)||p.classList.contains('doc-row'))continue;const pr=p.previousElementSibling,nx=p.nextElementSibling;if(pr?.classList.contains('doc-row')&&nx?.classList.contains('doc-row')){p.classList.add('doc-row');const a=p.querySelector('a');a.classList.add('doc-link');a.dataset.ext='сайт';}}
  for(const ul of source.querySelectorAll('ul,ol'))if(ul.children.length&&[...ul.children].every(li=>li.classList.contains('doc-row')))ul.classList.add('doc-list');
  // runs of file paragraphs become one list block
  for(const p of [...source.querySelectorAll('p.doc-row')]){if(p.parentElement.classList.contains('doc-list'))continue;const run=[p];let n=p.nextElementSibling;while(n&&n.tagName==='P'&&n.classList.contains('doc-row')){run.push(n);n=n.nextElementSibling;}
   if(run.length<2)continue;const d=document.createElement('div');d.className='doc-list';p.before(d);d.append(...run);}
  const box=[source,...source.querySelectorAll('div:not(.doc-list)')].reduce((best,el)=>{const n=[...el.children].filter(c=>c.tagName==='P').length;return n>best.n?{el,n}:best;},{el:source,n:0}).el;
  linearizeLayoutTables(source);
  const ctx={base:source.querySelector('h2')?3:2,titled:false};
  for(const b of [box,...source.querySelectorAll('.layout-cell')])enhanceBlocks(b,ctx);
  dropDuplicateCards(source);
  linkPhones(source);
  nameMediaLinks(source,cleanText(root.querySelector('h1')||source));
  addToc(root,source,ctx.base);
 }
}
// Breadcrumbs and the current nav item come from the sitemap groups (sections-index.js), so they work before sections.js loads.
const sectionGroups=window.librarySectionGroups||{names:[],pages:{},aliases:{}};
const extraGroups={libraries:'Филиалы',fullcontacts:'Библиотека',resources:'Ресурсы'};
const groupIndex=key=>key?sectionGroups.pages[key]??(extraGroups[key]?sectionGroups.names.indexOf(extraGroups[key]):-1):-1;
function parentOf(key){if(key==='services'||key==='kids')return null;if(key?.startsWith('kids-'))return{label:'Детям',href:pathOf('kids')};if(article)return{label:'Новости',href:pathOf('news')};if(key?.startsWith('event-'))return{label:'Афиша',href:pathOf('events')};const i=groupIndex(key);return i>=0?{label:sectionGroups.names[i],href:pathOf('sitemap')+'#group-'+i}:null;}
function breadcrumbs(title,chain){const plain=String(title).replace(/<[^>]+>/g,''),parent=parentOf(page),list=chain||(parent&&parent.label!==plain?[parent]:[]);return `<nav class="breadcrumb" aria-label="Хлебные крошки"><ol><li><a href="/">Главная</a></li>${list.map(c=>`<li><a href="${c.href}">${c.label}</a></li>`).join('')}<li aria-current="page">${plain}</li></ol></nav>`;}
// Inner page header: a light band in the section's colour, breadcrumbs, H1, the page intro and a decorative scene.
// Scenes: site/assets/illustrations/<name>-{480,720,960}.{avif,webp}; owls: site/assets/mascot/<pose>-{240,480}.{avif,webp}.
const scenes={detyam:712,afisha:739,novosti:694,chitatelyam:693,kraevedenie:667,arhivy:603,'biblioteki-rayona':687,'o-biblioteke':714,resursy:643,kollegam:684};
const owlPoses={point:[433,480],confused:[342,480],wave:[405,480],'head-happy':[457,480],read:[440,480],think:[363,480],celebrate:[418,480]};
function owlPicture(pose,sizes,attrs=''){const [w,h]=owlPoses[pose],b='/assets/mascot/'+pose,set=ext=>`${b}-240.${ext} 240w, ${b}-480.${ext} 480w`;return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${b}-480.webp" srcset="${set('webp')}" sizes="${sizes}" width="${w}" height="${h}" alt="" ${attrs}></picture>`;}
function headArt(name){
 if(name.startsWith('owl:'))return `<div class="page-head-art is-owl">${owlPicture(name.slice(4),'(max-width: 760px) 150px, 240px','fetchpriority="high"')}</div>`;
 const b='/assets/illustrations/'+name,set=ext=>[480,720,960].map(w=>`${b}-${w}.${ext} ${w}w`).join(', '),sizes='(max-width: 760px) min(80vw, 340px), 460px';
 return `<div class="page-head-art"><picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${b}-720.webp" srcset="${set('webp')}" sizes="${sizes}" width="960" height="${scenes[name]}" alt="" fetchpriority="high"></picture></div>`;}
const readerKeys=new Set(['renew','ask','firstvisit','delivery','documents','catalog','services']);
const branchKeys=new Set(['libraries','fullcontacts','info-biblioteki-cbs','info-biblioteki-filialy']);
// [scene, tone]: tone is one of sun, rowan, teal, sky, navy (CSS: .page-head[data-tone])
function headTheme(key,notFound){
 if(notFound)return ['owl:confused','sky'];
 if(key==='sitemap')return ['owl:point','sun'];
 if(key==='kids')return ['detyam','sun'];
 if(key==='kids-books')return ['owl:read','teal'];
 if(key==='kids-quiz')return ['owl:think','sky'];
 if(key==='kids-badges')return ['owl:celebrate','rowan'];
 if(key==='events'||key.startsWith('event-'))return ['afisha','rowan'];
 if(article||key==='news')return ['novosti','sky'];
 const isArchive=!!archiveKey&&key===archiveKey,group=sectionGroups.names[groupIndex(isArchive?archiveSection:key)];
 if(readerKeys.has(key)||group==='Услуги читателям')return ['chitatelyam','sun'];
 // archive pages and the archive/database roots themselves
 if(isArchive||/^info-(elektronnyy-arhiv|arhiv-dokumentov|baza-dannyh)/.test(key))return ['arhivy',group==='Ресурсы'?'sky':'teal'];
 if(branchKeys.has(key)||group==='Филиалы')return ['biblioteki-rayona','teal'];
 if(key==='heritage'||group==='Краеведение')return ['kraevedenie','teal'];
 if(key==='resources'||group==='Ресурсы')return ['resursy','sky'];
 if(group==='Коллегам')return ['kollegam','navy'];
 return ['o-biblioteke','navy'];
}
function pageHead(title,crumbs,intro,theme){const plain=String(title).replace(/<[^>]+>/g,'');
 return `<div class="page-head" data-tone="${theme[1]}"><div class="page-head-text">${breadcrumbs(title,crumbs)}<h1${plain.length>42?' class="is-long"':''}>${title}</h1>${intro}</div>${headArt(theme[0])}</div>`;}
// aria-current="page" for the page itself, "true" for the nav item of its section.
const navSections={kids:key=>key.startsWith('kids'),events:key=>key.startsWith('event-'),news:()=>!!article,services:key=>sectionGroups.names[groupIndex(key)]==='Услуги читателям',heritage:key=>sectionGroups.names[groupIndex(key)]==='Краеведение',about:key=>sectionGroups.names[groupIndex(key)]==='Библиотека'};
const linkKey=a=>{try{const u=new URL(a.getAttribute('href'),location.href);if(u.origin!==location.origin)return null;return keyByPath[u.pathname]||u.searchParams.get('page');}catch{return null;}};
function markCurrentNav(){const key=article?'':archiveSection||page||'';const links=[...document.querySelectorAll('header a[href]')].filter(linkKey),target=linkKey;links.forEach(a=>a.removeAttribute('aria-current'));if(!page&&!article)return;const exact=links.filter(a=>target(a)===key);exact.forEach(a=>a.setAttribute('aria-current','page'));if(exact.some(a=>a.closest('#nav')))return;const sec=links.find(a=>a.closest('#nav')&&navSections[target(a)]?.(key));sec?.setAttribute('aria-current','true');}
// The current page as markup: a page of `pages`, an article, or «Такой страницы нет».
function pageMarkup(){let data=Object.hasOwn(pages,page)?pages[page]:null;if(article&&Object.hasOwn(articles,article))data=articleData(articles[article]);const notFound=!data;
 if(notFound){const item=article?['Новость не найдена: возможно, её уже убрали с сайта.','news','Все новости']:page?.startsWith('event-')?['Событие не найдено: возможно, его уже убрали из афиши.','events','Вся афиша']:null;data={title:'Такой страницы нет',html:item?`<p>${item[0]}</p><a class="button dark" href="${pathOf(item[1])}">${item[2]}</a>`:'<p>Вернитесь на главную или воспользуйтесь поиском.</p><a class="button dark" href="/">На главную</a>'};}
 const theme=headTheme(page||'',notFound);if(data.hero)return{data,notFound,theme,html:data.hero+data.html};
 // the page's own intro paragraph moves into the header
 const m=/^\s*<p class="page-intro">[\s\S]*?<\/p>/.exec(data.html),intro=m?m[0].trim():'',body=m?data.html.slice(m[0].length):data.html;
 return{data,notFound,theme,html:pageHead(data.title,data.crumbs,intro,theme)+body};}
function renderPage(){if($('#home'))$('#home').hidden=true;const root=$('#page');root.hidden=false;const {data,notFound,html,theme}=pageMarkup();root.removeAttribute('aria-busy');root.dataset.page=page||'article';root.dataset.tone=theme[1];root.innerHTML=html;if(dataPage)root.dataset.render=hashOf(html);document.title=unesc(data.docTitle||data.title)+' | Тарская библиотека';if(notFound){document.title='Страница не найдена | Тарская библиотека';if(!document.querySelector('meta[name="robots"]')){const m=document.createElement('meta');m.name='robots';m.content='noindex';document.head.append(m);}}enhanceSource(root);rewriteLinks(root);markCurrentNav();document.dispatchEvent(new CustomEvent('page:rendered',{detail:root}));if(location.hash){try{document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();}catch{}}}
if(redirecting){}else if(prerendered||itemKey)markCurrentNav();else if(dataPage&&!isHome){if($('#home'))$('#home').hidden=true;const root=$('#page');root.hidden=false;root.setAttribute('aria-busy','true');root.innerHTML='<p class="page-loading">Загружаем…</p>';}else if(page||article||missingPath){if($('#home'))$('#home').hidden=true;const root=$('#page');root.hidden=false;if(page&&!Object.hasOwn(pages,page)){root.setAttribute('aria-busy','true');root.innerHTML='<p class="page-loading">Загружаем раздел…</p>';loadSections().then(renderPage);}else renderPage();markCurrentNav();}
// Data file: fetched on the pages that show it, and for search (article and event titles) when the search opens.
let dataLoading;
function loadData(){return dataLoading??=fetch(dataUrl,{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.text();}).then(t=>{readData(JSON.parse(t));addDataToSearch();return true;}).catch(err=>{console.warn(`Афиша и новости: файл ${dataUrl} не прочитан (${err.message||err}), показана сохранённая версия страницы.`);return false;});}
function showData(fresh){
 if(isHome){if(!fresh)return;const b=homeBlocks(),mf=document.querySelector('#events .month-feature'),jg=document.querySelector('#news .journal-grid');
  if(mf&&mf.dataset.render!==b.agendaHash){const grid=mf.parentElement;mf.outerHTML=b.agenda;rewriteLinks(grid);document.dispatchEvent(new CustomEvent('page:rendered',{detail:grid}));}
  if(jg&&jg.dataset.render!==b.journalHash){jg.innerHTML=b.journal;jg.dataset.render=b.journalHash;rewriteLinks(jg);document.dispatchEvent(new CustomEvent('page:rendered',{detail:jg}));}
  return;}
 // stale or missing snapshot: render; a file that could not be read leaves a prerendered page as it is
 if(fresh?!prerendered||itemKey||$('#page').dataset.render!==hashOf(pageMarkup().html):!prerendered&&!itemKey)renderPage();
}
if(!redirecting&&dataPage)loadData().then(fresh=>{showData(fresh);document.documentElement.classList.remove('item-loading');window.libraryDataState=fresh?'fresh':'failed';});
else document.documentElement.classList.remove('item-loading');
// Mobile menu: opening moves focus to the first item; while open, Tab and Shift+Tab cycle through the items and the toggle.
// Esc and the toggle close it and leave focus on the toggle.
const navItems=()=>[...$('#nav').querySelectorAll('a')].filter(a=>a.getClientRects().length);
function setMenu(open,moveFocus){$('#nav').classList.toggle('open',open);$('#menu').setAttribute('aria-expanded',String(open));$('#menu').setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');if(open&&moveFocus)navItems()[0]?.focus();}
$('#menu').addEventListener('click',()=>setMenu(!$('#nav').classList.contains('open'),true));
$('#nav').addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false);});
const accessDefaults={enabled:false,size:'125',colors:'bw',spacing:false,images:false,motion:true};
let access={...accessDefaults};try{const saved=JSON.parse(localStorage.getItem('taralib-access')||'null');if(saved&&typeof saved==='object')access={...access,...saved};}catch{}
if(!['100','125','150','175'].includes(access.size))access.size='125';if(!['bw','wb','blue'].includes(access.colors))access.colors='bw';
function applyAccess(){
 const body=document.body;body.classList.toggle('access-mode',!!access.enabled);body.classList.toggle('access-spacing',!!(access.enabled&&access.spacing));body.classList.toggle('access-no-images',!!(access.enabled&&access.images));body.classList.toggle('access-no-motion',!!(access.enabled&&access.motion));
 document.documentElement.style.fontSize=access.enabled?access.size+'%':'';
 body.dataset.accessColors=access.colors;
 $('#access-enabled').checked=!!access.enabled;$('#access-spacing').checked=!!access.spacing;$('#access-images').checked=!!access.images;$('#access-motion').checked=!!access.motion;
 document.querySelectorAll('[name="access-size"]').forEach(el=>el.checked=el.value===access.size);document.querySelectorAll('[name="access-colors"]').forEach(el=>el.checked=el.value===access.colors);
 $('#access-off-note').hidden=!!access.enabled;$('.access-settings').classList.toggle('is-off',!access.enabled);
 $('#access-status').textContent=access.enabled?'Версия для слабовидящих включена. Настройки сохранены.':'Обычная версия. Настройки сохраняются на этом устройстве.';
 try{localStorage.setItem('taralib-access',JSON.stringify(access));}catch{$('#access-status').textContent='Настройки применены. В этом браузере они сохранятся только до закрытия страницы.';}
 document.documentElement.classList.toggle('no-motion',!!(access.enabled&&access.motion));
 const toggle=$('#accessibility');toggle.removeAttribute('aria-pressed');toggle.querySelector('span').textContent=access.enabled?'Обычная версия':'Версия для слабовидящих';
 if(access.enabled){toggle.removeAttribute('aria-haspopup');toggle.removeAttribute('aria-controls');}else{toggle.setAttribute('aria-haspopup','dialog');toggle.setAttribute('aria-controls','access-dialog');}
 $('#access-settings-open').hidden=!access.enabled;
 syncMotionClass();
 if(access.enabled){document.querySelectorAll('.page-head h1 .w,.page-head-art img').forEach(el=>{el.getAnimations().forEach(a=>{try{a.finish();}catch{a.cancel();}});});}
 if(access.enabled&&access.motion){showPending();document.getAnimations().forEach(a=>{try{a.finish();}catch{a.cancel();}});}
}
applyAccess();
function openAccessDialog(){$('#access-dialog').showModal();$('#access-enabled').focus();}
// With the mode on, the topbar button is the visible «Обычная версия» switch (ГОСТ Р 52872); settings live behind «Настройки».
$('#accessibility').addEventListener('click',()=>{if(access.enabled){access.enabled=false;applyAccess();return;}openAccessDialog();});
$('#access-settings-open').addEventListener('click',openAccessDialog);
for(const id of ['access-close','access-done'])$('#'+id).addEventListener('click',()=>$('#access-dialog').close());
$('#access-reset').addEventListener('click',()=>{access={...accessDefaults};applyAccess();});
$('#access-enabled').addEventListener('change',e=>{access.enabled=e.target.checked;applyAccess();});
for(const key of ['spacing','images','motion'])$('#access-'+key).addEventListener('change',e=>{access[key]=e.target.checked;access.enabled=true;applyAccess();});
for(const key of ['size','colors'])document.querySelectorAll('[name="access-'+key+'"]').forEach(el=>el.addEventListener('change',e=>{access[key]=e.target.value;access.enabled=true;applyAccess();}));
document.addEventListener('keydown',e=>{if(!$('#nav').classList.contains('open')||e.defaultPrevented)return;
 if(e.key==='Escape'){setMenu(false);$('#menu').focus();return;}
 if(e.key!=='Tab'||!$('#menu').getClientRects().length||document.querySelector('dialog[open]'))return;
 const loop=[...navItems(),$('#menu')],i=loop.indexOf(document.activeElement);e.preventDefault();
 loop[i<0?0:(i+(e.shiftKey?-1:1)+loop.length)%loop.length].focus();});
// Search: titles, sitemap link labels, group names and keyword hints; words are matched by a rough Russian stem,
// so «продлить книги» finds «Продлить книгу». Hints: [context name, keywords shown under the title, hidden synonyms].
// Synonyms are added only where the page itself has the answer (contacts: hours and the children's library;
// «Структура»: free Internet, Wi-Fi, copying, scanning and printing in the reading rooms).
const searchHints={kids:['Детям','что почитать, викторины, значки','дети детский ребенок школьник школьникам игра игры подросток'],'kids-books':['Детям','подбор книг по возрасту и жанру','книга книги почитать посоветуй список дети школьник'],'kids-quiz':['Детям','литературная викторина','викторина тест игра вопросы'],'kids-badges':['Детям','значки читателя','значок награда'],catalog:['Электронный каталог','поиск книг по автору и названию'],events:['Афиша','события, встречи, концерты, Пушкинская карта','расписание мероприятия'],renew:['','продление срока онлайн'],firstvisit:['','запись, регистрация, паспорт, правила'],ask:['','вопрос, справка'],delivery:['','доставка книг на дом'],documents:['','копии статей'],contacts:['Контакты','адрес, телефон, часы работы, детская библиотека','режим расписание график работает открыто выходной время дети детский ребенок школьник'],'info-struktura':['','отделы и залы: бесплатный интернет, Wi-Fi, ксерокопирование, сканирование, печать, клубы','интернет wifi вайфай компьютер ксерокс ксерокопия копия копировать распечатать печать принтер сканер клуб'],'info-kursy-kompyuternoy-gramotnosti':['','работа на компьютере, безопасность в интернете','компьютер интернет'],libraries:['Филиалы','адреса библиотек района'],news:['Новости',''],heritage:['Краеведение','история края'],about:['О библиотеке',''],services:['Услуги читателям','все услуги'],'info-platnye-meropriyatiya':['','мероприятия по Пушкинской карте, билеты'],'info-vakansii':['','работа в библиотеке']};
const searchNorm=s=>String(s).toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/<[^>]+>/g,' ').replace(/[^a-zа-я0-9]+/g,' ').trim();
const stemEndings=['ением','ться','ение','ения','ению','ании','ание','ания','ами','ями','ого','его','ому','ему','ешь','ишь','ить','ать','ять','еть','ой','ей','ам','ям','ах','ях','ов','ев','ом','ем','ую','юю','ая','яя','ое','ее','ые','ие','ый','ий','ть','ет','ит','ут','ют','ь','а','я','ы','и','у','ю','е','о'];
const stem=w=>{for(const e of stemEndings)if(w.endsWith(e)&&w.length-e.length>=3)return w.slice(0,-e.length);return w;};
const stopWords=new Set(['в','во','на','и','по','для','как','с','со','о','об','к','у','от','до','за','из','а','или','не','мне','где','вы','вас','ли','можно','есть']);
const searchWords=s=>searchNorm(s).split(' ').filter(Boolean);
const searchEntry=(key,title,url)=>{const [name='',hint='',hidden='']=searchHints[key]||[],gi=groupIndex(key),group=key.startsWith('event-')?'Афиша':gi>=0?sectionGroups.names[gi]:'';const names=[title,...(sectionGroups.aliases[key]||[]),name].filter(Boolean);return{title,url,context:[name||group,hint].filter(Boolean).join(' · '),names:names.map(searchWords),extra:searchWords(group+' '+hint+' '+hidden)};};
const searchable=[...Object.entries(pages).map(([key,value])=>searchEntry(key,value.title,pathOf(key))),...Object.entries(sectionTitles).filter(([key])=>!Object.hasOwn(pages,key)).map(([key,title])=>searchEntry(key,title,pathOf(key))),
 // the children's library has its own site (linked in the footer)
 {title:'Центральная районная детская библиотека',url:'http://www.dbibtara.ru/',context:'Внешний сайт · dbibtara.ru',names:[searchWords('Детская библиотека Тары')],extra:searchWords('дети детский ребенок школьник')}];
// «во сколько», «расписание», «часы»…: the contacts page goes first with the hours of the central library.
const hoursLine='Пн–Пт 10:00–19:00, Вс 10:00–17:00, Сб — выходной';
const timeQuery=/(^| )(расписан|скольк|час(ы|ов)?( |$)|режим|открыт|работает|работаете|работают|график|выходн|время работ|когда работ)/;
const wordHit=(q,words)=>words.some(w=>w.startsWith(q)||stem(w).startsWith(q));
function scoreEntry(entry,stems){let best=-1;entry.names.forEach((words,i)=>{if(!stems.every(q=>wordHit(q,words)))return;const same=words.length===stems.length;best=Math.max(best,(same?1000:300-10*(words.length-stems.length))+(i===0?5:0));});
 if(best<0){const inNames=q=>entry.names.some(words=>wordHit(q,words));if(!stems.every(q=>inNames(q)||wordHit(q,entry.extra)))return -1;best=100+30*stems.filter(inNames).length;}return best+20*stems.filter(q=>wordHit(q,entry.extra)).length;}
const searchStart=['catalog','renew','events','contacts','firstvisit','libraries'];
function searchLink(entry){const a=document.createElement('a');a.href=entry.url;if(/^https?:/.test(entry.url))a.dataset.external='';const t=document.createElement('span');t.className='search-title';t.textContent=entry.title;a.append(t);if(entry.context){const c=document.createElement('small');c.className='search-context';c.textContent=entry.context;a.append(c);}return a;}
const callNote=()=>{const p=document.createElement('p');p.className='search-call';p.innerHTML='Не нашли? Позвоните: <a href="tel:+73817121242">+7 (38171) 2-12-42</a>';return p;};
function search(){const query=searchNorm($('#search').value),words=searchWords(query),useful=words.filter(w=>!stopWords.has(w)),stems=(useful.length?useful:words).map(stem);const box=$('#search-results');box.replaceChildren();
 const rank=list=>{const seen=new Set();return list.filter(([s])=>s>=0).sort((a,b)=>b[0]-a[0]).map(([,e])=>e).filter(e=>!seen.has(e.url)&&seen.add(e.url));};
 let found,partial=false;if(!stems.length)found=searchStart.map(k=>searchable.find(e=>e.url===pathOf(k))).filter(Boolean);else found=rank(searchable.map(e=>[scoreEntry(e,stems),e]));
 if(stems.length&&timeQuery.test(query)){const c=searchable.find(e=>e.url===pathOf('contacts'));found=[{...c,context:'Центральная библиотека · '+hoursLine},...found.filter(e=>e!==c)];}
 // nothing matches every word: show pages that match some of them
 if(!found.length&&stems.length>1){found=rank(searchable.map(e=>[stems.reduce((n,q)=>n+(scoreEntry(e,[q])>=0),0)-1,e]));partial=found.length>0;}
 if(!found.length){const p=document.createElement('p');p.className='search-empty';p.innerHTML=owlPicture('confused','72px','loading="lazy" class="search-owl"');p.append('Ничего не найдено. Попробуйте «каталог», «афиша» или «контакты».');box.append(p,callNote());return;}
 if(partial){const p=document.createElement('p');p.className='search-note';p.textContent='Точного совпадения нет. Возможно, подойдёт:';box.append(p);}
 found.slice(0,9).forEach(e=>box.append(searchLink(e)));if(partial)box.append(callNote());}
let searchOpener=null;
// Archive pages are found by title: their list (archive-index.js) is loaded the first time the dialog opens.
// Event pages and articles join the search once the data file is read (on their pages, on the home page, or when the search opens).
function addDataToSearch(){const known=new Set(searchable.map(e=>e.url)),ev=searchable.find(e=>e.url===pathOf('events'));if(ev)Object.assign(ev,searchEntry('events',pages.events.title,pathOf('events')));
 for(const e of eventItems){const url=pathOf('event-'+e.id);if(!known.has(url))searchable.push(searchEntry('event-'+e.id,e.title,url));}
 for(const n of newsItems){const url=pathOf('article-'+n.id);if(!known.has(url))searchable.push({...searchEntry('',n.title,url),context:'Новости · '+newsDate(n.date),extra:['новости']});}}
let archiveIndex;function loadArchiveIndex(){archiveIndex??=new Promise(r=>{const s=document.createElement('script');s.src='/archive-index.js';s.onload=s.onerror=r;document.head.append(s);}).then(()=>{for(const [title,url,context] of window.libraryArchiveIndex||[])searchable.push({title,url,context,names:[searchWords(title)],extra:searchWords(context)});if($('#search-dialog').open&&$('#search').value)search();});}
$('#search-open').addEventListener('click',e=>{searchOpener=e.currentTarget;$('#search-dialog').showModal();search();$('#search').focus();loadArchiveIndex();loadData().then(()=>{if($('#search-dialog').open&&$('#search').value)search();});});$('#search-close').addEventListener('click',()=>$('#search-dialog').close());$('#search').addEventListener('input',search);
$('#search-dialog').addEventListener('close',()=>{(searchOpener||$('#search-open')).focus();searchOpener=null;});
// The first Esc closes the dialog (a filled search field would otherwise swallow it); arrows and Enter reach the results.
$('#search-dialog').addEventListener('keydown',e=>{const links=[...$('#search-results').querySelectorAll('a')],i=links.indexOf(document.activeElement);
 if(e.key==='Escape'){e.preventDefault();$('#search-dialog').close();}
 else if(e.key==='Enter'&&e.target===$('#search')&&links[0]&&!links[0].href.startsWith('tel:')){e.preventDefault();links[0].click();}
 else if(e.key==='ArrowDown'&&(e.target===$('#search')||i>=0)&&links.length){e.preventDefault();links[Math.min(i+1,links.length-1)].focus();}
 else if(e.key==='ArrowUp'&&i>=0){e.preventDefault();(i?links[i-1]:$('#search')).focus();}});
$('#search-dialog').addEventListener('click',e=>{if(e.target===$('#search-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const motionAllowed=()=>!reduceMotion.matches&&!(access.enabled&&access.motion);
// Playful extras (word reveal, floating scene, blinking owl) stay off in the low-vision mode altogether.
function playful(){return !matchMedia('(prefers-reduced-motion: reduce)').matches&&!access.enabled;}
function syncMotionClass(){const r=document.documentElement;r.classList.toggle('motion-ok',playful());if(!playful())r.classList.remove('motion-intro');}
syncMotionClass();
reduceMotion.addEventListener('change',()=>{syncMotionClass();if(!motionAllowed()){showPending();document.getAnimations().forEach(a=>{try{a.finish();}catch{a.cancel();}});}});
// Elements hidden while waiting for a scroll reveal; shown at once if motion gets disabled.
function showPending(){document.querySelectorAll('[data-reveal-pending]').forEach(el=>{el.removeAttribute('data-reveal-pending');el.style.opacity='';el.style.transform='';});}
const revealGroups=['.svc-bento>a','.contact-cards>section','.source-content .info-card','.source-content .link-grid>a','.doc-list','.section-head','.service-strip>a','.agenda-grid>a','.pk-insert','.reader-title','.reader-services>a','.journal-lead','.journal-list>a','.heritage-content','.heritage-links>a','.visit>div','.footer-top','.footer-grid>div','.news-feature','.event-entry','.resource-list>a','.steps>div','.facts-row>div','.contact-layout>div','.event-feature','.poster-grid>a','.past-events','.concert-band','.event-tiles>a','.online-card','.partners'];
// Wraps every word of a heading in <span class="w"> (text only; nested elements keep their place).
function splitWords(h){const w=document.createTreeWalker(h,NodeFilter.SHOW_TEXT),nodes=[],spans=[];while(w.nextNode())nodes.push(w.currentNode);
 for(const n of nodes){const f=document.createDocumentFragment();for(const part of n.textContent.split(/(\s+)/)){if(!part)continue;if(/^\s+$/.test(part)){f.append(part);continue;}const sp=document.createElement('span');sp.className='w';sp.textContent=part;f.append(sp);spans.push(sp);}n.replaceWith(f);}
 return spans;}
// motion.js is deferred after app.js, so menus and dialogs work before it arrives; animations start on its load.
function startMotion(){
 if(!window.Motion||!motionAllowed()||startMotion.started)return;startMotion.started=true;
 const {animate,inView,scroll,stagger}=window.Motion,ease=[.22,1,.36,1],calm=[.25,.1,.25,1];
 // Only elements below the first screen are hidden, so nothing flickers and nothing stays hidden without JS.
 const reveal=scope=>{
  for(const sel of revealGroups){
   const els=[...scope.querySelectorAll(sel)].filter(el=>!el.hasAttribute('data-reveal-pending')&&!el.hasAttribute('data-revealed')&&el.getBoundingClientRect().top>innerHeight*.92);
   els.forEach((el,i)=>{
    el.setAttribute('data-reveal-pending','');el.style.opacity='0';
    inView(el,()=>{
     if(!el.hasAttribute('data-reveal-pending'))return;
     el.removeAttribute('data-reveal-pending');el.setAttribute('data-revealed','');
     if(!motionAllowed()){el.style.opacity='';return;}
     animate(el,{opacity:[0,1],y:[12,0]},{duration:.5,ease:calm,delay:(i%4)*.06}).then(()=>{el.style.transform='';el.style.opacity='';});
    },{amount:.15});
   });
  }
 };
 if(isHome){
  animate('.hero-art img',{opacity:[.6,1],scale:[1.03,1]},{duration:.6,ease:calm});
  animate('.hero-heading h1',{clipPath:['inset(0 0 100% 0)','inset(0 0 0% 0)'],y:[10,0]},{duration:.55,ease:calm,delay:.05});
  inView('.image-accordion',()=>{if(!motionAllowed())return;animate('.explore-panel',{clipPath:['inset(5% 0 0 0 round 12px)','inset(0% 0 0 0 round 12px)']},{duration:.5,ease:calm,delay:stagger(.06)});},{amount:.15});
  if(scroll&&matchMedia('(min-width:901px)').matches){
   scroll(animate('.hero-art',{y:[0,30]},{ease:'linear'}),{target:$('.hero'),offset:['start start','end start']});
   scroll(animate('.heritage-landscape',{y:['-2.5%','2.5%'],scale:[1.06,1.06]},{ease:'linear'}),{target:$('.heritage'),offset:['start end','end start']});
  }
 }
 // Inner page header: the title rises word by word, the scene floats gently.
 const intro=scope=>{
  const h=scope.querySelector('.page-head h1');
  if(h&&!h.dataset.split){h.dataset.split='1';
   if(playful()){const words=splitWords(h);words.forEach(w=>{w.style.opacity='0';});h.classList.add('is-split');
    animate(words,{opacity:[0,1],y:['0.4em',0]},{duration:.5,ease,delay:stagger(.045)});}
   document.documentElement.classList.remove('motion-intro');}
  const art=scope.querySelector('.page-head-art img');
  if(art&&!art.dataset.float&&playful()){art.dataset.float='1';animate(art,{y:[0,-9,0],rotate:[0,-.7,0]},{duration:6.5,ease:'easeInOut',repeat:Infinity});}
 };
 intro(document);
 reveal(document);
 document.addEventListener('page:rendered',e=>{if(motionAllowed()){reveal(e.detail);intro(e.detail);}});
 $('#search-open').addEventListener('click',()=>{if(motionAllowed())animate('#search-dialog',{opacity:[.5,1],y:[6,0]},{duration:.25,ease:calm});});
 for(const id of ['accessibility','access-settings-open'])$('#'+id).addEventListener('click',()=>{if(motionAllowed()&&$('#access-dialog').open)animate('#access-dialog',{opacity:[.5,1],y:[6,0]},{duration:.25,ease:calm});});
 $('#menu').addEventListener('click',()=>{if($('#nav').classList.contains('open')&&motionAllowed())animate('#nav a',{opacity:[0,1],x:[-8,0]},{duration:.35,ease:calm,delay:stagger(.03)});});
}
if(window.Motion)startMotion();else $('#motion-js')?.addEventListener('load',startMotion);

// "Open now" badge for the central library (Omsk time). Last working day of the month is a sanitary day.
// The same text, shortened, is the small line of «Спланировать визит» in the service strip.
function updateOpenStatus(){
 const el=$('#open-status'),strip=document.querySelector('[data-open-short]');if(!el&&!strip)return;
 const now=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Omsk',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
 const minutes=+now.hour*60+ +now.minute,schedule=dow=>dow===6?null:dow===0?[600,1020]:[600,1140];
 const isSanitary=dt=>{const y=dt.getUTCFullYear(),m=dt.getUTCMonth();let last=new Date(Date.UTC(y,m+1,0));while(last.getUTCDay()===6)last=new Date(Date.UTC(y,m,last.getUTCDate()-1));return dt.getUTCDate()===last.getUTCDate();};
 const day=offset=>{const dt=new Date(Date.UTC(+now.year,+now.month-1,+now.day+offset)),h=schedule(dt.getUTCDay()),sanitary=!!h&&isSanitary(dt);return{dow:dt.getUTCDay(),h:sanitary?null:h,sanitary};};
 const time=t=>`${String(t/60|0).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;
 const onDay=['в воскресенье','в понедельник','во вторник','в среду','в четверг','в пятницу','в субботу'];
 const today=day(0);let text,short;
 if(today.h&&minutes>=today.h[0]&&minutes<today.h[1])text=short='Открыто до '+time(today.h[1]);
 else if(today.h&&minutes<today.h[0]){text='Сейчас закрыто · откроется сегодня в '+time(today.h[0]);short='Откроется сегодня\u00a0в\u00a0'+time(today.h[0]);}
 else{let n=1,next=day(1);while(!next.h&&n<8)next=day(++n);const when=(n===1?'завтра':onDay[next.dow])+' в '+time(next.h[0]);text=(today.sanitary?'Сегодня санитарный день':'Сейчас закрыто')+' · откроется '+when;short=(today.sanitary?'Санитарный день · откроется ':'Откроется ')+when.replace(/ в (?=\d)/,'\u00a0в\u00a0');}
 const open=text.startsWith('Открыто');
 if(el){el.textContent=text;el.classList.toggle('is-open',open);el.hidden=false;}
 if(strip){strip.textContent=short;strip.classList.toggle('is-open',open);}
}
updateOpenStatus();setInterval(updateOpenStatus,60000);
// Month strip on narrow screens: start from today instead of the 1st.
// Edge fades show only on the side that can still scroll.
function stripEdges(strip){const max=strip.scrollWidth-strip.clientWidth;strip.classList.toggle('can-left',max>1&&strip.scrollLeft>1);strip.classList.toggle('can-right',max>1&&strip.scrollLeft<max-1);}
function centerMonthStrip(scope){const strip=scope.querySelector('.month-strip');if(!strip)return;if(!strip.dataset.edges){strip.dataset.edges='1';strip.addEventListener('scroll',()=>stripEdges(strip),{passive:true});}if(strip.scrollWidth>strip.clientWidth){const day=strip.querySelector('.is-today')||strip.querySelector('.has-event:not(.is-past)');if(day)strip.scrollLeft=day.offsetLeft-strip.offsetLeft-48;}stripEdges(strip);}
document.addEventListener('page:rendered',e=>centerMonthStrip(e.detail));centerMonthStrip(document);
addEventListener('resize',()=>{const strip=document.querySelector('.month-strip');if(strip)stripEdges(strip);},{passive:true});

for(const [slug,key] of Object.entries(internalRoutes))document.querySelectorAll('a[href="'+base+slug+'"]').forEach(a=>{if(!a.closest('#page'))a.href=pathOf(key);});

// Internal links get clean paths: "/?page=" markup, old taralib.ru pages with a counterpart here (libraryRouteMap)
// and files of the old site, which are copied to the same /sites/default/files/… paths of this site.
function rewriteLinks(scope){for(const link of scope.querySelectorAll('a[href]')){const raw=link.getAttribute('href');
 if(/^\/\?(page|article)=/.test(raw)){const c=cleanHref(raw);if(c!==raw)link.setAttribute('href',c);continue;}
 let u;try{u=new URL(raw,location.href);}catch{continue;}
 if(!siteHosts.includes(u.hostname))continue;
 if(u.pathname.startsWith('/sites/default/files/')){link.setAttribute('href',u.pathname+u.search+u.hash);continue;}
 const m=/^\/(?:content\/)?([^/]+)\/?$/.exec(u.pathname);let slug=m?m[1]:'';try{slug=decodeURIComponent(slug);}catch{}
 const key=slug&&window.libraryRouteMap?.[slug];
 // «Оригинал на сайте библиотеки»: the old address of this very page redirects here after the move
 if(link.closest('.source-note')&&key&&libraryPaths[key]&&libraryPaths[key]===currentPath){dropSourceLink(link);continue;}
 if(link.closest('.source-note')||link.closest('.event-poster')||link.matches('[target="_blank"]'))continue;
 // a link to the old copy of this very page stays as it is (it would point to itself)
 if(key&&libraryPaths[key]&&libraryPaths[key]!==currentPath)link.setAttribute('href',libraryPaths[key]+u.hash);}
 markExternal(scope);}
// Removes a link from a source note with the « · » around it; a note left without links and with only a label goes too.
function dropSourceLink(link){const note=link.closest('.source-note');link.remove();
 note.normalize();for(const t of [note.firstChild,note.lastChild])if(t?.nodeType===3)t.textContent=t===note.firstChild?t.textContent.replace(/^[\s·]+/,''):t.textContent.replace(/[\s·]+$/,'');
 for(const t of note.childNodes)if(t.nodeType===3)t.textContent=t.textContent.replace(/\s*·\s*·\s*/g,' · ');
 const text=note.textContent.trim();if(!note.querySelector('a')&&(!text||/:\s*\.?$/.test(text)))note.remove();}
// Links that still lead to taralib.ru or another site get the external icon (the arrow, if any, turns into it) and a hidden note.
// File links say «на taralib.ru» instead; links in imported running text are left as they are.
function markExternal(scope){
 for(const a of scope.querySelectorAll('a[href]')){
  let u;try{u=new URL(a.getAttribute('href'),location.href);}catch{continue;}
  if(!/^https?:$/.test(u.protocol)||a.hasAttribute('data-ext-marked'))continue;
  if(u.origin===location.origin){if(a.classList.contains('doc-link')&&a.dataset.ext&&a.dataset.ext!=='сайт'){a.setAttribute('data-ext-marked','');if(a.hasAttribute('aria-label'))continue;a.insertAdjacentHTML('beforeend',`<span class="link-sr"> · ${a.dataset.ext.toUpperCase()}</span>`);}continue;}
  const onSite=['taralib.ru','www.taralib.ru','tara-lib.ru','www.tara-lib.ru'].includes(u.hostname);
  if(a.classList.contains('doc-link')){const note=onSite?'на taralib.ru':'внешний сайт';a.setAttribute('data-ext-marked','');
   if(a.hasAttribute('aria-label'))a.setAttribute('aria-label',a.getAttribute('aria-label')+', '+note);else a.insertAdjacentHTML('beforeend',`<span class="link-sr"> · ${a.dataset.ext==='сайт'?'':(a.dataset.ext||'').toUpperCase()+', '}${note}</span>`);continue;}
  if(a.closest('.source-content')||a.querySelector('use[href="#i-external"]'))continue;
  a.setAttribute('data-ext-marked','');
  const arrowUse=a.querySelector('use[href="#i-arrow"]');
  if(arrowUse){arrowUse.setAttribute('href','#i-external');arrowUse.parentElement.classList.add('i-ext');}
  else{let t=a.querySelector(':scope>strong,:scope h3,:scope .text-link');if(!t){t=document.createElement('span');t.className='link-label';t.append(...a.childNodes);a.append(t);}
   // the icon sticks to the last word so it never wraps onto a line of its own
   const w=document.createTreeWalker(t,NodeFilter.SHOW_TEXT);let last=null;while(w.nextNode())if(w.currentNode.textContent.trim())last=w.currentNode;
   const tail=document.createElement('span');tail.className='link-tail';
   if(last){const txt=last.textContent.replace(/\s+$/,''),i=txt.search(/\S+$/);tail.textContent=txt.slice(i);last.textContent=txt.slice(0,i);last.after(tail);}else t.append(tail);
   tail.insertAdjacentHTML('beforeend',icon('external','i-ext link-ext'));}
  const host=onSite?'taralib.ru':u.hostname.replace(/^www\./,'');
  if(!a.textContent.toLowerCase().includes(host))a.insertAdjacentHTML('beforeend',`<span class="link-sr"> (${onSite?'откроется сайт taralib.ru':'внешний сайт'})</span>`);
 }
}
rewriteLinks(document);

// Scripts and styles a page needs on top of the shell. The defer attribute matters for prerendered pages: the tag is saved
// into their markup by scripts/build-pages.cjs and then runs after app.js like the others.
function addScript(src){let s=document.querySelector(`script[src="${src}"]`);if(!s){s=document.createElement('script');s.src=src;s.setAttribute('defer','');document.head.append(s);}return s;}
function addStyle(href){if(!document.querySelector(`link[href="${href}"]`)){const l=document.createElement('link');l.rel='stylesheet';l.href=href;document.head.append(l);}}
// The owl guide (assets/mascot/owl.js, a rig with moods) is loaded only where an owl is shown. It keeps still when motion is off.
function loadOwl(){return window.LibraryOwl?Promise.resolve(window.LibraryOwl):new Promise(res=>{const s=addScript('/assets/mascot/owl.js');s.addEventListener('load',()=>res(window.LibraryOwl||null));s.addEventListener('error',()=>res(null));});}
window.libraryLoadOwl=loadOwl;
// Home: the owl in «Услуги читателям» waves and «says» its line, the one by the visit block waves, once each, when seen.
if(isHome&&!redirecting&&'IntersectionObserver' in window){const io=new IntersectionObserver(es=>{for(const e of es){if(!e.isIntersecting)continue;io.unobserve(e.target);const el=e.target;loadOwl().then(O=>O&&O.mount(el).then(()=>{O.mood(el,'wave');if(el.dataset.homeOwl==='say')O.say(el,2600);})).catch(()=>{});}},{threshold:.35});document.querySelectorAll('[data-home-owl]').forEach(el=>io.observe(el));}
// «Детям» (/detyam/…): site/kids.js and kids.css, only on these pages.
if(!redirecting&&/^kids/.test(page||'')){addStyle('/kids.css');addScript('/kids.js');}
// Reader badges: which parts of the site were opened on this device (section names only, no personal data, nothing is sent).
// Read by kids.js on the badges page. Without localStorage nothing is remembered and nothing breaks.
(function noteVisit(){if(redirecting||missingPath)return;const key=article?'article':page||'';if(!key)return;
 const sec=key==='events'||key.startsWith('event-')?'Афиша':key==='news'||key==='article'?'Новости':key.startsWith('kids')?'Детям':sectionGroups.names[groupIndex(archiveSection||key)]||key;
 try{const d=JSON.parse(localStorage.getItem('taralib-badges')||'{}')||{};const v=Array.isArray(d.visits)?d.visits:[];if(!v.includes(sec)){v.push(sec);d.visits=v.slice(-40);localStorage.setItem('taralib-badges',JSON.stringify(d));}}catch{}})();
// Branches page: an empty mount point for the library map (site/map.js, made separately). The map is mounted when its
// script exists; if /map.js is missing the page stays as it is.
function mountLibraryMap(){const el=document.getElementById('library-map');if(!el||el.dataset.mapState)return;el.dataset.mapState='loading';
 const go=()=>{try{if(window.LibraryMap&&typeof window.LibraryMap.mount==='function'){addStyle('/map.css');window.LibraryMap.mount(el,{dataUrl:'/data/karta-bibliotek.json'});el.dataset.mapState='mounted';}else el.dataset.mapState='none';}catch(e){el.dataset.mapState='none';console.warn('Карта библиотек не показана:',e);}};
 if(window.LibraryMap)return go();const s=addScript('/map.js');s.addEventListener('load',go);s.addEventListener('error',()=>{s.remove();el.dataset.mapState='none';});}
if(page==='libraries'&&!redirecting){mountLibraryMap();document.addEventListener('page:rendered',mountLibraryMap);}

