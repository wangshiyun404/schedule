const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const S = require('../lib/schedule');

const NOW = '2026-11-18T02:08:22.293Z';
const NAMES = ['工作', '汕大2026秋季课程与待办', '飞行计划'];

const URLS = { '工作': 'work', '汕大2026秋季课程与待办': 'stu', '飞行计划': 'flight' };
function cfg() {
  return {
    timezone: 'Asia/Shanghai',
    showEventDetails: true,
    refreshSeconds: 60,
    calendars: NAMES.map(name => ({ name, url: `webcal://example.test/${URLS[name]}`, kind: 'auto' })),
  };
}
function ics(summary) {
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:${summary}\r\nDTSTART:20261118T020000Z\r\nDTEND:20261118T030000Z\r\nSUMMARY:${summary}\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`;
}
const EMPTY_ICS = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//schedule-test//\r\nEND:VCALENDAR\r\n';
function response(body, status = 200) {
  return { ok: status < 400, status, text: async () => body };
}
function fetchFrom(handler) {
  const calls = [];
  const impl = async url => {
    calls.push(url);
    return handler(url, calls.length);
  };
  impl.calls = calls;
  return impl;
}
function previousGood() {
  return {
    demo: false,
    generatedAt: '2026-11-18T02:08:22.293Z',
    events: [{ id: 'kept', calendar: '工作', title: '已有事项', start: '2026-11-18T02:00:00.000Z', end: '2026-11-18T03:00:00.000Z' }],
    sources: NAMES.map(name => ({ name, ok: true, state: 'ok' })),
  };
}
function badPublication() {
  return {
    generatedAt: '2026-11-18T10:09:22.073Z',
    demo: false,
    events: [],
    sources: [
      { name: '工作', ok: false, error: 'fetch failed' },
      { name: '汕大2026秋季课程与待办', ok: true },
      { name: '飞行计划', ok: true },
    ],
  };
}
async function build(handler, extra = {}) {
  S.clearFetchCache();
  return S.buildSnapshot(cfg(), { now: NOW, retryDelayMs: 0, fetchImpl: fetchFrom(handler), ...extra });
}

test('a partial fetch failure does not replace a valid schedule', async () => {
  const snap = await build(url => url.endsWith('/work') ? Promise.reject(new Error('fetch failed')) : response(EMPTY_ICS));
  assert.equal(snap.events.length, 0);
  assert.equal(snap.sources.find(source => source.name === '工作').state, 'failed');
  assert.equal(snap.sources.filter(source => source.state === 'empty').length, 2);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'schedule-publish-'));
  const file = path.join(dir, 'schedule.json');
  const prior = previousGood();
  fs.writeFileSync(file, JSON.stringify(prior));
  const before = fs.readFileSync(file);
  const result = S.publishSnapshot(snap, prior, file);
  assert.equal(result.publish, false);
  assert.equal(result.reason, 'fetch-failed');
  assert.deepEqual(result.sources, ['工作']);
  assert.equal(fs.readFileSync(file).equals(before), true);
});

test('an empty or non-calendar body is a fetch failure, not a confirmed empty calendar', async () => {
  const snap = await build(url => url.endsWith('/work') ? response('<html>temporary error</html>') : response(EMPTY_ICS));
  const work = snap.sources.find(source => source.name === '工作');
  assert.equal(work.state, 'failed');
  assert.equal(work.ok, false);
  assert.equal(work.error, '响应不是日历数据');
  assert.equal(S.assessPublication(snap, previousGood()).reason, 'fetch-failed');
  assert.notEqual(S.assessPublication(snap, null).reason, 'confirmed-empty');
});

test('every source failing is rejected, including an HTTP error without its address', async () => {
  const snap = await build(() => { throw Object.assign(new Error('connect https://cal.example/secret-token'), { cause: { code: 'ECONNRESET' } }); });
  assert.equal(snap.sources.every(source => source.state === 'failed'), true);
  assert.equal(snap.sources[0].error, 'fetch failed (ECONNRESET)');
  assert.equal(snap.sources[0].error.includes('secret-token'), false);
  const http = await build(() => response('', 503));
  assert.equal(http.sources[0].error, 'HTTP 503');
  assert.equal(S.assessPublication(http, null).publish, false);
  assert.equal(S.assessPublication(http, null).reason, 'fetch-failed');
});

test('a transient failure can succeed on the retry and is published with its own data time', async () => {
  const calls = {};
  const snap = await build(url => {
    calls[url] = (calls[url] || 0) + 1;
    if (url.endsWith('/work') && calls[url] === 1) throw new Error('fetch failed');
    return response(ics('商务汉语精读A'));
  }, { attempts: 2 });
  assert.equal(calls['https://example.test/work'], 2);
  assert.equal(snap.status, 'ok');
  assert.equal(snap.events.length, 3);
  assert.equal(snap.dataAsOf, snap.generatedAt);
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'schedule-ok-')), 'schedule.json');
  const result = S.publishSnapshot(snap, previousGood(), file);
  assert.equal(result.publish, true);
  assert.equal(result.reason, 'ok');
  const written = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(written.status, 'ok');
  assert.equal(written.dataAsOf, NOW);
  assert.equal(written.events.length, 3);
  assert.equal(JSON.stringify(written).includes('webcal://'), false);
  assert.equal(JSON.stringify(written).includes('example.test'), false);
  assert.equal(written.sources.every(source => source.url == null), true);
});

test('a valid empty feed is distinct from a failure and can publish only when it does not erase known events', async () => {
  const snap = await build(() => response(EMPTY_ICS));
  assert.equal(snap.status, 'empty');
  assert.equal(snap.sources.every(source => source.state === 'empty' && source.ok === true), true);
  const first = S.assessPublication(snap, null);
  assert.equal(first.publish, true);
  assert.equal(first.reason, 'confirmed-empty');
  const blocked = S.assessPublication(snap, previousGood());
  assert.equal(blocked.publish, false);
  assert.equal(blocked.reason, 'abnormal-empty');
  assert.notEqual(blocked.reason, 'fetch-failed');
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'schedule-empty-')), 'schedule.json');
  fs.writeFileSync(file, '{"events":[{"calendar":"工作"}]}');
  const before = fs.readFileSync(file);
  assert.equal(S.publishSnapshot(snap, previousGood(), file).wrote, false);
  assert.equal(fs.readFileSync(file).equals(before), true);
  const fresh = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'schedule-fresh-empty-')), 'schedule.json');
  const published = S.publishSnapshot(snap, null, fresh);
  assert.equal(published.wrote, true);
  assert.equal(JSON.parse(fs.readFileSync(fresh, 'utf8')).status, 'empty');
});

test('the known bad publication is not last-known-good and cannot be replaced by another empty result', () => {
  const bad = badPublication();
  assert.equal(S.isLastKnownGood(bad), false);
  assert.equal(S.isBadEmptyPublication(bad), true);
  assert.equal(S.decideRestore(bad), 'restore');
  assert.equal(S.decideRestore(previousGood()), 'keep-current');
  assert.equal(S.referenceSnapshot(bad, null), bad);
  const empty = {
    demo: false,
    events: [],
    sources: NAMES.map(name => ({ name, ok: true, state: 'empty' })),
  };
  const decision = S.assessPublication(empty, bad);
  assert.equal(decision.publish, false);
  assert.equal(decision.reason, 'abnormal-empty');
  const good = {
    demo: false,
    generatedAt: S.KNOWN_GOOD_ARTIFACT.generatedAt,
    events: Array.from({ length: 220 }, (_, index) => ({ calendar: '工作', title: `item-${index}` })),
    sources: NAMES.map(name => ({ name, ok: true })),
  };
  assert.equal(S.isVerifiedGoodArtifact(good), true);
  const retained = S.markRetained(good);
  assert.equal(retained.status, 'retained');
  assert.equal(retained.publication, 'retained');
  assert.equal(retained.generatedAt, S.KNOWN_GOOD_ARTIFACT.generatedAt);
  assert.equal(retained.dataAsOf, retained.generatedAt);
  assert.equal(JSON.stringify(retained.events), JSON.stringify(good.events));
  assert.equal(JSON.stringify(retained.sources), JSON.stringify(good.sources));
  good.generatedAt = '2026-11-18T10:09:22.073Z';
  assert.equal(S.isVerifiedGoodArtifact(good), false);
  assert.throws(() => S.markRetained(good), /未发布/);
});

test('a smaller but non-empty successful read still publishes', async () => {
  let sent = false;
  const snap = await build(url => {
    if (url.endsWith('/work') && !sent) { sent = true; return response(ics('只保留一项')); }
    return response(EMPTY_ICS);
  });
  assert.equal(snap.events.length, 1);
  const prior = previousGood();
  prior.events.push({ calendar: '工作', title: '另一项' }, { calendar: '工作', title: '第三项' });
  assert.equal(S.assessPublication(snap, prior).publish, true);
  assert.equal(S.assessPublication(snap, prior).reason, 'ok');
});

test('one previously populated calendar becoming a valid empty feed blocks publication', async () => {
  const snap = await build(url => url.endsWith('/flight') ? response(EMPTY_ICS) : response(ics('仍然有课')));
  const prior = previousGood();
  prior.events.push({ calendar: '飞行计划', title: '原有航班' });
  const decision = S.assessPublication(snap, prior);
  assert.equal(decision.publish, false);
  assert.equal(decision.reason, 'abnormal-empty');
  assert.deepEqual(decision.sources, ['飞行计划']);
});

test('demo data does not replace a real schedule', async () => {
  S.clearFetchCache();
  const demo = await S.buildSnapshot({ timezone: 'Asia/Shanghai', showEventDetails: true, calendars: [] }, { now: NOW });
  assert.equal(demo.status, 'demo');
  assert.equal(S.assessPublication(demo, null).publish, true);
  assert.equal(S.assessPublication(demo, previousGood()).publish, false);
  assert.equal(S.assessPublication(demo, previousGood()).reason, 'demo-preserves-good');
});
