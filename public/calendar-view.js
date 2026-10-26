(() => {
  const M = window.CalendarModel, $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let snapshot, events = [], anchor = M.day(new Date()), selected = M.day(new Date());
  let view = 'week', filter = 'all', query = '';
  let focusedEventButton = null, revealDay = true, compactWeek = true;
  const dayName = d => `${M.date(d)} ${M.weekdays[M.parts(d).wd]}`;
  const match = e => (filter === 'all' || e.category === filter) && (!query || [e.title, e.location, M.labels[e.category]].join(' ').toLowerCase().includes(query));
  const filtered = () => events.filter(match);
  const button = (e, d, cls = 'month-event') => `<button class="${cls} type-${e.category}" data-event-id="${esc(e.id)}" data-event-day="${M.key(d)}" aria-label="${esc(dayName(d) + ' ' + M.dayTime(e, d) + ' ' + e.title)}"><time>${M.dayTime(e, d)}</time><span>${esc(e.title)}</span></button>`;
  function range() {
    if (view === 'week') { const a = M.monday(anchor); return [a, M.add(a, 7)]; }
    if (view === 'agenda') { const a = M.day(anchor); return [a, M.add(a, 28)]; }
    const a = M.month(anchor); return [a, M.nextMonth(a, 1)];
  }
  function renderMonth(list) {
    const first = M.month(anchor), p = M.parts(first), from = M.monday(first), last = M.nextMonth(first, 1);
    const rows = Math.ceil((+last - +from) / (7 * M.DAY));
    let html = '<table class="month-table"><thead><tr>' + [1, 2, 3, 4, 5, 6, 0].map(w => `<th scope="col">${M.weekdays[w]}</th>`).join('') + '</tr></thead><tbody>';
    for (let w = 0; w < rows; w++) {
      html += '<tr>';
      for (let i = 0; i < 7; i++) {
        const d = M.add(from, w * 7 + i), key = M.key(d), dp = M.parts(d), items = M.inDay(list, d);
        html += `<td class="${dp.m !== p.m ? 'outside ' : ''}${key === M.key(selected) ? 'selected-day' : ''}"><button class="month-date ${key === M.key(new Date()) ? 'today' : ''}" data-select-day="${key}" aria-label="查看${dayName(d)}全部${items.length}项安排">${dp.d === 1 ? dp.m + '月' : dp.d}</button>`;
        html += items.map(e => button(e, d)).join('') + '</td>';
      }
      html += '</tr>';
    }
    $('calendar-surface').innerHTML = html + '</tbody></table>';
    if (revealDay) {
      const surface = $('calendar-surface'), cell = surface.querySelector('.selected-day');
      if (cell) surface.scrollTop += cell.getBoundingClientRect().top - surface.getBoundingClientRect().top - 48;
    }
  }
  function renderWeek(list) {
    if (!compactWeek) { renderWeekTimeline(list); return; }
    const from = M.monday(anchor), days = Array.from({ length: 7 }, (_, i) => M.add(from, i));
    let html = '<div class="compact-week">';
    html += days.map(d => `<div class="week-head ${M.key(d) === M.key(new Date()) ? 'today' : ''}"><button data-select-day="${M.key(d)}" aria-label="查看${dayName(d)}全部安排">${M.weekdays[M.parts(d).wd]}<br>${M.date(d)}</button></div>`).join('');
    for (const d of days) {
      const items = M.inDay(list, d), clashes = M.conflicts(items);
      html += `<div class="compact-week-day" data-week-day="${M.key(d)}">`;
      html += items.length ? items.map(e => `<button class="compact-week-event type-${e.category}" data-event-id="${esc(e.id)}" data-event-day="${M.key(d)}" title="${esc(M.fullTime(e) + ' ' + e.title + (e.location ? ' · ' + e.location : ''))}" aria-label="${esc(M.dayTime(e, d) + ' ' + e.title)}"><time>${M.dayTime(e, d)}</time><strong>${esc(e.title)}</strong>${e.location ? `<small>${esc(e.location)}</small>` : ''}${clashes.has(e.id) ? '<span class="conflict-tag">时间重叠</span>' : ''}</button>`).join('') : '<p class="compact-empty">暂无安排</p>';
      html += '</div>';
    }
    $('calendar-surface').innerHTML = html + '</div>';
  }
  function renderWeekTimeline(list) {
    const from = M.monday(anchor), days = Array.from({ length: 7 }, (_, i) => M.add(from, i));
    const relevant = M.inRange(list, from, M.add(from, 7));
    // Adapt the time axis to the real events; even an early train or 22:00 meeting stays visible.
    const starts = relevant.filter(e => !e.allDay).map(e => M.parts(e.start).hh);
    const ends = relevant.filter(e => !e.allDay).map(e => { const p = M.parts(e.end); return p.hh + (p.mm ? 1 : 0); });
    const crossesDay = relevant.some(e => !e.allDay && M.key(e.start) !== M.key(e.end));
    const sh = crossesDay ? 0 : Math.max(0, Math.min(8, ...starts)), eh = crossesDay ? 24 : Math.min(24, Math.max(23, ...ends)), hours = eh - sh;
    let html = `<div class="week-table" style="--week-hours:${hours}"><div class="week-head"></div>`;
    html += days.map(d => `<div class="week-head ${M.key(d) === M.key(new Date()) ? 'today' : ''}"><button data-select-day="${M.key(d)}" aria-label="查看${dayName(d)}全部安排">${M.weekdays[M.parts(d).wd]}<br>${M.date(d)}</button></div>`).join('');
    html += '<div class="week-all-label">全天</div>';
    html += days.map(d => `<div class="week-allday">${M.inDay(list, d).filter(e => e.allDay).map(e => button(e, d)).join('')}</div>`).join('');
    html += '<div class="week-hours">' + Array.from({ length: hours - 1 }, (_, i) => `<span style="top:${(i + 1) / hours * 100}%">${sh + i + 1}:00</span>`).join('') + '</div>';
    for (const d of days) {
      const blocks = M.inDay(list, d).filter(e => !e.allDay).map(e => ({ e, s: Math.max(+new Date(e.start), +d), t: Math.min(+new Date(e.end), +M.add(d, 1)) }));
      // Partition overlap groups into equal-width lanes, so simultaneous events never cover each other.
      const groups = []; let group = [], until = -Infinity;
      for (const b of blocks) { if (b.s >= until && group.length) { groups.push(group); group = []; until = -Infinity; } group.push(b); until = Math.max(until, b.t); }
      if (group.length) groups.push(group);
      html += `<div class="week-day" data-week-day="${M.key(d)}">`;
      for (const g of groups) {
        const lanes = [];
        for (const b of g) { let lane = lanes.findIndex(t => t <= b.s); if (lane < 0) lane = lanes.length; lanes[lane] = b.t; b.lane = lane; }
        for (const b of g) {
          const startMinute = (b.s - +d) / 60000, endMinute = (b.t - +d) / 60000;
          const top = (startMinute - sh * 60) / (hours * 60) * 100, h = (endMinute - startMinute) / (hours * 60) * 100;
          html += `<button class="week-event type-${b.e.category}" style="--top:${top}%;--height:${h}%;--left:calc(${b.lane / lanes.length * 100}% + 1px);--width:calc(${100 / lanes.length}% - 2px)" data-event-id="${esc(b.e.id)}" data-event-day="${M.key(d)}" title="${esc(M.fullTime(b.e) + ' ' + b.e.title + (b.e.location ? ' · ' + b.e.location : ''))}" aria-label="${esc(M.dayTime(b.e, d) + ' ' + b.e.title)}"><time>${M.dayTime(b.e, d)}</time><strong>${esc(b.e.title)}</strong>${b.e.location ? `<small>${esc(b.e.location)}</small>` : ''}</button>`;
        }
      }
      html += '</div>';
    }
    $('calendar-surface').innerHTML = html + '</div>';
  }
  function renderAgenda(list) {
    const [a, b] = range(); let html = '';
    for (let d = a; d < b; d = M.add(d, 1)) {
      const items = M.inDay(list, d); if (!items.length) continue;
      html += `<section class="agenda-day" data-agenda-day="${M.key(d)}"><h3>${M.date(d)}<small>${M.weekdays[M.parts(d).wd]} · ${items.length}项</small></h3><ul>`;
      html += items.map(e => `<li><button class="agenda-event type-${e.category}" data-event-id="${esc(e.id)}" data-event-day="${M.key(d)}"><time>${M.dayTime(e, d)}</time><span><strong>${esc(e.title)}</strong>${e.location ? `<small>${esc(e.location)}</small>` : ''}</span></button></li>`).join('') + '</ul></section>';
    }
    $('calendar-surface').innerHTML = `<div class="agenda-list">${html || '<p class="empty-calendar">这段时间没有符合条件的公开安排。</p>'}</div>`;
  }
  function renderDay(list) {
    const all = M.inDay(events, selected), items = M.inDay(list, selected), overlaps = M.conflicts(all);
    $('calendar-day-title').textContent = dayName(selected);
    $('calendar-day-subtitle').textContent = items.length === all.length ? `全部${all.length}项公开安排` : `筛选后${items.length}项 · 当天共${all.length}项`;
    $('calendar-day-items').innerHTML = items.length ? items.map(e => `<li class="day-card type-${e.category}"><button data-event-id="${esc(e.id)}" data-event-day="${M.key(selected)}"><time>${M.dayTime(e, selected)} · ${M.labels[e.category]}</time><strong>${esc(e.title)}</strong>${e.location ? `<small>${esc(e.location)}</small>` : ''}${overlaps.has(e.id) ? '<span class="conflict-tag">与其他安排重叠</span>' : ''}</button></li>`).join('') : '<li class="empty-calendar">没有符合条件的公开安排。</li>';
  }
  function render() {
    if (!snapshot) return;
    const p = M.parts(anchor), [a, b] = range(), list = filtered();
    $('calendar-range').textContent = view === 'month' ? `${p.y}年${p.m}月` : `${M.date(a)}—${M.date(M.add(b, -1))}${view === 'agenda' ? ' · 清单' : ''}`;
    $('calendar-date').value = M.key(selected);
    document.querySelectorAll('[data-calendar-view]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.calendarView === view)));
    document.querySelectorAll('[data-calendar-filter]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.calendarFilter === filter)));
    $('calendar-surface').dataset.view = view;
    document.querySelector('.calendar-layout').dataset.view = view;
    document.querySelector('.calendar-layout').dataset.compact = String(view === 'week' && compactWeek);
    $('calendar-density').hidden = view !== 'week';
    $('calendar-density').textContent = compactWeek ? '展开时间轴' : '收起空闲时段';
    $('calendar-density').setAttribute('aria-pressed', String(!compactWeek));
    $('calendar-layout-note').textContent = view === 'week' && compactWeek ? '空闲时段已收起；按每天的实际时间顺序排列，卡片高度不代表时长。' : '按实际时间轴显示；点击事项查看完整标题、时间和地点。';
    if (view === 'month') renderMonth(list); else if (view === 'week') renderWeek(list); else renderAgenda(list);
    renderDay(list); revealDay = false;
    const notice = $('calendar-notice'), bad = (snapshot.sources || []).filter(s => !s.ok);
    const outOfRange = b <= new Date(snapshot.range.from) || a >= new Date(snapshot.range.to);
    notice.hidden = !snapshot.demo && !bad.length && !outOfRange;
    notice.textContent = snapshot.demo ? '当前是演示数据，尚未接入公开日历。' : bad.length ? `${bad.map(s => s.name).join('、')}暂时无法同步，当前安排可能不完整。` : outOfRange ? `当前同步范围为${M.date(snapshot.range.from)}至${M.date(snapshot.range.to)}，请选择范围内的日期。` : '';
    $('calendar-updated').textContent = `更新：${M.date(snapshot.generatedAt)} ${M.time(snapshot.generatedAt)} · 可查看 ${M.key(snapshot.range.from)}—${M.key(snapshot.range.to)}`;
  }
  function openEvent(id, source) {
    const e = events.find(e => e.id === id); if (!e) return;
    focusedEventButton = source;
    $('event-dialog-type').textContent = `${M.labels[e.category]} · ${e.calendar}`;
    $('event-dialog-title').textContent = e.title;
    $('event-dialog-details').innerHTML = `<dt>时间</dt><dd>${esc(M.fullTime(e))}（北京时间）</dd><dt>地点</dt><dd>${esc(e.location || '未注明')}</dd>${e.description ? `<dt>备注</dt><dd>${esc(e.description)}</dd>` : ''}`;
    $('calendar-event-dialog').showModal();
  }
  function selectDay(d, shiftAnchor = false) { selected = M.day(d); revealDay = true; if (shiftAnchor) anchor = selected; render(); }
  function specialAndSlots() {
    const now = new Date(), days = M.dailyAgenda(events, now), unique = new Set(days.flatMap(d => d.items.map(e => e.id)));
    $('calendar-special-summary').textContent = `${dayName(days[0].date)}—${dayName(days[days.length - 1].date)} · 共${unique.size}项公开安排；跨日事项逐日列出。向下滚动查看全部日期。`;
    $('calendar-special').innerHTML = days.map(({ date, items }) => `<section class="upcoming-day" data-upcoming-day="${M.key(date)}"><h3>${dayName(date)}<span>${items.length ? items.length + '项' : '暂无安排'}</span></h3>${items.length ? items.map(e => `<button class="quick-row type-${e.category}" data-event-id="${esc(e.id)}"><time>${M.dayTime(e, date)}</time><span><strong>${esc(e.title)}</strong><small>${M.labels[e.category]}${e.location ? ' · ' + esc(e.location) : ''}</small></span></button>`).join('') : '<p class="upcoming-empty">暂无公开安排</p>'}</section>`).join('');
    const slots = [], busy = events.filter(e => !e.allDay).map(e => [Date.parse(e.start), Date.parse(e.end)]);
    for (let i = 0; i < 7; i++) {
      const d = M.add(M.day(now), i), wd = M.parts(d).wd;
      for (const oh of snapshot.officeHours || []) {
        if (!oh.days.includes(wd)) continue;
        const at = t => +M.parseDay(M.key(d)) + (Number(t.split(':')[0]) * 60 + Number(t.split(':')[1])) * 60000;
        let cur = Math.max(at(oh.start), Math.ceil(+now / 900000) * 900000), end = at(oh.end);
        for (const [s, t] of busy.filter(([s, t]) => t > cur && s < end).sort((a, b) => a[0] - b[0])) { if (s - cur >= (snapshot.minFreeMinutes || 30) * 60000) slots.push([cur, s]); cur = Math.max(cur, t); }
        if (end - cur >= (snapshot.minFreeMinutes || 30) * 60000) slots.push([cur, end]);
      }
    }
    const email = snapshot.owner.email || '';
    const slotDays = new Map();
    for (const slot of slots) { const key = M.key(slot[0]); if (!slotDays.has(key)) slotDays.set(key, []); slotDays.get(key).push(slot); }
    $('calendar-slot-summary').textContent = `${M.date(now)}—${M.date(M.add(M.day(now), 6))} · ${slots.length}个可约时段`;
    $('calendar-slots').innerHTML = [...slotDays].map(([date, times]) => `<section class="availability-day"><h4><span>${M.weekdays[M.parts(times[0][0]).wd]}</span><time datetime="${date}">${M.date(times[0][0])}</time></h4><div class="slot-options">${times.map(([a, b]) => `<a class="free-slot" href="mailto:${esc(email)}?subject=${encodeURIComponent('预约：' + dayName(a) + ' ' + M.time(a) + '—' + M.time(b))}" aria-label="${esc('邮件预约 ' + dayName(a) + ' ' + M.time(a) + '—' + M.time(b))}"><span>${M.time(a)}—${M.time(b)}</span><span class="slot-arrow" aria-hidden="true">↗</span></a>`).join('')}</div></section>`).join('') || '<p class="empty-calendar">未来一周暂无可预约时段，欢迎邮件联系。</p>';
    $('calendar-contact').innerHTML = `<dt>邮箱</dt><dd><a href="mailto:${esc(email)}">${esc(email)}</a></dd>${snapshot.owner.location ? `<dt>常用办公地点</dt><dd>${esc(snapshot.owner.location)}</dd>` : ''}`;
    $('calendar-email').href = 'mailto:' + email + '?subject=' + encodeURIComponent('预约交流');
    $('calendar-email-mobile').href = $('calendar-email').href;
  }
  function renderStatus() {
    if (!snapshot) return;
    const now = new Date(), current = events.filter(e => !e.allDay && new Date(e.start) <= now && new Date(e.end) > now);
    const next = events.find(e => !e.allDay && new Date(e.start) > now);
    $('calendar-status').textContent = current.length ? `正在进行：${current[0].title}` : '当前没有进行中的公开安排';
    $('calendar-next').textContent = next ? `下一项：${dayName(next.start)} ${M.time(next.start)} ${next.title}` : '近期暂无后续安排';
  }
  async function load() {
    try {
      const response = await fetch('data/schedule.json?t=' + Date.now(), { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      snapshot = await response.json(); events = M.normalize(snapshot.events);
      render(); renderStatus(); specialAndSlots();
    } catch (e) { $('calendar-notice').hidden = false; $('calendar-notice').textContent = '日历暂时无法读取，请稍后刷新。'; $('calendar-status').textContent = '日历读取失败'; }
  }
  document.addEventListener('click', e => {
    const event = e.target.closest('[data-event-id]');
    if (event) { if (event.dataset.eventDay) selectDay(M.parseDay(event.dataset.eventDay)); openEvent(event.dataset.eventId, Array.from(document.querySelectorAll('#calendar-surface [data-event-id]')).find(el => el.dataset.eventId === event.dataset.eventId && el.dataset.eventDay === event.dataset.eventDay) || event); return; }
    const date = e.target.closest('[data-select-day]'); if (date) selectDay(M.parseDay(date.dataset.selectDay));
    const mode = e.target.closest('[data-calendar-view]'); if (mode) { view = mode.dataset.calendarView; revealDay = true; render(); }
    const type = e.target.closest('[data-calendar-filter]'); if (type) { filter = type.dataset.calendarFilter; render(); }
  });
  $('calendar-density').onclick = () => { compactWeek = !compactWeek; render(); };
  $('calendar-prev').onclick = () => { anchor = view === 'month' ? M.nextMonth(anchor, -1) : M.add(anchor, view === 'week' ? -7 : -28); selected = view === 'month' ? M.month(anchor) : view === 'week' ? M.monday(anchor) : anchor; revealDay = true; render(); };
  $('calendar-next-date').onclick = () => { anchor = view === 'month' ? M.nextMonth(anchor, 1) : M.add(anchor, view === 'week' ? 7 : 28); selected = view === 'month' ? M.month(anchor) : view === 'week' ? M.monday(anchor) : anchor; revealDay = true; render(); };
  $('calendar-today').onclick = () => selectDay(new Date(), true);
  $('day-today').onclick = () => selectDay(new Date(), true);
  $('day-tomorrow').onclick = () => selectDay(M.add(M.day(new Date()), 1), true);
  $('calendar-date').onchange = e => { if (e.target.value) selectDay(M.parseDay(e.target.value), true); };
  $('calendar-search').oninput = e => { query = e.target.value.trim().toLowerCase(); render(); };
  $('event-dialog-close').onclick = () => $('calendar-event-dialog').close();
  $('calendar-event-dialog').addEventListener('close', () => { if (focusedEventButton?.isConnected) focusedEventButton.focus(); });
  load(); setInterval(load, 300000); setInterval(renderStatus, 60000);
})();
