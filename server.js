#!/usr/bin/env node
// server.js — 本地预览：定时生成 public/data/schedule.json 并提供静态文件。线上由 GitHub Pages 托管，不需要此服务。
const express = require('express');
const fs = require('fs');
const path = require('path');
const { loadConfig, buildSnapshot } = require('./lib/schedule');

const PORT = process.env.PORT || 8000;
const OUT = path.join(__dirname, 'public', 'data', 'schedule.json');

async function rebuild() {
  try {
    const cfg = loadConfig(__dirname);
    const snap = await buildSnapshot(cfg);
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(snap));
  } catch (e) { console.error('rebuild failed:', e.message); }
}

const app = express();
app.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use(express.static(path.join(__dirname, 'public')));
app.get('/api/health', (_req, res) => res.json({ ok: true }));

rebuild().then(() => {
  const cfg = loadConfig(__dirname);
  setInterval(rebuild, (cfg.refreshSeconds || 60) * 1000);
  app.listen(PORT, '0.0.0.0', () => console.log(`schedule-site listening on ${PORT}`));
});
