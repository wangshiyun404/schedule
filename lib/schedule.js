// lib/schedule.js — 读取 iCloud 公共日历(ICS)、展开重复事件、分类、隐私处理，生成前端可直接使用的 JSON。
const fs = require('fs');
const path = require('path');
const ical = require('node-ical');
const DAY = 86400000;

// 日历地址来源优先级：环境变量 CALENDARS_JSON（CI 用 Secret）> config.local.json（本地，不入库）> config.json
function loadConfig(root) {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, 'config.json'), 'utf8'));
  const localPath = path.join(root, 'config.local.json');
  if (fs.existsSync(localPath)) Object.assign(cfg, JSON.parse(fs.readFileSync(localPath, 'utf8')));
  if (process.env.CALENDARS_JSON) cfg.calendars = JSON.parse(process.env.CALENDARS_JSON);
  return cfg;
}

// ---------- 时区工具 ----------
function zonedParts(date, tz) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', weekday: 'short'
  });
  const p = {};
  for (const { type, value } of f.formatToParts(date)) p[type] = value;
  const wd = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[p.weekday];
  return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour, mm: +p.minute, weekday: wd };
}
function tzOffsetMs(date, tz) {
  const p = zonedParts(date, tz);
  const asUTC = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm, 0);
  const truncated = Math.floor(date.getTime() / 60000) * 60000;
  return asUTC - truncated;
}
function zonedToUTC(y, m, d, hh, mm, tz) {
  const guess = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));
  return new Date(guess.getTime() - tzOffsetMs(guess, tz));
}
function startOfZonedDay(date, tz) {
  const p = zonedParts(date, tz);
  return zonedToUTC(p.y, p.m, p.d, 0, 0, tz);
}

// ---------- 分类 ----------
const TRIP_RE = /航班|乘坐[A-Z0-9]{2}\d{3,4}|出差|行程|flight|高铁|火车|动车|差旅|机场|酒店|trip|travel/i;
const COURSE_RE = /汉语|精读|听说|读写|写作|口语|智慧格致|讲座|组会|实践课|公开课|上课|lecture|seminar|tutorial|workshop|\bclass\b/i;
const NOT_COURSE_RE = /备课|调课|顺课|课前|课后|考勤|教资|回放|培训/;
function classify(title, calendarKind) {
  if (calendarKind && calendarKind !== 'auto') return calendarKind;
  const t = (title || '').toString();
  if (TRIP_RE.test(t)) return 'trip';
  if (COURSE_RE.test(t) && !NOT_COURSE_RE.test(t)) return 'course';
  return 'event';
}

