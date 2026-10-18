# 王世赟 · 日程与课程

个人公开日程页，数据来自 Mac「日历」中设为公共的 iCloud 日历（webcal 链接），由 GitHub Actions 每 15 分钟拉取一次并发布到 GitHub Pages。

- `scripts/build.js`：读取 ICS → 展开重复事件 → 分类（上课 / 出差 / 事项）→ 生成 `public/data/schedule.json`
- `public/`：静态页面；状态卡与空闲时段在浏览器端计算
- `config.json`：显示设置（姓名、简介、可预约时间等）；日历地址通过仓库 Secret `CALENDARS_JSON` 注入，不入库
- 本地预览：`cp config.local.example.json config.local.json` 填入链接后 `npm install && npm start`

## 站点结构（2026-10 起为多页个人主页）

| 页面 | 文件 | 内容来源 |
| --- | --- | --- |
| 首页 | `public/index.html` | `public/content.js`（简介、研究方向）+ `data/schedule.json`（今日概览、本学期课程） |
| 研究与项目 | `public/research.html` | `public/content.js` 的 `researchAreas` / `projects` / `publications` |
| 教学 | `public/teaching.html` | `content.js` 的 `courses`（课程简介）+ 日历里的上课时间 |
| 日程 | `public/schedule.html` | 完全由日历自动同步（原来的日程页） |

**更新网站文字只需编辑 `public/content.js`**，提交后 GitHub Actions 会自动重新发布。
