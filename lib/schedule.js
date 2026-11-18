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
function clearFetchCache() { cache.clear(); }

// 只保留状态码或固定原因。网络错误里的主机名和订阅地址不能进入日志或页面数据。
function sanitizeError(err) {
  const message = String((err && err.message) || '');
  if (/^HTTP \d{3}$/.test(message)) return message;
  if (message === '响应不是日历数据' || message === '日历解析失败') return message;
  const code = err && err.cause && err.cause.code;
  if (code && /^[A-Z0-9_]+$/.test(String(code))) return `fetch failed (${code})`;
  return 'fetch failed';
}

function readCalendar(text) {
  const raw = String(text || '');
  if (!/BEGIN:VCALENDAR/i.test(raw)) return { error: '响应不是日历数据', data: null, feedEventCount: 0 };
  try {
    const data = ical.sync.parseICS(raw);
    const feedEventCount = Object.values(data).filter(item => item && item.type === 'VEVENT').length;
    return { error: null, data, feedEventCount };
  } catch (e) {
    return { error: '日历解析失败', data: null, feedEventCount: 0 };
  }
}

async function fetchICS(url, ttlSec, opts = {}) {
  const httpsUrl = String(url || '').replace(/^webcal:\/\//i, 'https://');
  const fetchImpl = opts.fetchImpl || fetch;
  const attempts = opts.attempts ?? 2;
  const retryDelayMs = opts.retryDelayMs ?? 0;
  const cached = cache.get(url);
  if (cached && !cached.error && Date.now() - cached.fetchedAt < ttlSec * 1000) return cached;
  let last = null;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetchImpl(httpsUrl, { headers: { 'User-Agent': 'schedule-site/1.0' }, redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const parsed = readCalendar(await res.text());
      if (parsed.error) throw new Error(parsed.error);
      last = { fetchedAt: Date.now(), data: parsed.data, error: null, feedEventCount: parsed.feedEventCount };
      cache.set(url, last);
      return last;
    } catch (e) {
      last = { fetchedAt: Date.now(), data: null, error: sanitizeError(e), feedEventCount: 0 };
      if (attempt < attempts && retryDelayMs) await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
  cache.set(url, last);
  return last;
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
  if (!opts.keepCache) clearFetchCache();
  const tz = cfg.timezone || 'Asia/Shanghai';
  const now = opts.now ? new Date(opts.now) : new Date();
  const from = new Date(startOfZonedDay(now, tz).getTime() - (opts.pastDays ?? 21) * DAY);
  const to = new Date(startOfZonedDay(now, tz).getTime() + (opts.futureDays ?? 200) * DAY);
  const sources = [];
  let events = [];
  const demo = !cfg.calendars || cfg.calendars.length === 0;
  if (demo) {
    events = demoEvents(from, to, tz);
    sources.push({ name: '演示日历', ok: true, state: 'demo', demo: true, eventCount: events.length, feedEventCount: events.length });
  } else {
    for (const cal of cfg.calendars) {
      const r = await fetchICS(cal.url, cfg.refreshSeconds || 60, opts);
      const expanded = r.error ? [] : expandEvents(r.data, from, to, cal, tz);
      const state = r.error ? 'failed' : (r.feedEventCount > 0 ? 'ok' : 'empty');
      sources.push({
        name: cal.name,
        ok: state !== 'failed',
        state,
        error: r.error,
        stale: false,
        fetchedAt: new Date(r.fetchedAt).toISOString(),
        eventCount: expanded.length,
        feedEventCount: r.feedEventCount || 0,
      });
      events = events.concat(expanded);
    }
  }
  events = events.filter(e => !SKIP_TITLE_RE.test(e.title.trim()));
  // 全局 showEventDetails=false 或某个日历设置 hideDetails=true 时，只显示「上课 / 出差 / 忙碌」
  const hiddenCals = new Set((cfg.calendars || []).filter(c => c.hideDetails).map(c => c.name));
  events = events.map(e => (!cfg.showEventDetails || hiddenCals.has(e.calendar))
    ? { ...e, title: e.kind === 'course' ? '上课' : e.kind === 'trip' ? '出差' : '忙碌', location: '', description: '' }
    : { ...e, description: '' });
  events.sort((a, b) => a.start.localeCompare(b.start));
  const failed = sources.some(source => source.state === 'failed');
  const confirmedEmpty = !demo && !failed && events.length === 0 && sources.length > 0 && sources.every(source => source.state === 'empty');
  return {
    generatedAt: now.toISOString(), dataAsOf: now.toISOString(), timezone: tz, demo,
    status: demo ? 'demo' : failed ? 'failed' : confirmedEmpty ? 'empty' : 'ok',
    owner: cfg.owner, officeHours: cfg.officeHours,
    minFreeMinutes: cfg.minFreeMinutes || 30, sources, range: { from: from.toISOString(), to: to.toISOString() }, events,
  };
}

// 上次有效课表必须是一次完整成功，并且确实有事项。失败发布和空结果不能拿来当保护基准。
function isLastKnownGood(snapshot) {
  if (!snapshot || snapshot.demo || !Array.isArray(snapshot.events) || snapshot.events.length === 0) return false;
  const sources = snapshot.sources || [];
  if (!sources.length || sources.some(source => source.ok === false || source.state === 'failed')) return false;
  return true;
}

function selectLastKnownGood(...candidates) {
  return candidates.find(isLastKnownGood) || null;
}

// 发布判断要看见两类旧文件：真正的上次有效课表，以及仍留在线上的那次空发布。
// 后者不能当有效数据，但可以阻止再写一份空课表，好让恢复步骤放回原来的产物。
function referenceSnapshot(...candidates) {
  return selectLastKnownGood(...candidates) || candidates.find(isBadEmptyPublication) || null;
}

function assessPublication(snapshot, previous) {
  if (!snapshot) return { publish: false, status: 'failed', reason: 'fetch-failed', sources: [] };
  if (snapshot.demo) {
    if (isLastKnownGood(previous)) return { publish: false, status: 'demo', reason: 'demo-preserves-good', sources: [] };
    return { publish: true, status: 'demo', reason: 'demo', sources: [] };
  }
  const sources = snapshot.sources || [];
  const failed = sources.filter(source => source.state === 'failed' || source.ok === false);
  if (failed.length) return { publish: false, status: 'failed', reason: 'fetch-failed', sources: failed.map(source => source.name) };
  if (isBadEmptyPublication(previous) && snapshot.events.length === 0) {
    return { publish: false, status: 'empty', reason: 'abnormal-empty', sources: sources.map(source => source.name) };
  }
  const prior = isLastKnownGood(previous) ? previous : null;
  if (prior) {
    const emptied = sources.filter(source => source.state === 'empty' && prior.events.some(event => event.calendar === source.name));
    if (emptied.length || snapshot.events.length === 0) {
      return {
        publish: false,
        status: 'empty',
        reason: 'abnormal-empty',
        sources: (emptied.length ? emptied : sources).map(source => source.name),
      };
    }
  }
  if (snapshot.events.length === 0 && sources.every(source => source.state === 'empty')) {
    return { publish: true, status: 'empty', reason: 'confirmed-empty', sources: sources.map(source => source.name) };
  }
  return { publish: true, status: 'ok', reason: 'ok', sources: [] };
}

function publishSnapshot(snapshot, previous, outFile) {
  const decision = assessPublication(snapshot, previous);
  if (!decision.publish) return { ...decision, wrote: false };
  const body = { ...snapshot, status: decision.status, dataAsOf: snapshot.dataAsOf || snapshot.generatedAt };
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, JSON.stringify(body));
  return { ...decision, wrote: true };
}

// 2026-11-18 18:09（Asia/Shanghai）那次发布：工作日历抓取失败，另外两个日历本来就没有事项，结果被写成 0 项。
const BAD_EMPTY_PUBLICATION = Object.freeze({
  generatedAt: '2026-11-18T10:09:22.073Z',
  eventCount: 0,
  failedSource: '工作',
});
// run 44221004787 的 Pages 产物。只允许原样放回，不能改写 generatedAt，也不能把它标成新的同步结果。
const KNOWN_GOOD_ARTIFACT = Object.freeze({
  id: 14390756699,
  generatedAt: '2026-11-18T02:08:22.293Z',
  eventCount: 220,
});

function isBadEmptyPublication(snapshot) {
  if (!snapshot || snapshot.generatedAt !== BAD_EMPTY_PUBLICATION.generatedAt) return false;
  if (!Array.isArray(snapshot.events) || snapshot.events.length !== BAD_EMPTY_PUBLICATION.eventCount) return false;
  const source = (snapshot.sources || []).find(item => item.name === BAD_EMPTY_PUBLICATION.failedSource);
  return !!source && source.ok === false;
}

function isVerifiedGoodArtifact(snapshot) {
  if (!snapshot || snapshot.demo || snapshot.generatedAt !== KNOWN_GOOD_ARTIFACT.generatedAt) return false;
  if (!Array.isArray(snapshot.events) || snapshot.events.length !== KNOWN_GOOD_ARTIFACT.eventCount) return false;
  const sources = snapshot.sources || [];
  return sources.length > 0 && sources.every(source => source.ok === true);
}

function decideRestore(live) {
  return isBadEmptyPublication(live) ? 'restore' : 'keep-current';
}

// 只给已核对的旧快照加上保留标记。generatedAt 和事件保持原样，不能写成一次新的同步。
function markRetained(snapshot) {
  if (!isVerifiedGoodArtifact(snapshot)) throw new Error('产物不是已核对的 10:08 课表，未发布');
  return { ...snapshot, status: 'retained', publication: 'retained', dataAsOf: snapshot.generatedAt };
}

module.exports = {
  loadConfig, buildSnapshot, fetchICS, expandEvents, classify, clearFetchCache, sanitizeError,
  isLastKnownGood, selectLastKnownGood, referenceSnapshot, assessPublication, publishSnapshot,
  isBadEmptyPublication, isVerifiedGoodArtifact, decideRestore, markRetained,
  BAD_EMPTY_PUBLICATION, KNOWN_GOOD_ARTIFACT,
};