// ---------- ICS 获取 + 缓存 ----------
const cache = new Map(); // url -> {fetchedAt, data, error}
async function fetchICS(url, ttlSec) {
  const httpsUrl = url.replace(/^webcal:\/\//i, 'https://');
  const c = cache.get(url);
  if (c && Date.now() - c.fetchedAt < ttlSec * 1000) return c;
  try {
    const res = await fetch(httpsUrl, { headers: { 'User-Agent': 'schedule-site/1.0' }, redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    const data = ical.sync.parseICS(text);
    const entry = { fetchedAt: Date.now(), data, error: null };
    cache.set(url, entry);
    return entry;
  } catch (e) {
    const entry = { fetchedAt: Date.now(), data: c ? c.data : null, error: String(e.message || e), stale: !!c };
    cache.set(url, entry);
    return entry;
  }
}

// ---------- 展开事件（含重复规则） ----------
function expandEvents(data, from, to, cal, tz) {
  const out = [];
  if (!data) return out;
  for (const key of Object.keys(data)) {
    const ev = data[key];
    if (!ev || ev.type !== 'VEVENT') continue;
    if (ev.recurrenceid) continue; // 单次修改的重复事件由主事件的 recurrences 处理
    const allDay = ev.datetype === 'date' || !!(ev.start && ev.start.dateOnly);
    // 全天事件：按日历所在时区的 0 点归一化
    const normDate = (d) => allDay ? zonedToUTC(d.getFullYear(), d.getMonth() + 1, d.getDate(), 0, 0, tz) : new Date(d);
    const dur = (ev.end && ev.start) ? (ev.end.getTime() - ev.start.getTime()) : (allDay ? DAY : 3600000);
    const push = (start, end, src, recId) => {
      if (end <= from || start >= to) return;
      out.push({
        id: `${ev.uid}${recId ? '_' + recId : ''}`,
        title: (src.summary || '（无标题）').toString(),
        start: start.toISOString(), end: end.toISOString(),
        allDay,
        location: (src.location || '').toString(),
        description: (src.description || '').toString(),
        calendar: cal.name,
        kind: classify(src.summary, cal.kind),
        color: cal.color || null,
        status: (src.status || '').toString().toUpperCase(),
      });
    };
    if (ev.rrule) {
      const exdates = new Set(Object.values(ev.exdate || {}).map(d => new Date(d).getTime()));
      const overrides = ev.recurrences || {};
      const overrideStarts = new Set(Object.values(overrides).map(o => o.recurrenceid ? new Date(o.recurrenceid).getTime() : null));
      const dates = ev.rrule.between(new Date(from.getTime() - dur), to, true);
      for (const d of dates) {
        const t = d.getTime();
        if (exdates.has(t) || overrideStarts.has(t)) continue;
        const s0 = normDate(d);
        push(s0, new Date(s0.getTime() + dur), ev, t);
      }
      const seen = new Set();
      for (const o of Object.values(overrides)) {
        if (!o.start) continue;
        const rk = o.recurrenceid ? new Date(o.recurrenceid).getTime() : o.start.getTime();
        if (seen.has(rk)) continue; seen.add(rk);
        const oEnd = o.end || new Date(o.start.getTime() + dur);
        push(new Date(o.start), new Date(oEnd), o, 'ov' + o.start.getTime());
      }
    } else if (ev.start) {
      const s0 = normDate(ev.start);
      const e0 = ev.end ? normDate(ev.end) : new Date(s0.getTime() + dur);
      push(s0, e0 > s0 ? e0 : new Date(s0.getTime() + (allDay ? DAY : dur)), ev, null);
    }
  }
  return out;
}

// ---------- 演示数据（未配置日历时使用） ----------
function demoEvents(from, to, tz) {
  const out = [];
  const weekStart = (() => {
    const p = zonedParts(from, tz);
    const monday = new Date(from.getTime() - ((p.weekday + 6) % 7) * DAY);
    return startOfZonedDay(monday, tz);
  })();
  const mk = (dayOffset, sh, sm, eh, em, title, kind, location) => {
    const base = zonedParts(new Date(weekStart.getTime() + dayOffset * DAY), tz);
    const s = zonedToUTC(base.y, base.m, base.d, sh, sm, tz);
    const e = zonedToUTC(base.y, base.m, base.d, eh, em, tz);
    if (e <= from || s >= to) return;
    out.push({ id: `demo-${dayOffset}-${sh}${sm}-${title}`, title, start: s.toISOString(), end: e.toISOString(), allDay: false, location: location || '', description: '', calendar: '演示日历', kind, color: null, status: 'CONFIRMED' });
  };
  for (let w = -1; w <= 3; w++) {
    const o = w * 7;
    mk(o + 0, 10, 0, 11, 40, '商务汉语精读A', 'course', 'E 座 203');
    mk(o + 2, 10, 0, 11, 40, '商务汉语精读A', 'course', 'E 座 203');
    mk(o + 3, 14, 30, 16, 10, '书院实践课', 'course', '书院一楼学习空间');
    mk(o + 1, 15, 0, 16, 0, '学生论文指导', 'event', '办公室');
    mk(o + 4, 9, 30, 10, 30, '教研例会', 'event', '会议室');
  }
  mk(15, 7, 0, 22, 0, '出差 · 广州（课程交流）', 'trip', '广州');
  mk(16, 7, 0, 20, 0, '出差 · 广州（课程交流）', 'trip', '广州');
  mk(5, 14, 0, 17, 0, '澄海玩具创业训练项目路演', 'event', '创业中心');
  return out;
}


// ---------- 生成快照 ----------
const SKIP_TITLE_RE = /^(新建日程|New Event)$/i;
async function buildSnapshot(cfg, opts = {}) {
  const tz = cfg.timezone || 'Asia/Shanghai';
  const now = new Date();
  const from = new Date(startOfZonedDay(now, tz).getTime() - (opts.pastDays ?? 21) * DAY);
  const to = new Date(startOfZonedDay(now, tz).getTime() + (opts.futureDays ?? 200) * DAY);
  const sources = [];
  let events = [];
  const demo = !cfg.calendars || cfg.calendars.length === 0;
  if (demo) {
    events = demoEvents(from, to, tz);
    sources.push({ name: '演示日历', ok: true, demo: true });
  } else {
    for (const cal of cfg.calendars) {
      const r = await fetchICS(cal.url, cfg.refreshSeconds || 60);
      sources.push({ name: cal.name, ok: !r.error, error: r.error, stale: !!r.stale, fetchedAt: new Date(r.fetchedAt).toISOString() });
      events = events.concat(expandEvents(r.data, from, to, cal, tz));
    }
  }
  events = events.filter(e => !SKIP_TITLE_RE.test(e.title.trim()));
  // 全局 showEventDetails=false 或某个日历设置 hideDetails=true 时，只显示「上课 / 出差 / 忙碌」
  const hiddenCals = new Set((cfg.calendars || []).filter(c => c.hideDetails).map(c => c.name));
  events = events.map(e => (!cfg.showEventDetails || hiddenCals.has(e.calendar))
    ? { ...e, title: e.kind === 'course' ? '上课' : e.kind === 'trip' ? '出差' : '忙碌', location: '', description: '' }
    : { ...e, description: '' });
  events.sort((a, b) => a.start.localeCompare(b.start));
  return {
    generatedAt: now.toISOString(), timezone: tz, demo, owner: cfg.owner, officeHours: cfg.officeHours,
    minFreeMinutes: cfg.minFreeMinutes || 30, sources, range: { from: from.toISOString(), to: to.toISOString() }, events,
  };
}

module.exports = { loadConfig, buildSnapshot, fetchICS, expandEvents, classify };
