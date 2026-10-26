/* Shared public-calendar rules. No private calendar data is read in the browser. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CalendarModel = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  const DAY = 86400000, TZ = 'Asia/Shanghai';
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' });
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const labels = { course: '课程', meeting: '组会与会议', trip: '行程', other: '其他安排' };
  function parts(d) {
    const p = {};
    for (const { type, value } of formatter.formatToParts(new Date(d))) p[type] = value;
    return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute, wd: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday) };
  }
  const key = d => { const p = parts(d); return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`; };
  const day = d => new Date(`${key(d)}T00:00:00+08:00`);
  const parseDay = s => new Date(`${s}T00:00:00+08:00`);
  const add = (d, n) => new Date(+new Date(d) + n * DAY);
  const time = d => { const p = parts(d); return `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`; };
  const date = d => { const p = parts(d); return `${p.m}月${p.d}日`; };
  const monday = d => add(day(d), -((parts(d).wd + 6) % 7));
  const month = d => { const p = parts(d); return parseDay(`${p.y}-${String(p.m).padStart(2, '0')}-01`); };
  function nextMonth(d, n) { const p = parts(d), v = new Date(Date.UTC(p.y, p.m - 1 + n, 1)); return parseDay(`${v.getUTCFullYear()}-${String(v.getUTCMonth() + 1).padStart(2, '0')}-01`); }
  function category(e) {
    if (e.kind === 'trip' || /航班|高铁|班车|中转|打车|赴.+(?:参加|培训)/.test(e.title)) return 'trip';
    if (/组会|教研会|会议|推进会|指导会|培训|小组.*讨论/.test(e.title) && !/回放|备课/.test(e.title)) return 'meeting';
    if (/商务汉语精读|汉语读写|中级汉语听说|智慧格致|^期中考试|^期末考试/.test(e.title) && !/备课|命题|出卷|试卷|材料|名单|顺课|通知|回放|准备|核对|申请/.test(e.title)) return 'course';
    if (e.kind === 'course' && !/备课|命题|出卷|试卷|调课|回放|提醒|顺课/.test(e.title)) return 'course';
    return 'other';
  }
  function normalize(events) {
    const seen = new Set();
    return (events || []).filter(e => {
      if (e.status === 'CANCELLED' || !Number.isFinite(Date.parse(e.start)) || !Number.isFinite(Date.parse(e.end)) || Date.parse(e.end) <= Date.parse(e.start)) return false;
      const k = [e.title, e.start, e.end, e.location || ''].join('|');
      if (seen.has(k)) return false;
      seen.add(k); return true;
    }).map(e => ({ ...e, category: category(e) })).sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title));
  }
  const inRange = (events, a, b) => events.filter(e => Date.parse(e.start) < +b && Date.parse(e.end) > +a);
  const inDay = (events, d) => inRange(events, day(d), add(day(d), 1));
  // A continuous date list of every public event category, including empty days.
  function dailyAgenda(events, from, count = 30) {
    return Array.from({ length: count }, (_, i) => { const date = add(day(from), i); return { date, items: inDay(events, date) }; });
  }
  // Stretch only the intervals that need room for text. All seven days share this axis.
  function timelineAxis(start, end, blocks, pixelsPerMinute = 76 / 60) {
    const needs = blocks.map(b => ({ start: Math.max(start, b.start), end: Math.min(end, b.end), height: b.height }))
      .filter(b => b.end > b.start && Number.isFinite(b.height));
    const edges = [...new Set([start, end, ...needs.flatMap(b => [b.start, b.end])])].sort((a, b) => a - b);
    const heights = edges.slice(1).map((v, i) => (v - edges[i]) * pixelsPerMinute);
    const indexes = new Map(edges.map((v, i) => [v, i]));
    for (const b of needs.sort((a, b) => (a.end - a.start) - (b.end - b.start))) {
      const first = indexes.get(b.start), last = indexes.get(b.end);
      const deficit = b.height - heights.slice(first, last).reduce((sum, v) => sum + v, 0);
      if (deficit > 0) for (let i = first; i < last; i++) heights[i] += deficit * (edges[i + 1] - edges[i]) / (b.end - b.start);
    }
    const offsets = [0]; for (const h of heights) offsets.push(offsets[offsets.length - 1] + h);
    const position = minute => {
      if (minute <= start) return 0;
      if (minute >= end) return offsets[offsets.length - 1];
      const i = edges.findIndex((v, i) => i > 0 && minute <= v) - 1;
      return offsets[i] + (minute - edges[i]) / (edges[i + 1] - edges[i]) * heights[i];
    };
    return { height: offsets[offsets.length - 1], position };
  }
  function dayTime(e, d) {
    if (e.allDay) return '全天';
    const a = day(d), b = add(a, 1), start = new Date(e.start), end = new Date(e.end);
    const label = `${start < a ? '00:00' : time(start)}–${end >= b ? '24:00' : time(end)}`;
    return label + (start < a || end > b ? ' · 跨日' : '');
  }
  function fullTime(e) {
    const a = new Date(e.start), b = new Date(e.end);
    if (e.allDay) { const last = new Date(+b - 1); return `${date(a)}${key(a) === key(last) ? '' : '—' + date(last)} · 全天`; }
    return `${date(a)} ${time(a)}—${key(a) === key(b) ? '' : date(b) + ' '}${time(b)}`;
  }
  function conflicts(events) {
    const result = new Set(), timed = events.filter(e => !e.allDay);
    for (let i = 0; i < timed.length; i++) for (let j = i + 1; j < timed.length; j++) {
      if (Math.max(Date.parse(timed[i].start), Date.parse(timed[j].start)) < Math.min(Date.parse(timed[i].end), Date.parse(timed[j].end))) { result.add(timed[i].id); result.add(timed[j].id); }
    }
    return result;
  }
  return { DAY, TZ, weekdays, labels, parts, key, day, parseDay, add, time, date, monday, month, nextMonth, normalize, inRange, inDay, dailyAgenda, timelineAxis, dayTime, fullTime, conflicts };
});
