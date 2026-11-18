#!/usr/bin/env node
// 只在线上仍是 2026-11-18 18:09 的空发布时，原样放回 run 44221004787 的产物。
// 不改 schedule.json，因此数据时间仍是 10:08，不会被标成新的同步结果。
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { decideRestore, isVerifiedGoodArtifact, markRetained, KNOWN_GOOD_ARTIFACT } = require('../lib/schedule');

const LIVE_URL = 'https://wangshiyun404.github.io/schedule/data/schedule.json';

async function readLive() {
  const res = await fetch(LIVE_URL, { headers: { 'User-Agent': 'schedule-site/1.0' } });
  if (!res.ok) throw new Error(`无法核对线上课表 HTTP ${res.status}`);
  return res.json();
}

async function downloadArtifact(dest) {
  const repo = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repo || !token) throw new Error('缺少 Actions 身份，无法下载原有产物');
  const api = await fetch(`https://api.github.com/repos/${repo}/actions/artifacts/${KNOWN_GOOD_ARTIFACT.id}/zip`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'schedule-restore',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    redirect: 'manual',
  });
  if (api.status !== 302 && api.status !== 301) throw new Error(`产物下载失败 HTTP ${api.status}`);
  const location = api.headers.get('location');
  if (!location) throw new Error('产物下载失败，没有跳转');
  const file = await fetch(location, { headers: { 'User-Agent': 'schedule-restore' }, redirect: 'follow' });
  if (!file.ok) throw new Error(`产物下载失败 HTTP ${file.status}`);
  fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
}

async function main() {
  const live = await readLive();
  if (decideRestore(live) !== 'restore') {
    console.error('线上不是 18:09 的空发布。抓取失败时不改动已发布页面，也不把旧快照重新标成最新。');
    process.exit(2);
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'schedule-restore-'));
  const zip = path.join(dir, 'pages.zip');
  await downloadArtifact(zip);
  execFileSync('unzip', ['-o', zip, 'artifact.tar', '-d', dir], { stdio: 'pipe' });
  execFileSync('tar', ['-xf', path.join(dir, 'artifact.tar'), '-C', dir, './data/schedule.json'], { stdio: 'pipe' });
  const sourceFile = path.join(dir, 'data', 'schedule.json');
  const bytes = fs.readFileSync(sourceFile);
  const snapshot = JSON.parse(bytes.toString('utf8'));
  const retained = markRetained(snapshot);
  const dest = path.join(__dirname, '..', 'public', 'data', 'schedule.json');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(retained));
  const restored = JSON.parse(fs.readFileSync(dest, 'utf8'));
  const sameEvents = JSON.stringify(restored.events) === JSON.stringify(snapshot.events);
  const sameSources = JSON.stringify(restored.sources) === JSON.stringify(snapshot.sources);
  if (restored.generatedAt !== KNOWN_GOOD_ARTIFACT.generatedAt || restored.dataAsOf !== snapshot.generatedAt || restored.status !== 'retained' || restored.events.length !== KNOWN_GOOD_ARTIFACT.eventCount || !sameEvents || !sameSources || !isVerifiedGoodArtifact(snapshot)) {
    fs.rmSync(dest, { force: true });
    throw new Error('恢复后的课表与原产物不一致，已停止');
  }
  const sources = restored.sources.map(source => `${source.name}:${source.ok ? 'ok' : 'bad'}`).join(', ');
  console.log(`restored generatedAt=${restored.generatedAt} events=${restored.events.length} sources=${sources}`);
}

if (require.main === module) {
  main().catch(error => {
    const safe = ['无法核对线上课表', '产物下载失败', '产物不是已核对', '恢复后的课表', '缺少 Actions 身份'];
    console.error(safe.some(prefix => String(error.message || '').startsWith(prefix)) ? error.message : '恢复原有课表失败');
    process.exit(1);
  });
}
