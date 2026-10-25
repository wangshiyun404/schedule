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
