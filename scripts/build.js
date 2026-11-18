#!/usr/bin/env node
// scripts/build.js — 生成 public/data/schedule.json。
// 任一来源抓取失败，或上次有事项的来源突然变成空日历时，不覆盖已发布的数据。
const fs = require('fs');
const path = require('path');
const { loadConfig, buildSnapshot, publishSnapshot, referenceSnapshot } = require('../lib/schedule');

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

async function remoteSnapshot() {
  const url = process.env.SCHEDULE_PREVIOUS_URL;
  if (!url) return null;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'schedule-site/1.0' } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

function failureText(result) {
  const names = (result.sources || []).join('、') || '日历';
  if (result.reason === 'abnormal-empty') return `${names}返回了空日历，但上次有效课表里有事项。这和抓取失败不同，仍不发布，避免空结果覆盖有效数据。`;
  if (result.reason === 'demo-preserves-good') return '没有可用的日历配置。已保留上次有效课表，不用演示数据覆盖。';
  return `${names}抓取失败。这次不会发布，已保留上次有效课表。`;
}

(async () => {
  const root = path.join(__dirname, '..');
  const cfg = loadConfig(root);
  if (process.env.GITHUB_ACTIONS && (!cfg.calendars || !cfg.calendars.length)) {
    console.error('未配置日历，拒绝用演示数据覆盖公开课表');
    process.exit(1);
  }
  const snap = await buildSnapshot(cfg, { retryDelayMs: 1000 });
  const outFile = path.join(root, 'public', 'data', 'schedule.json');
  const previous = referenceSnapshot(readJson(outFile), await remoteSnapshot());
  const result = publishSnapshot(snap, previous, outFile);
  const sources = snap.sources.map(source => {
    const detail = source.state === 'failed' ? `FAIL ${source.error}` : source.state;
    const count = typeof source.eventCount === 'number' ? ` events=${source.eventCount}` : '';
    return `${source.name}:${detail}${count}`;
  }).join(', ');
  console.log(`events=${snap.events.length} status=${result.status} publish=${result.publish} reason=${result.reason} dataAsOf=${snap.dataAsOf} sources=${sources}`);
  if (!result.publish) {
    console.error(failureText(result));
    process.exit(1);
  }
})().catch(() => {
  console.error('构建失败，未发布课表');
  process.exit(1);
});
