#!/usr/bin/env node
// scripts/build.js — 生成 public/data/schedule.json（GitHub Actions 每 15 分钟运行一次）
const fs = require('fs');
const path = require('path');
const { loadConfig, buildSnapshot } = require('../lib/schedule');
(async () => {
  const root = path.join(__dirname, '..');
  const cfg = loadConfig(root);
  const snap = await buildSnapshot(cfg);
  // Only these explicitly requested meetings are public; retain all calendar events.
  // Match title + start so a later iCloud entry does not create a duplicate.
  const requestedMeetings = [
    {
      id: 'requested-advisor-meeting-20261023',
      title: '讨论导师在线指导会议第2次 (2026.10.23)',
      start: '2026-10-23T11:00:00.000Z', end: '2026-10-23T14:00:00.000Z',
      allDay: false, location: '线上／腾讯会议', description: '',
      calendar: '公开会议', kind: 'event', color: null, status: 'CONFIRMED',
    },
    {
      id: 'requested-teaching-meeting-20261026',
      title: '本学期第二次教研会',
      start: '2026-10-26T02:00:00.000Z', end: '2026-10-26T03:00:00.000Z',
      allDay: false, location: '桑浦山图书馆研讨室（30C）',
      description: 'AI智慧课程介绍、师德师风培训、期中考试安排。结束时间未提供，暂按1小时占位。',
      calendar: '公开会议', kind: 'event', color: null, status: 'CONFIRMED',
    },
  ];
  for (const meeting of requestedMeetings) {
    if (new Date(meeting.end) <= new Date(snap.range.from) ||
        new Date(meeting.start) >= new Date(snap.range.to)) continue;
    const existing = snap.events.find(e => e.title.trim() === meeting.title &&
      Date.parse(e.start) === Date.parse(meeting.start) && e.status !== 'CANCELLED');
    if (existing) {
      // Apply only the approved public fields, never publish private joining details.
      existing.location = meeting.location;
      existing.description = meeting.description;
    } else {
      snap.events.push(meeting);
    }
  }
  snap.events.sort((a, b) => a.start.localeCompare(b.start));
  const outDir = path.join(root, 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'schedule.json'), JSON.stringify(snap));
  const bad = snap.sources.filter(s => !s.ok);
  console.log(`events=${snap.events.length} sources=${snap.sources.map(s => `${s.name}:${s.ok ? 'ok' : 'FAIL ' + s.error}`).join(', ')}`);
  if (bad.length === snap.sources.length && !snap.demo) { console.error('所有日历都读取失败'); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
