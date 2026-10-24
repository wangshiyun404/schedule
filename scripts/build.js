#!/usr/bin/env node
// scripts/build.js — 生成 public/data/schedule.json（GitHub Actions 每 15 分钟运行一次）
const fs = require('fs');
const path = require('path');
const { loadConfig, buildSnapshot } = require('../lib/schedule');
(async () => {
  const root = path.join(__dirname, '..');
  const cfg = loadConfig(root);
  const snap = await buildSnapshot(cfg);
  const outDir = path.join(root, 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'schedule.json'), JSON.stringify(snap));
  const bad = snap.sources.filter(s => !s.ok);
  console.log(`events=${snap.events.length} sources=${snap.sources.map(s => `${s.name}:${s.ok ? 'ok' : 'FAIL ' + s.error}`).join(', ')}`);
  if (bad.length === snap.sources.length && !snap.demo) { console.error('所有日历都读取失败'); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
