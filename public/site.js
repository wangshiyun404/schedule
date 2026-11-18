/* 站点通用脚本：导航高亮、首页今日概览、研究页、教学页（内容来自 content.js，日程来自 data/schedule.json） */
(() => {
  const S = window.SITE || {};
  const TZ = 'Asia/Shanghai', DAY = 86400000;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  function parts(d) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' });
    const p = {}; for (const { type, value } of f.formatToParts(d)) p[type] = value;
    return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute, wd: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday] };
  }
  const hhmm = (d) => { const p = parts(d); return `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`; };
  const md = (d) => { const p = parts(d); return `${p.m}月${p.d}日`; };
  const startOfDay = (d) => { const p = parts(d); return new Date(Date.UTC(p.y, p.m - 1, p.d) - 8 * 3600000); };
  const mondayOf = (d) => startOfDay(new Date(d.getTime() - ((parts(d).wd + 6) % 7) * DAY));
  const hm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  const minutesOfDay = (d) => { const p = parts(d); return p.hh * 60 + p.mm; };

  // ---- 导航高亮 ----
  const here = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navlinks a').forEach(a => { const h = a.getAttribute('href') || ''; if (!h.includes('#') && h === here) a.classList.add('active'); });

  // ---- 通用：填充 data-site 字段 ----
  const o = S.owner || {};
  document.querySelectorAll('[data-site]').forEach(el => {
    const v = o[el.dataset.site]; if (v == null) return;
    if (el.dataset.site === 'email') { el.textContent = v; if (el.tagName === 'A') el.href = `mailto:${v}`; }
    else el.textContent = v;
  });
  const yEl = $('year'); if (yEl) yEl.textContent = new Date().getFullYear();

  // ---- 日程数据 ----
  let schedule = null;
  async function loadSchedule() {
    try {
      const r = await fetch(`data/schedule.json?t=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(r.status);
      schedule = await r.json();
      if (window.CalendarModel) schedule.events = window.CalendarModel.normalize(schedule.events);
    } catch (e) { schedule = null; }
    return schedule;
  }

  // ---- 首页 ----
  async function renderHome() {
    const about = $('about'); if (about) about.innerHTML = (o.about || []).map(p => `<p>${esc(p)}</p>`).join('');
    const tags = $('area-tags'); if (tags) tags.innerHTML = (S.researchAreas || []).map(a => `<li>${esc(a.name)}</li>`).join('');
    const areas = $('home-areas'); if (areas) areas.innerHTML = (S.researchAreas || []).map(a => `<a class="tile link" href="research.html"><h3>${esc(a.name)}</h3><span class="en">${esc(a.en || '')}</span><p>${esc(a.desc)}</p></a>`).join('');
    const projs = $('home-projects'); if (projs) projs.innerHTML = (S.projects || []).filter(p => p.status !== '已完成').slice(0, 3).map(projTile).join('');
    const entry = (x) => `<a class="tile link entry" href="${esc(x.url)}" target="_blank" rel="noopener"><h3>${esc(x.title)}</h3><p>${esc(x.desc)}</p><span class="arrow">打开 →</span></a>`;
    const ce = $('entry-courses'); if (ce) ce.innerHTML = (S.courseEntries || []).map(g => `<h3 class="entry-group">${esc(g.group)}</h3><div class="grid grid-3">${g.items.map(entry).join('')}</div>`).join('');
    const we = $('entry-works'); if (we) we.innerHTML = (S.aiWorks || []).map(entry).join('');
    await loadSchedule();
    renderToday();
    const hc = $('home-courses'); if (hc) hc.innerHTML = currentCourses().slice(0, 4).map(c => `<a class="tile link" href="teaching.html"><h3>${esc(c.title)}</h3><p>${c.ss.map(x => `${WEEKDAYS[x.wd]} ${x.t}`).join(' · ') || '本学期'}</p></a>`).join('') || '<div class="tile"><p>课程信息同步中…</p></div>';
    setInterval(renderToday, 60000);
    setInterval(async () => { await loadSchedule(); renderToday(); }, 300000);
  }

  function publicationState(snapshot) {
    const sources = snapshot.sources || [];
    const failed = sources.filter(s => s.state === 'failed' || s.ok === false);
    const dataAsOf = snapshot.dataAsOf || snapshot.generatedAt;
    let status = snapshot.status;
    if (!status) {
      if (snapshot.demo) status = 'demo';
      else if (failed.length) status = 'failed';
      else if (sources.length && sources.every(s => s.state === 'empty') && !(snapshot.events || []).length) status = 'empty';
      else status = 'ok';
    }
    return { status, failed, dataAsOf };
  }

  function renderToday() {
    const el = $('today-card'); if (!el) return;
    const now = new Date();
    if (!schedule) { $('today-label').textContent = '日程暂时无法读取'; $('today-detail').textContent = '这次没有读到课表，不代表当天没有安排。'; return; }
    const sync = publicationState(schedule);
    const stamp = sync.dataAsOf ? `数据时间 ${md(new Date(sync.dataAsOf))} ${hhmm(new Date(sync.dataAsOf))}` : '';
    const evs = schedule.events.filter(e => e.status !== 'CANCELLED');
    const current = evs.find(e => !e.allDay && !(window.CalendarModel && window.CalendarModel.departureOnly(e)) && new Date(e.start) <= now && new Date(e.end) > now);
    const next = evs.find(e => !e.allDay && new Date(e.start) > now);
    const p = parts(now);
    const inOffice = (schedule.officeHours || []).some(oh => oh.days.includes(p.wd) && hm(oh.start) <= p.hh * 60 + p.mm && p.hh * 60 + p.mm < hm(oh.end));
    const dot = $('today-dot'), lab = $('today-label'), det = $('today-detail');
    if (sync.status === 'retained') {
      dot.className = 'dot';
      lab.textContent = '显示较早的课表';
      det.textContent = `不是刚刚同步的结果。${stamp}`;
    } else if (sync.status === 'failed') {
      dot.className = 'dot';
      lab.textContent = '日历抓取失败';
      det.textContent = `${sync.failed.map(s => s.name).join('、') || '日历'}没有读到。空列表不代表当天没有课程或安排。${stamp}`;
    } else if (sync.status === 'empty') {
      dot.className = 'dot';
      lab.textContent = '日历已读取';
      det.textContent = `当前没有公开事项。${stamp}`;
    } else {
      dot.className = 'dot ' + (current ? 'busy' : inOffice ? 'free' : '');
      lab.textContent = current ? `忙碌中：${current.title}` : inOffice ? '现在有空' : '非办公时间';
      det.textContent = (current ? `到 ${hhmm(new Date(current.end))} 结束${current.location ? ' · ' + current.location : ''}`
        : next ? `下一项：${md(new Date(next.start))} ${hhmm(new Date(next.start))} ${next.title}` : '近期没有已排定的安排') + (stamp ? ` · ${stamp}` : '');
    }
    // 今日 / 明日列表
    const d0 = startOfDay(now), d1 = new Date(d0.getTime() + DAY), d2 = new Date(d1.getTime() + DAY);
    const inDay = (a, b) => evs.filter(e => new Date(e.start) < b && new Date(e.end) > a).sort((x, y) => new Date(x.start) - new Date(y.start));
    const DONE_KEY = 'homeTodoDone.v1';
    let done = {}; try { done = JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (_) { done = {}; }
    const keyOf = (e, day) => `${md(day)}|${e.uid || e.id || e.title}|${e.start}`;
    const li = (e, day) => {
      const start = new Date(e.start), end = new Date(e.end), nextDay = new Date(day.getTime() + DAY);
      const label = window.CalendarModel ? window.CalendarModel.dayTime(e, day) : e.allDay ? '全天' : `${start < day ? '00:00' : hhmm(start)}–${end >= nextDay ? '24:00' : hhmm(end)}${start < day || end > nextDay ? ' · 跨日' : ''}`;
      const k = keyOf(e, day), isDone = !!done[k];
      return `<li class="todo${isDone ? ' done' : ''}"><label><input type="checkbox" data-k="${esc(k)}"${isDone ? ' checked' : ''}><time>${label}</time><span class="n">${esc(e.title)}${e.location ? `<small>${esc(e.location)}</small>` : ''}</span></label></li>`;
    };
    const emptyToday = sync.status === 'failed' ? '这次没有读到今天的安排' : sync.status === 'empty' ? '今天没有公开事项' : '今天没有已排定的安排';
    const emptyTomorrow = sync.status === 'failed' ? '这次没有读到明天的安排' : sync.status === 'empty' ? '明天没有公开事项' : '明天暂无安排';
    const group = (list, day, emptyText) => {
      if (!list.length) return `<li><span class="empty">${emptyText}</span></li>`;
      const items = list.map(e => ({ e, d: !!done[keyOf(e, day)] }));
      const todo = items.filter(x => !x.d), fin = items.filter(x => x.d);
      return `<li class="grp">待办 · ${todo.length}</li>` + (todo.map(x => li(x.e, day)).join('') || '<li><span class="empty">全部完成</span></li>')
        + (fin.length ? `<li class="grp">已办 · ${fin.length}</li>` + fin.map(x => li(x.e, day)).join('') : '');
    };
    const today = inDay(d0, d1), tomorrow = inDay(d1, d2);
    $('today-list').innerHTML = group(today, d0, emptyToday);
    $('tomorrow-list').innerHTML = group(tomorrow, d1, emptyTomorrow);
    if (!el.dataset.todoBound) {
      el.dataset.todoBound = '1';
      el.addEventListener('change', (ev) => {
        const cb = ev.target; if (!cb.matches('input[type=checkbox][data-k]')) return;
        let d = {}; try { d = JSON.parse(localStorage.getItem(DONE_KEY) || '{}'); } catch (_) {}
        if (cb.checked) d[cb.dataset.k] = Date.now(); else delete d[cb.dataset.k];
        // 只保留近 30 天的勾选记录
        for (const [k, t] of Object.entries(d)) if (Date.now() - t > 30 * DAY) delete d[k];
        localStorage.setItem(DONE_KEY, JSON.stringify(d));
        renderToday();
      });
    }
    $('today-h').textContent = `今天 · ${md(now)} ${WEEKDAYS[p.wd]}`;
    $('tomorrow-h').textContent = `明天 · ${md(d1)} ${WEEKDAYS[parts(new Date(d1.getTime() + 3600000)).wd]}`;
  }

  // 本学期课程（与日程页同一规则：未来四周出现、且总次数≥2 的课程）
  function currentCourses() {
    if (!schedule) return [];
    const from = mondayOf(new Date()), to = new Date(from.getTime() + 28 * DAY), map = new Map();
    for (const e of schedule.events) {
      if (e.kind !== 'course' || e.allDay || e.status === 'CANCELLED' || /组会|复习课/.test(e.title || '')) continue;
      const s = new Date(e.start), en = new Date(e.end);
      const c = map.get(e.title) || { title: e.title, sessions: new Map(), locations: new Set(), count: 0, last: s };
      c.count++; if (s > c.last) c.last = s;
      if (s >= from && s < to) { const wd = parts(s).wd; c.sessions.set(`${wd}|${hhmm(s)}`, { wd, t: `${hhmm(s)}–${hhmm(en)}`, sort: ((wd + 6) % 7) * 1440 + minutesOfDay(s) }); c.inWindow = true; }
      if (e.location) c.locations.add(e.location);
      map.set(e.title, c);
    }
    const __r = [...map.values()].filter(c => c.inWindow && c.count >= 2).map(c => ({ ...c, ss: [...c.sessions.values()].sort((a, b) => a.sort - b.sort) }))
      .sort((a, b) => (a.ss[0]?.sort ?? 1e9) - (b.ss[0]?.sort ?? 1e9));
    return __r.sort((a, b) => (/智慧格致/.test(b.title) ? 1 : 0) - (/智慧格致/.test(a.title) ? 1 : 0));
  }

  // ---- 研究页 ----
  function projTile(p) {
    const cls = p.status === '进行中' ? 'ongoing' : p.status === '已完成' ? 'done' : 'planned';
    return `<article class="tile proj"><div class="top"><span class="period">${esc(p.period || '')}</span><span class="pill ${cls}">${esc(p.status || '')}</span></div>
      <h3>${esc(p.title)}</h3><p>${esc(p.summary || '')}</p>
      ${p.tags?.length ? `<ul class="tags">${p.tags.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}</article>`;
  }
  function renderResearch() {
    const areas = $('areas'); if (areas) areas.innerHTML = (S.researchAreas || []).map(a => `<article class="tile"><h3>${esc(a.name)}</h3><span class="en">${esc(a.en || '')}</span><p>${esc(a.desc)}</p></article>`).join('');
    const pr = $('projects'); if (pr) pr.innerHTML = (S.projects || []).map(projTile).join('');
    const pubs = $('pubs'); if (pubs) {
      const list = (S.publications || []).slice().sort((a, b) => (b.year || 0) - (a.year || 0));
      pubs.innerHTML = list.length ? list.map(p => `<li><span class="y">${esc(p.year || '')}</span><span><span class="t">${p.url ? `<a href="${esc(p.url)}">${esc(p.title)}</a>` : esc(p.title)}</span><br><span class="v">${esc([p.authors, p.venue, p.note].filter(Boolean).join(' · '))}</span></span></li>`).join('')
        : `<li><span class="y">—</span><span class="v">论文与成果列表整理中。如需了解相关研究，欢迎邮件联系 <a href="mailto:${esc(o.email || '')}">${esc(o.email || '')}</a>。</span></li>`;
    }
  }

  // ---- 教学页 ----
  async function renderTeaching() {
    await loadSchedule();
    const live = currentCourses();
    const meta = new Map((S.courses || []).map(c => [c.title, c]));
    const cur = $('courses-now'), past = $('courses-past');
    const tile = (title, m, lv, isPast) => `<article class="tile course-tile${isPast ? ' past' : ''}">
      <h3>${esc(title)}</h3>${m?.en ? `<span class="en">${esc(m.en)}</span>` : ''}
      ${m?.audience ? `<span class="aud">${esc(m.audience)}</span>` : ''}
      ${lv?.ss?.length ? `<table class="when">${lv.ss.map(x => `<tr><th>${WEEKDAYS[x.wd]}</th><td>${x.t}</td></tr>`).join('')}</table>` : ''}
      ${m?.desc ? `<p>${esc(m.desc)}</p>` : ''}
      ${m?.links?.length ? `<ul class="course-links">${m.links.map(l => `<li><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a>${l.desc ? `<small>${esc(l.desc)}</small>` : ''}</li>`).join('')}</ul>` : ''}
      ${lv ? `<span class="loc">${esc([...lv.locations].join(' / '))}${lv.locations.size ? ' · ' : ''}共 ${lv.count} 次 · 至 ${md(lv.last)}</span>` : ''}
    </article>`;
    const seen = new Set();
    const nowHtml = live.map(c => { seen.add(c.title); return tile(c.title, meta.get(c.title), c, false); });
    // 内容文件里标注为本学期、但日历尚未出现的课程
    for (const c of S.courses || []) if (!seen.has(c.title) && !c.past) { seen.add(c.title); nowHtml.push(tile(c.title, c, null, false)); }
    cur.innerHTML = nowHtml.join('') || '<div class="tile"><p>课程信息同步中…</p></div>';
    const pastHtml = (S.courses || []).filter(c => c.past).map(c => tile(c.title, c, null, true));
    if (past) { past.innerHTML = pastHtml.join(''); past.closest('.block').hidden = !pastHtml.length; }
    const sub = $('courses-sub');
    if (sub) {
      const sync = schedule ? publicationState(schedule) : null;
      sub.textContent = !schedule ? '日历暂时无法读取'
        : sync.status === 'failed' ? '日历抓取失败，上课时间未更新'
        : sync.status === 'retained' ? '上课时间来自较早的课表，不是刚刚同步'
        : sync.status === 'empty' ? '日历已读取，当前没有课程事项'
        : live.length ? `${live.length} 门 · 上课时间同步自日历` : '';
    }
  }

  const page = document.body.dataset.page;
  if (page === 'home') renderHome();
  if (page === 'research') renderResearch();
  if (page === 'teaching') renderTeaching();
})();
