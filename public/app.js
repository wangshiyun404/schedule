(() => {
  const TZ = 'Asia/Shanghai';
  const DAY = 86400000;
  // 数据来源：构建脚本生成的静态快照（GitHub Pages 每 15 分钟更新一次）
  const DATA_URL = (window.__DATA_URL__ || 'data/schedule.json');

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  // ---- 时区工具（全部按北京时间显示） ----
  function parts(d) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' });
    const p = {}; for (const { type, value } of f.formatToParts(d)) p[type] = value;
    return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute, wd: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday] };
  }
  const dayKey = (d) => { const p = parts(d); return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`; };
  const hhmm = (d) => { const p = parts(d); return `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`; };
  const md = (d) => { const p = parts(d); return `${p.m}月${p.d}日`; };
  const mdw = (d) => `${md(d)} ${WEEKDAYS[parts(d).wd]}`;
  function startOfDay(d) { // 北京时间当天 0 点对应的 UTC 时刻
    const p = parts(d); return new Date(Date.UTC(p.y, p.m - 1, p.d) - 8 * 3600000);
  }
  function mondayOf(d) { const p = parts(d); return startOfDay(new Date(d.getTime() - ((p.wd + 6) % 7) * DAY)); }
  const minutesOfDay = (d) => { const p = parts(d); return p.hh * 60 + p.mm; };
  const durText = (ms) => { const m = Math.round(ms / 60000); return m >= 60 ? (m % 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分钟` : `${m / 60} 小时`) : `${m} 分钟`; };

  // ---- 状态 ----
  let data = null;
  let weekStart = mondayOf(new Date());
  let view = 'week'; // week | month | agenda
  let monthStart = null; // 月视图当前月份（北京时间当月 1 日）
  const evById = new Map();
  let demoSeen = false;

  async function load() {
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
    evById.clear(); data.events.forEach(e => evById.set(e.id, e));
    derive();
    render();
  }

  // ---- 在浏览器端计算「现在的状态」和「空闲时段」（静态托管没有后端） ----
  const hm = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
  function derive() {
    const now = new Date();
    const evs = data.events.filter(e => e.status !== 'CANCELLED');
    const current = evs.filter(e => !e.allDay && new Date(e.start) <= now && new Date(e.end) > now);
    const next = evs.find(e => !e.allDay && new Date(e.start) > now) || null;
    const p = parts(now);
    const inOffice = (data.officeHours || []).some(oh => oh.days.includes(p.wd) && hm(oh.start) <= p.hh * 60 + p.mm && p.hh * 60 + p.mm < hm(oh.end));
    data.now = { status: current.length ? 'busy' : (inOffice ? 'free' : 'off'), current, next };
    data.freeSlots = computeFreeSlots(evs, now, 7);
  }
  function computeFreeSlots(evs, now, days) {
    const slots = [];
    const busy = evs.filter(e => !e.allDay).map(e => [new Date(e.start).getTime(), new Date(e.end).getTime()]);
    const minMs = (data.minFreeMinutes || 30) * 60000;
    const nowMs = now.getTime();
    for (let i = 0; i < days; i++) {
      const day = new Date(startOfDay(now).getTime() + i * DAY + 12 * 3600000);
      const p = parts(day);
      const at = (mins) => Date.UTC(p.y, p.m - 1, p.d, 0, mins) - 8 * 3600000; // 北京时间 → UTC 毫秒
      for (const oh of data.officeHours || []) {
        if (!oh.days.includes(p.wd)) continue;
        let cur = at(hm(oh.start)); const end = at(hm(oh.end));
        cur = Math.max(cur, Math.ceil(nowMs / (15 * 60000)) * 15 * 60000);
        const dayBusy = busy.filter(([s, e]) => e > cur && s < end).sort((a, b) => a[0] - b[0]);
        for (const [s, e] of dayBusy) {
          if (s - cur >= minMs) slots.push({ start: new Date(cur).toISOString(), end: new Date(s).toISOString() });
          cur = Math.max(cur, e);
        }
        if (end - cur >= minMs) slots.push({ start: new Date(cur).toISOString(), end: new Date(end).toISOString() });
      }
    }
    return slots;
  }

  function render() {
    renderOwner(); renderStatus(); renderCalendar(); renderCourses(); renderTrips(); renderUpcoming(); renderFindMe(); renderNotice();
    $('updated').textContent = `日历同步于 ${mdw(new Date(data.generatedAt))} ${hhmm(new Date(data.generatedAt))}`;
  }

  function renderOwner() {
    const o = data.owner || {};
    if (o.name) { $('owner-name').textContent = o.name; document.title = `${o.name} · 日程与课程`; }
    $('owner-name-en').textContent = o.nameEn ? `（${o.nameEn}）` : '';
    if (o.title) $('owner-title').textContent = o.title;
    if (o.intro) $('owner-intro').textContent = o.intro;
  }

  function renderStatus() {
    const n = data.now; const dot = $('status-dot'); dot.className = 'dot ' + n.status;
    const kindName = { course: '上课', trip: '出差', event: '忙碌' };
    if (n.status === 'busy') {
      const c = n.current[0];
      $('status-label').textContent = `现在 · ${kindName[c.kind]}中`;
      $('status-detail').textContent = `${c.title}${c.location ? ' · ' + c.location : ''}，预计 ${hhmm(new Date(c.end))} 结束`;
    } else if (n.status === 'free') {
      $('status-label').textContent = '现在 · 有空';
      $('status-detail').textContent = n.next ? `下一项安排：${hhmm(new Date(n.next.start))} ${n.next.title}` : '今天没有更多安排';
    } else {
      $('status-label').textContent = '现在 · 非工作时段';
      $('status-detail').textContent = n.next ? `下一项安排：${mdw(new Date(n.next.start))} ${hhmm(new Date(n.next.start))} ${n.next.title}` : '近期没有安排';
    }
  }

  function eventsInDay(dayStart) {
    const dayEnd = new Date(dayStart.getTime() + DAY);
    return data.events.filter(e => e.status !== 'CANCELLED' && new Date(e.start) < dayEnd && new Date(e.end) > dayStart);
  }
  function officeBlocks(wd) { return (data.officeHours || []).filter(o => o.days.includes(wd)); }
  const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

  function renderWeek() {
    const g = $('week-grid'); g.innerHTML = '';
    const SH = 8, EH = 22; g.style.setProperty('--start-hour', SH); g.style.setProperty('--end-hour', EH);
    const todayKey = dayKey(new Date());
    const weekEnd = new Date(weekStart.getTime() + 6 * DAY);
    g.insertAdjacentHTML('beforeend', '<div class="wg-corner"></div>');
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * DAY); const p = parts(d);
      g.insertAdjacentHTML('beforeend', `<div class="wg-day ${dayKey(d) === todayKey ? 'today' : ''}">${WEEKDAYS[p.wd]}<strong>${p.d}</strong></div>`);
    }
    // 全天事件行
    const allDayByDay = []; let hasAllDay = false;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * DAY);
      const list = eventsInDay(d).filter(e => e.allDay || (new Date(e.end) - new Date(e.start)) >= DAY - 1);
      allDayByDay.push(list); if (list.length) hasAllDay = true;
    }
    if (hasAllDay) {
      g.insertAdjacentHTML('beforeend', '<div class="wg-allday-label">全天</div>');
      let row = '<div class="wg-allday">';
      for (const list of allDayByDay) row += `<div>${list.map(e => `<span class="chip ${e.kind}" data-ev="${esc(e.id)}" tabindex="0">${esc(e.title)}</span>`).join('')}</div>`;
      g.insertAdjacentHTML('beforeend', row + '</div>');
    }
    // 时间轴
    let hours = '<div class="wg-hours">';
    for (let h = SH + 1; h < EH; h++) hours += `<span style="top:${(h - SH) / (EH - SH) * 100}%">${h}:00</span>`;
    g.insertAdjacentHTML('beforeend', hours + '</div>');
    const pct = (min) => Math.min(100, Math.max(0, (min - SH * 60) / ((EH - SH) * 60) * 100));
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * DAY); const p = parts(d);
      const isToday = dayKey(d) === todayKey;
      let col = `<div class="wg-col ${isToday ? 'today' : ''}">`;
      for (const o of officeBlocks(p.wd)) col += `<div class="wg-office" style="top:${pct(toMin(o.start))}%;height:${pct(toMin(o.end)) - pct(toMin(o.start))}%"></div>`;
      const evs = eventsInDay(d).filter(e => !e.allDay && (new Date(e.end) - new Date(e.start)) < DAY - 1);
      // 简单重叠处理：按开始时间排序，重叠的向右缩进
      evs.sort((a, b) => a.start.localeCompare(b.start));
      const lanes = [];
      for (const e of evs) {
        const s = Math.max(minutesOfDay(new Date(Math.max(new Date(e.start), d))), SH * 60);
        const endD = new Date(e.end); const eMin = dayKey(endD) === dayKey(d) ? minutesOfDay(endD) : 24 * 60;
        const en = Math.min(Math.max(eMin, s + 20), EH * 60);
        let lane = lanes.findIndex(l => l <= s); if (lane < 0) { lane = lanes.length; lanes.push(0); } lanes[lane] = en;
        const top = pct(s), h = pct(en) - top;
        const hourPx = Math.min(44, Math.max(28, (window.innerHeight - 480) / 14)); // 与 style.css 中 --hour-h 一致
        const short = (new Date(e.end) - new Date(e.start)) / 3600000 * hourPx < 40;
        col += `<div class="wg-ev ${e.kind}${short ? ' short' : ''}" style="top:${top}%;height:${h}%;left:${3 + lane * 10}px" data-ev="${esc(e.id)}" tabindex="0"><b>${esc(e.title)}</b><small>${short ? hhmm(new Date(e.start)) : hhmm(new Date(e.start)) + '–' + hhmm(new Date(e.end)) + (e.location ? ' · ' + esc(e.location) : '')}</small></div>`;
      }
      if (isToday) { const nm = minutesOfDay(new Date()); if (nm >= SH * 60 && nm <= EH * 60) col += `<div class="wg-now" style="top:${pct(nm)}%"></div>`; }
      g.insertAdjacentHTML('beforeend', col + '</div>');
    }
  }

  // 让卡片网格排得整齐：根据容器宽度选列数，并尽量让每行数量相同
  function evenColumns(el, n, minW) {
    const w = el.clientWidth || el.parentElement.clientWidth || 1100;
    let cols = Math.max(1, Math.min(n, Math.floor((w + 12) / (minW + 12))));
    for (let c = cols; c >= 2; c--) if (n % c === 0) { cols = c; break; }
    if (n % cols !== 0 && cols > 2 && n % (cols - 1) === 0) cols -= 1;
    el.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  }

  // ---- 视图切换：周 / 月 / 日程 ----
  function monthOf(d) { const p = parts(d); return new Date(Date.UTC(p.y, p.m - 1, 1) - 8 * 3600000); }
  function addMonths(d, n) { const p = parts(d); return new Date(Date.UTC(p.y, p.m - 1 + n, 1) - 8 * 3600000); }
  function renderCalendar() {
    const todayKey = dayKey(new Date());
    $('week-grid').hidden = view !== 'week'; $('day-list').hidden = view !== 'week';
    $('month-grid').hidden = view !== 'month'; $('agenda').hidden = view !== 'agenda';
    document.querySelectorAll('.seg-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    if (view === 'week') {
      const weekEnd = new Date(weekStart.getTime() + 6 * DAY);
      const isThis = dayKey(weekStart) === dayKey(mondayOf(new Date()));
      $('cal-title').textContent = isThis ? '本周安排' : '周安排';
      $('week-range').textContent = `${md(weekStart)} – ${md(weekEnd)}`;
      $('today-week').textContent = '本周';
      renderWeek(); renderDayList();
    } else if (view === 'month') {
      const m0 = monthStart || (monthStart = monthOf(new Date(weekStart.getTime() + 3 * DAY))); const p = parts(m0);
      $('cal-title').textContent = p.m === parts(new Date()).m && p.y === parts(new Date()).y ? '本月概览' : '月概览';
      $('week-range').textContent = `${p.y}年${p.m}月`;
      $('today-week').textContent = '本月';
      renderMonth(m0);
    } else {
      const end = new Date(weekStart.getTime() + 28 * DAY - 1);
      $('cal-title').textContent = '日程列表';
      $('week-range').textContent = `${md(weekStart)} – ${md(end)} · 四周`;
      $('today-week').textContent = '从本周起';
      renderAgenda();
    }
    void todayKey;
  }

  function renderMonth(m0) {
    const g = $('month-grid'); g.innerHTML = '';
    const pm = parts(m0);
    const gridStart = mondayOf(m0);
    const nextMonth = addMonths(m0, 1);
    const rows = Math.ceil((nextMonth.getTime() - gridStart.getTime()) / DAY / 7);
    g.style.setProperty('--rows', rows);
    const todayKey = dayKey(new Date());
    let html = WEEKDAYS.slice(1).concat(WEEKDAYS[0]).map(w => `<div class="mg-head">${w}</div>`).join('');
    // 根据单元格实际高度决定能放几条，放不下的折叠为「还有 N 项」
    const hourPx = Math.min(44, Math.max(28, (window.innerHeight - 480) / 14));
    const cellH = window.innerWidth <= 860 ? 64 : (hourPx * 14 + 56 - 26) / rows;
    const chipH = 19, dateH = 22;
    const fit = Math.max(1, Math.floor((cellH - dateH - 4) / chipH));
    for (let i = 0; i < rows * 7; i++) {
      const d = new Date(gridStart.getTime() + i * DAY); const p = parts(d);
      const evs = eventsInDay(d).sort((a, b) => (a.allDay === b.allDay ? a.start.localeCompare(b.start) : a.allDay ? -1 : 1));
      const other = p.m !== pm.m;
      const isToday = dayKey(d) === todayKey;
      let cell = `<div class="mg-cell ${other ? 'other' : ''} ${isToday ? 'today' : ''}" data-day="${d.toISOString()}" role="button" tabindex="0" aria-label="${mdw(d)}，${evs.length} 项安排">`;
      cell += `<div class="mg-date"><span>${p.d === 1 ? `${p.m}月` : ''}${p.d}</span>${evs.length ? `<i>${evs.length}</i>` : ''}</div>`;
      const show = evs.length > fit ? Math.max(0, fit - 1) : evs.length;
      for (const e of evs.slice(0, show)) cell += `<div class="mg-ev ${e.kind}" data-ev="${esc(e.id)}"><span class="t">${e.allDay ? '全天' : hhmm(new Date(e.start))}</span><span class="n">${esc(e.title)}</span></div>`;
      if (evs.length > show) cell += `<div class="mg-more">还有 ${evs.length - show} 项 →</div>`;
      html += cell + '</div>';
    }
    g.innerHTML = html;
  }

  function renderAgenda() {
    const el = $('agenda'); el.innerHTML = '';
    const todayKey = dayKey(new Date());
    let html = ''; let any = false;
    for (let i = 0; i < 28; i++) {
      const d = new Date(weekStart.getTime() + i * DAY);
      const evs = eventsInDay(d).filter(e => dayKey(new Date(e.start)) === dayKey(d) || e.allDay).sort((a, b) => a.start.localeCompare(b.start));
      if (!evs.length) continue; any = true;
      const isToday = dayKey(d) === todayKey;
      html += `<div class="ag-day ${isToday ? 'today' : ''}"><div class="ag-date"><strong>${parts(d).d}</strong><span>${parts(d).m}月 · ${WEEKDAYS[parts(d).wd]}${isToday ? ' · 今天' : ''}</span></div><ul>`;
      for (const e of evs) html += `<li class="${e.kind}" data-ev="${esc(e.id)}"><time>${e.allDay ? '全天' : hhmm(new Date(e.start)) + '–' + hhmm(new Date(e.end))}</time><div><div class="ttl">${esc(e.title)}</div>${e.location ? `<div class="sub">${esc(e.location)}</div>` : ''}</div></li>`;
      html += '</ul></div>';
    }
    el.innerHTML = any ? html : '<div class="card empty">这四周没有安排</div>';
  }

  // ---- 悬停 / 点按提示：显示完整信息 ----
  const tip = $('tip'); let pinned = null;
  const kindName = { course: '课程', trip: '行程 / 出差', event: '安排' };
  function tipHtml(e) {
    const s = new Date(e.start), en = new Date(e.end);
    const sameDay = dayKey(s) === dayKey(new Date(en.getTime() - 1));
    const when = e.allDay ? (sameDay ? `${mdw(s)} · 全天` : `${md(s)} – ${md(new Date(en.getTime() - 1))} · 全天`)
      : (sameDay ? `${mdw(s)} ${hhmm(s)} – ${hhmm(en)}（${durText(en - s)}）` : `${mdw(s)} ${hhmm(s)} → ${mdw(en)} ${hhmm(en)}`);
    return `<span class="tip-kind ${e.kind}">${kindName[e.kind] || '安排'}</span><div class="tip-title">${esc(e.title)}</div><div class="tip-when">${when}</div>${e.location ? `<div class="tip-loc">${esc(e.location)}</div>` : ''}${e.description ? `<div class="tip-desc">${esc(e.description)}</div>` : ''}`;
  }
  function showTip(target) {
    const e = evById.get(target.dataset.ev); if (!e) return;
    tip.innerHTML = tipHtml(e); tip.hidden = false;
    const r = target.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight, pad = 10;
    let x = r.left + r.width / 2 - tw / 2; x = Math.max(pad, Math.min(x, window.innerWidth - tw - pad));
    let y = r.top - th - 8; if (y < pad) y = r.bottom + 8; if (y + th > window.innerHeight - pad) y = Math.max(pad, window.innerHeight - th - pad);
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  }
  function hideTip() { if (pinned) return; tip.hidden = true; }
  document.addEventListener('mouseover', (ev) => { const t = ev.target.closest('[data-ev]'); if (t && !pinned) showTip(t); });
  document.addEventListener('mouseout', (ev) => { const t = ev.target.closest('[data-ev]'); if (t && !pinned) hideTip(); });
  document.addEventListener('focusin', (ev) => { const t = ev.target.closest('[data-ev]'); if (t) showTip(t); });
  document.addEventListener('focusout', hideTip);
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-ev]');
    if (t) { ev.stopPropagation(); if (pinned === t) { pinned = null; tip.hidden = true; } else { pinned = t; showTip(t); } return; }
    if (!ev.target.closest('#tip')) { pinned = null; tip.hidden = true; }
    const cell = ev.target.closest('.mg-cell');
    if (cell) { weekStart = mondayOf(new Date(cell.dataset.day)); view = 'week'; renderCalendar(); $('cal').scrollIntoView({ block: 'nearest' }); }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') { pinned = null; tip.hidden = true; } if (ev.key === 'Enter' && ev.target.classList && ev.target.classList.contains('mg-cell')) ev.target.click(); });
  window.addEventListener('scroll', () => { if (!pinned) tip.hidden = true; }, { passive: true });

  function renderDayList() {
    const el = $('day-list'); el.innerHTML = '';
    const todayKey = dayKey(new Date());
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * DAY);
      const evs = eventsInDay(d);
      let html = `<div class="day ${dayKey(d) === todayKey ? 'today' : ''}"><h3>${mdw(d)}${dayKey(d) === todayKey ? ' · 今天' : ''}</h3>`;
      if (!evs.length) html += '<p class="empty">无安排</p>';
      for (const e of evs) html += `<div class="row"><time>${e.allDay ? '全天' : hhmm(new Date(e.start)) + '–' + hhmm(new Date(e.end))}</time><div><span class="chip ${e.kind}" data-ev="${esc(e.id)}">${esc(e.title)}</span>${e.location ? `<div class="muted" style="font-size:var(--text-xs)">${esc(e.location)}</div>` : ''}</div></div>`;
      el.insertAdjacentHTML('beforeend', html + '</div>');
    }
  }

  function renderCourses() {
    const el = $('course-list'); el.innerHTML = '';
    // 以本周起 4 周内出现的课程为“本学期课程”，按课程名归并；每门课列出每周的上课时段
    const from = mondayOf(new Date()), to = new Date(from.getTime() + 28 * DAY);
    const map = new Map();
    for (const e of data.events) {
      if (e.kind !== 'course' || e.allDay || e.status === 'CANCELLED') continue;
      const s = new Date(e.start), en = new Date(e.end);
      const c = map.get(e.title) || { title: e.title, sessions: new Map(), locations: new Set(), count: 0, last: s, sort: Infinity };
      c.count++; if (s > c.last) c.last = s;
      if (s >= from && s < to) {
        const wd = parts(s).wd, key = `${wd}|${hhmm(s)}|${hhmm(en)}`;
        c.sessions.set(key, { wd, t: `${hhmm(s)}–${hhmm(en)}`, sort: ((wd + 6) % 7) * 1440 + minutesOfDay(s) });
        c.inWindow = true;
      }
      if (e.location) c.locations.add(e.location);
      map.set(e.title, c);
    }
    const rows = [...map.values()].filter(c => c.inWindow && c.count >= 2).map(c => {
      const ss = [...c.sessions.values()].sort((x, y) => x.sort - y.sort);
      return { ...c, ss, sort: ss.length ? ss[0].sort : Infinity };
    }).sort((a, b) => a.sort - b.sort);
    $('course-sub').textContent = rows.length ? `${rows.length} 门 · 按每周上课时间排列` : '';
    if (!rows.length) { el.style.gridTemplateColumns = ''; el.innerHTML = '<div class="card empty">未来四周没有课程安排</div>'; return; }
    evenColumns(el, rows.length, 230);
    for (const c of rows) {
      const sessions = c.ss.map(x => `<tr><th>${WEEKDAYS[x.wd]}</th><td>${x.t}</td></tr>`).join('');
      const loc = [...c.locations].join(' / ');
      el.insertAdjacentHTML('beforeend', `<article class="card course-card">
        <h3>${esc(c.title)}</h3>
        <table class="sessions">${sessions}</table>
        ${loc ? `<p class="loc">${esc(loc)}</p>` : ''}
        <p class="meta">共 ${c.count} 次 · 至 ${md(c.last)}</p>
      </article>`);
    }
  }

  function renderTrips() {
    const el = $('trip-list'); el.innerHTML = '';
    const now = new Date();
    // 相同标题的连续日期合并
    const trips = data.events.filter(e => e.kind === 'trip' && e.status !== 'CANCELLED' && new Date(e.end) > now).sort((a, b) => a.start.localeCompare(b.start));
    const merged = [];
    for (const e of trips) {
      const last = merged[merged.length - 1];
      if (last && last.title === e.title && new Date(e.start) - new Date(last.end) <= DAY) last.end = e.end; else merged.push({ ...e });
    }
    document.body.classList.toggle('no-trips', merged.length === 0);
    // 没有行程时整块收起，把位置让给「接下来」，只在其副标题处注明
    $('trips').hidden = merged.length === 0;
    $('upcoming-sub').textContent = merged.length ? '未来几天的安排' : '近期没有出差或外出行程 · 以下是未来几天的安排';
    if (!merged.length) { el.innerHTML = ''; return 0; }
    for (const t of merged.slice(0, 8)) {
      const s = new Date(t.start), e = new Date(t.end);
      const sameDay = dayKey(s) === dayKey(new Date(e.getTime() - 1));
      const when = sameDay ? (t.allDay ? mdw(s) : `${mdw(s)} ${hhmm(s)}–${hhmm(e)}`) : `${md(s)} – ${md(new Date(e.getTime() - 1))}`;
      el.insertAdjacentHTML('beforeend', `<article class="card trip-card"><h3>${esc(t.title)}</h3><p class="when">${when}</p>${t.location ? `<p class="loc">${esc(t.location)}</p>` : ''}</article>`);
    }
    return merged.length;
  }

  function renderUpcoming() {
    const el = $('upcoming-list'); el.innerHTML = '';
    const now = new Date();
    // 没有行程时，“接下来”多显示几天，填满这一屏
    const noTrips = document.body.classList.contains('no-trips');
    const maxDays = 4, maxItems = noTrips ? 4 : 3;
    const list = data.events.filter(e => e.status !== 'CANCELLED' && new Date(e.end) > now);
    const days = new Map();
    for (const e of list) {
      const k = dayKey(new Date(e.start));
      if (!days.has(k)) { if (days.size >= maxDays) break; days.set(k, []); }
      days.get(k).push(e);
    }
    if (!days.size) { el.style.gridTemplateColumns = ''; el.innerHTML = '<div class="card empty">暂无安排</div>'; return; }
    evenColumns(el, days.size, 250);
    for (const [k, evs] of days) {
      const d = new Date(evs[0].start);
      const extra = evs.length - maxItems;
      const items = evs.slice(0, maxItems).map(e => `<li class="${e.kind}"><time>${e.allDay ? '全天' : hhmm(new Date(e.start)) + '–' + hhmm(new Date(e.end))}</time><div><div class="ttl">${esc(e.title)}</div>${e.location ? `<div class="sub">${esc(e.location)}</div>` : ''}</div></li>`).join('');
      el.insertAdjacentHTML('beforeend', `<article class="card up-day"><h3>${k === dayKey(now) ? '今天 · ' : ''}${mdw(d)}</h3><ul>${items}</ul>${extra > 0 ? `<p class="meta">还有 ${extra} 项，见本周安排</p>` : ''}</article>`);
    }
  }

  function renderFindMe() {
    const oh = data.officeHours || [];
    const dayNames = (days) => { const s = [...days].sort(); return (s.join() === '1,2,3,4,5') ? '周一至周五' : s.map(d => WEEKDAYS[d]).join('、'); };
    $('office-hours-text').textContent = oh.length
      ? `可预约时间：${oh.map(o => `${dayNames(o.days)} ${o.start}–${o.end}`).join('；')}。下面是未来 7 天内尚未被占用的时段，选一个给我发邮件即可。`
      : '欢迎通过邮件联系我。';
    const el = $('slots'); el.innerHTML = '';
    const o = data.owner || {};
    const slots = (data.freeSlots || []).slice(0, 8);
    if (!slots.length) el.innerHTML = '<div class="slot empty">未来 7 天的可预约时段已排满，欢迎邮件联系。</div>';
    for (const s of slots) {
      const a = new Date(s.start), b = new Date(s.end);
      const subject = encodeURIComponent(`预约：${mdw(a)} ${hhmm(a)}–${hhmm(b)}`);
      const body = encodeURIComponent(`${o.name || ''}老师您好，\n\n我想在 ${mdw(a)} ${hhmm(a)}–${hhmm(b)} 之间找您，主题是：\n\n（请填写）\n\n谢谢！`);
      const mail = o.email ? `<a href="mailto:${esc(o.email)}?subject=${subject}&body=${body}">发邮件预约这个时段 →</a>` : '';
      el.insertAdjacentHTML('beforeend', `<div class="slot"><span class="d">${mdw(a)}${dayKey(a) === dayKey(new Date()) ? ' · 今天' : ''}</span><span class="t">${hhmm(a)} – ${hhmm(b)}</span><span class="len">空闲 ${durText(b - a)}</span>${mail}</div>`);
    }
    const c = $('contact'); c.innerHTML = '';
    if (o.email) c.insertAdjacentHTML('beforeend', `<a class="btn" href="mailto:${esc(o.email)}">发邮件 ${esc(o.email)}</a>`);
    if (o.wechat) c.insertAdjacentHTML('beforeend', `<span class="btn secondary">微信：${esc(o.wechat)}</span>`);
    if (o.location) c.insertAdjacentHTML('beforeend', `<span class="hint">办公地点：${esc(o.location)}</span>`);
  }

  function renderNotice() {
    const n = $('notice');
    if (data.demo) { n.hidden = false; n.className = 'notice info'; n.textContent = '当前显示的是演示数据。接入你的 iCloud 公共日历链接后，这里会自动替换为真实日程。'; return; }
    const bad = (data.sources || []).filter(s => !s.ok);
    if (bad.length) { n.hidden = false; n.className = 'notice'; n.textContent = `有 ${bad.length} 个日历暂时无法同步（${bad.map(b => b.name).join('、')}），显示的是上次成功读取的内容。`; return; }
    n.hidden = true;
  }

  // ---- 交互 ----
  const step = (dir) => {
    if (view === 'week') weekStart = new Date(weekStart.getTime() + dir * 7 * DAY);
    else if (view === 'month') monthStart = addMonths(monthStart || monthOf(weekStart), dir);
    else weekStart = new Date(weekStart.getTime() + dir * 28 * DAY);
    renderCalendar();
  };
  $('prev-week').onclick = () => step(-1);
  $('next-week').onclick = () => step(1);
  $('today-week').onclick = () => { weekStart = mondayOf(new Date()); monthStart = monthOf(new Date()); renderCalendar(); };
  document.querySelectorAll('.seg-btn').forEach(b => b.onclick = () => {
    const nv = b.dataset.view; if (nv === view) return;
    if (nv === 'month') monthStart = monthOf(new Date(weekStart.getTime() + 3 * DAY));
    if (view === 'month') { // 离开月视图：当前月→回到本周，其他月→该月第一周
      const m0 = monthStart, pn = parts(new Date()), pm = parts(m0);
      weekStart = (pm.m === pn.m && pm.y === pn.y) ? mondayOf(new Date()) : mondayOf(new Date(m0.getTime() + 6 * DAY));
    }
    view = nv; renderCalendar();
  });
  function showErr(e) { const n = $('notice'); n.hidden = false; n.className = 'notice'; n.textContent = `日历读取失败：${e.message}。请稍后刷新。`; }

  let rsz; window.addEventListener('resize', () => { clearTimeout(rsz); rsz = setTimeout(() => { if (data) render(); }, 150); });
  setInterval(() => { $('clock').textContent = hhmm(new Date()); }, 1000);
  $('clock').textContent = hhmm(new Date());
  load().catch(showErr);
  setInterval(() => { if (data) { derive(); renderStatus(); renderFindMe(); } }, 60000);
  setInterval(() => load().catch(showErr), 5 * 60000);
})();
