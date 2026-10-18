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
  let demoSeen = false;

  async function load() {
    const res = await fetch(`${DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
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
    renderOwner(); renderStatus(); renderWeek(); renderDayList(); renderCourses(); renderTrips(); renderUpcoming(); renderFindMe(); renderNotice();
    $('updated').textContent = `日历同步于 ${mdw(new Date(data.generatedAt))} ${hhmm(new Date(data.generatedAt))}`;
  }

  function renderOwner() {
    const o = data.owner || {};
    if (o.name) { $('owner-name').textContent = o.name; document.title = `${o.name} · 日程与课程`; }
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
    $('week-range').textContent = `${md(weekStart)} – ${md(weekEnd)}`;

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
      for (const list of allDayByDay) row += `<div>${list.map(e => `<span class="chip ${e.kind}" title="${esc(e.title)}">${esc(e.title)}</span>`).join('')}</div>`;
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
        const short = (new Date(e.end) - new Date(e.start)) < 45 * 60000;
        col += `<div class="wg-ev ${e.kind}${short ? ' short' : ''}" style="top:${top}%;height:${h}%;left:${3 + lane * 10}px" title="${esc(e.title)} ${hhmm(new Date(e.start))}–${hhmm(new Date(e.end))}${e.location ? ' · ' + esc(e.location) : ''}"><b>${esc(e.title)}</b><small>${short ? hhmm(new Date(e.start)) : hhmm(new Date(e.start)) + '–' + hhmm(new Date(e.end)) + (e.location ? ' · ' + esc(e.location) : '')}</small></div>`;
      }
      if (isToday) { const nm = minutesOfDay(new Date()); if (nm >= SH * 60 && nm <= EH * 60) col += `<div class="wg-now" style="top:${pct(nm)}%"></div>`; }
      g.insertAdjacentHTML('beforeend', col + '</div>');
    }
  }

  function renderDayList() {
    const el = $('day-list'); el.innerHTML = '';
    const todayKey = dayKey(new Date());
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart.getTime() + i * DAY);
      const evs = eventsInDay(d);
      let html = `<div class="day ${dayKey(d) === todayKey ? 'today' : ''}"><h3>${mdw(d)}${dayKey(d) === todayKey ? ' · 今天' : ''}</h3>`;
      if (!evs.length) html += '<p class="empty">无安排</p>';
      for (const e of evs) html += `<div class="row"><time>${e.allDay ? '全天' : hhmm(new Date(e.start)) + '–' + hhmm(new Date(e.end))}</time><div><span class="chip ${e.kind}">${esc(e.title)}</span>${e.location ? `<div class="muted" style="font-size:var(--text-xs)">${esc(e.location)}</div>` : ''}</div></div>`;
      el.insertAdjacentHTML('beforeend', html + '</div>');
    }
  }

  function renderCourses() {
    const el = $('course-list'); el.innerHTML = '';
    // 以本周起 4 周内的课程事件归并为“课程表”
    const from = mondayOf(new Date()), to = new Date(from.getTime() + 28 * DAY);
    const map = new Map();
    for (const e of data.events) {
      if (e.kind !== 'course' || e.allDay) continue;
      const s = new Date(e.start); if (s < from || s >= to) continue;
      const key = `${e.title}|${parts(s).wd}|${hhmm(s)}|${hhmm(new Date(e.end))}`;
      const cur = map.get(key) || { title: e.title, wd: parts(s).wd, t: `${hhmm(s)}–${hhmm(new Date(e.end))}`, location: e.location, count: 0, sort: parts(s).wd * 1440 + minutesOfDay(s) };
      cur.count++; map.set(key, cur);
    }
    const rows = [...map.values()].sort((a, b) => a.sort - b.sort);
    if (!rows.length) { el.innerHTML = '<li class="empty">未来四周没有课程安排</li>'; return; }
    for (const r of rows) el.insertAdjacentHTML('beforeend', `<li><span class="ttl">${esc(r.title)}</span><span class="when">${WEEKDAYS[r.wd]} ${r.t}</span>${r.location ? `<span class="sub">${esc(r.location)}</span>` : ''}</li>`);
  }

  function renderTrips() {
    const el = $('trip-list'); el.innerHTML = '';
    const now = new Date();
    // 相同标题的连续日期合并
    const trips = data.events.filter(e => e.kind === 'trip' && new Date(e.end) > now).sort((a, b) => a.start.localeCompare(b.start));
    const merged = [];
    for (const e of trips) {
      const last = merged[merged.length - 1];
      if (last && last.title === e.title && new Date(e.start) - new Date(last.end) <= DAY) last.end = e.end; else merged.push({ ...e });
    }
    if (!merged.length) { el.innerHTML = '<li class="empty">近期没有出差或外出行程</li>'; return; }
    for (const t of merged.slice(0, 8)) {
      const s = new Date(t.start), e = new Date(t.end);
      const sameDay = dayKey(s) === dayKey(new Date(e.getTime() - 1));
      const when = sameDay ? mdw(s) : `${md(s)} – ${md(new Date(e.getTime() - 1))}`;
      el.insertAdjacentHTML('beforeend', `<li><span class="ttl">${esc(t.title)}</span><span class="when">${when}</span>${t.location ? `<span class="sub">${esc(t.location)}</span>` : ''}</li>`);
    }
  }

  function renderUpcoming() {
    const el = $('upcoming-list'); el.innerHTML = '';
    const now = new Date();
    const list = data.events.filter(e => e.status !== 'CANCELLED' && new Date(e.end) > now).slice(0, 10);
    if (!list.length) { el.innerHTML = '<li class="empty">暂无安排</li>'; return; }
    let lastDay = '';
    for (const e of list) {
      const s = new Date(e.start); const k = dayKey(s);
      if (k !== lastDay) { el.insertAdjacentHTML('beforeend', `<div class="day-sep">${k === dayKey(now) ? '今天 · ' : ''}${mdw(s)}</div>`); lastDay = k; }
      el.insertAdjacentHTML('beforeend', `<li class="${e.kind}"><div class="when">${e.allDay ? '全天' : hhmm(s) + ' – ' + hhmm(new Date(e.end))}</div><div class="ttl">${esc(e.title)}</div>${e.location ? `<div class="sub">${esc(e.location)}</div>` : ''}</li>`);
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
    const slots = (data.freeSlots || []).slice(0, 9);
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
  $('prev-week').onclick = () => { weekStart = new Date(weekStart.getTime() - 7 * DAY); render(); };
  $('next-week').onclick = () => { weekStart = new Date(weekStart.getTime() + 7 * DAY); render(); };
  $('today-week').onclick = () => { weekStart = mondayOf(new Date()); render(); };
  function showErr(e) { const n = $('notice'); n.hidden = false; n.className = 'notice'; n.textContent = `日历读取失败：${e.message}。请稍后刷新。`; }

  setInterval(() => { $('clock').textContent = hhmm(new Date()); }, 1000);
  $('clock').textContent = hhmm(new Date());
  load().catch(showErr);
  setInterval(() => { if (data) { derive(); renderStatus(); renderFindMe(); } }, 60000);
  setInterval(() => load().catch(showErr), 5 * 60000);
})();
