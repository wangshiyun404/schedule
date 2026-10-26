const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../public/calendar-model');
const e = (id, start, end, extra = {}) => ({ id, title: id, start, end, kind: 'event', ...extra });
test('Beijing dates are independent of the viewer timezone', () => {
 assert.equal(M.key('2026-10-25T16:30:00Z'), '2026-10-26');
 assert.equal(M.key(M.monday('2026-10-25T16:30:00Z')), '2026-10-26');
 assert.equal(M.key(M.nextMonth(M.parseDay('2026-12-31'), 1)), '2027-01-01');
});
test('all-day and multi-day events appear on every occupied day, excluding the end boundary', () => {
 const list = [e('all-day', '2026-10-25T16:00:00Z', '2026-10-27T16:00:00Z', { allDay: true }), e('trip', '2026-10-31T01:00:00Z', '2026-11-02T04:00:00Z')];
 assert.equal(M.inDay(list, M.parseDay('2026-10-27')).length, 1);
 assert.equal(M.inDay(list, M.parseDay('2026-10-28')).length, 0);
 assert.equal(M.dayTime(list[1], M.parseDay('2026-11-01')), '00:00–24:00 · 跨日');
 assert.equal(M.dayTime(list[1], M.parseDay('2026-11-02')), '00:00–12:00 · 跨日');
 assert.equal(M.fullTime(list[0]), '10月26日—10月27日 · 全天');
});
test('cancelled and exact duplicated records are removed, simultaneous different events are retained', () => {
 const a=e('thesis','2026-10-23T11:00:00Z','2026-10-23T14:00:00Z');
 const b=e('other','2026-10-23T11:00:00Z','2026-10-23T12:00:00Z');
 const list=M.normalize([a,{...a,id:'copy'},b,{...b,id:'cancel',title:'cancel',status:'CANCELLED'}]);
 assert.equal(list.length,2);assert.equal(M.conflicts(list).size,2);
});
test('back-to-back meetings do not conflict and group meetings are distinct from courses', () => {
 assert.equal(M.conflicts([e('a','2026-10-23T11:00:00Z','2026-10-23T12:00:00Z'),e('b','2026-10-23T12:00:00Z','2026-10-23T13:00:00Z')]).size,0);
 assert.equal(M.normalize([e('国际学院本科毕业论文组会','2026-10-23T11:00:00Z','2026-10-23T12:00:00Z',{kind:'course'})])[0].category,'meeting');
});

test('a real rescheduled lesson remains a course while rescheduling paperwork does not', () => {
 assert.equal(M.normalize([e('调课：商务汉语精读（A）','2026-10-08T00:00:00Z','2026-10-08T01:40:00Z')])[0].category,'course');
 assert.equal(M.normalize([e('核对10月8日获批调课通知与课堂材料','2026-10-06T02:00:00Z','2026-10-06T02:20:00Z')])[0].category,'other');
});

test('upcoming agenda keeps every category, empty dates and each day of a trip', () => {
 const list = M.normalize([
  e('组会', '2026-10-25T10:00:00+08:00', '2026-10-25T11:00:00+08:00'),
  e('汉语读写（A）', '2026-10-26T14:00:00+08:00', '2026-10-26T15:40:00+08:00'),
  e('提交材料', '2026-10-26T16:00:00+08:00', '2026-10-26T17:00:00+08:00'),
  e('出行', '2026-10-27T09:00:00+08:00', '2026-10-29T00:00:00+08:00', {kind:'trip'}),
  e('范围之外', '2026-10-30T09:00:00+08:00', '2026-10-30T10:00:00+08:00')
 ]);
 const days = M.dailyAgenda(list, '2026-10-25T20:00:00+08:00', 5);
 assert.deepEqual(days.map(d => M.key(d.date)), ['2026-10-25','2026-10-26','2026-10-27','2026-10-28','2026-10-29']);
 assert.deepEqual(days.map(d => d.items.length), [1,2,1,1,0]);
 assert.deepEqual([...new Set(days.flatMap(d => d.items.map(e => e.category)))].sort(), ['course','meeting','other','trip']);
 assert.equal(M.weekdays[M.parts(days[1].date).wd], '周一');
 assert.equal(M.dayTime(days[3].items[0], days[3].date), '00:00–24:00 · 跨日');
 assert.equal(M.dailyAgenda(list, days[0].date).length, 30);
});

test('exam paper preparation stays work preparation even with a course source label', () => {
 const span = ['2026-10-27T06:00:00Z','2026-10-27T09:00:00Z'];
 for (const title of ['命题：三门汉语课期中、期末试卷','命题：汉语读写（A）期中试卷','商务汉语精读（A）期末出卷']) {
  assert.equal(M.normalize([e(title,...span,{kind:'course'})])[0].category,'other');
 }
 assert.equal(M.normalize([e('期中考试：汉语读写（A）',...span,{kind:'course'})])[0].category,'course');
});

test('timeline gives short and overlapping events enough room without moving their time boundaries', () => {
 const blocks = [
  {start:600,end:630,height:92},
  {start:615,end:660,height:180},
  {start:630,end:660,height:110},
  {start:1375,end:1380,height:96}
 ];
 const axis=M.timelineAxis(480,1380,blocks);
 for (const b of blocks) assert.ok(axis.position(b.end)-axis.position(b.start)>=b.height-0.001);
 for(let minute=481;minute<=1380;minute++) assert.ok(axis.position(minute)>axis.position(minute-1));
 assert.equal(axis.position(blocks[0].end),axis.position(blocks[2].start));
 assert.ok(Math.abs(axis.position(540)-76)<0.001); // Empty hours keep their normal size.
 assert.equal(axis.position(1380),axis.height);
});

test('timeline uses the largest text requirement across days and includes midnight boundaries', () => {
 const axis=M.timelineAxis(0,1440,[{start:600,end:630,height:90},{start:600,end:630,height:180},{start:0,end:15,height:100},{start:1425,end:1440,height:110}]);
 assert.ok(Math.abs(axis.position(630)-axis.position(600)-180)<0.001);
 assert.ok(axis.position(15)>=100);
 assert.ok(axis.height-axis.position(1425)>=110-0.001);
 assert.equal(axis.position(-1),0);
 assert.equal(axis.position(1441),axis.height);
 const empty=M.timelineAxis(480,1380,[]);
 assert.ok(Math.abs(empty.height-15*76)<0.001);
});
