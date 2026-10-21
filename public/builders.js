/* =====================================================================
   AI 信源名单（微信生态版 Follow Builders）—— 直接编辑这个文件即可更新。
   字段说明：
     name      账号名
     mp        公众号：'yes' 已核实 / 'check' 需微信内确认 / 省略表示无
     vc        视频号：'yes' / 'check' / 省略
     vcName    视频号显示名（与账号名不同时填写）
     role      身份与在做的事
     why       为什么值得关注
     kind      'builder' 一线建造者 / 'grey' 既动手也做内容 / 'media' 媒体资讯
     src       来源 [{ label, url }]
   ===================================================================== */
window.BUILDERS = {
  updated: '2026-10-21',
  method: {
    origin: '张咋啦（Zara Zhang）的开源项目 follow-builders 只追踪三类信源：26 位在 X 上亲手做产品的 builder、6 档深度播客、2 个官方技术博客。筛选标准只有一条——这个人是不是在亲手建造什么，而不是搬运、包装资讯的网红号。',
    mapping: [
      { from: 'X 上的 builder（创始人 / 产品经理 / 工程师 / 研究员）', to: '个人公众号、个人视频号', rule: '本人有在售产品、开源项目、在研模型或一线工程实践，内容以一手经验为主' },
      { from: '深度播客（Latent Space 等）', to: '深度访谈播客在微信里的公众号 / 视频号', rule: '请 builder 本人上麦长谈，而不是二手转述' },
      { from: '官方技术博客（Anthropic Engineering）', to: '模型厂商、研究机构、大厂技术团队官方号', rule: '由做模型、做系统的团队直接发布' },
      { from: '（排除）influencer', to: '资讯 / 媒体号', rule: '以速递、解读、搬运为主，放入「背景雷达」作对照' }
    ],
    sources: [
      { label: 'GitHub · zarazhangrui/follow-builders', url: 'https://github.com/zarazhangrui/follow-builders' },
      { label: '曾斌：Follow Builders, Not Influencers', url: 'https://zengbin.cn/blog/follow-builders-not-influencers' },
      { label: '掘金 · 中文AI公众号Top100', url: 'https://juejin.cn/post/7639935548959211561' },
      { label: 'AI跟我学 · 12个AI公众号', url: 'https://aigwx.org/ai-intro/ai-media-recommendation/' }
    ]
  },
  groups: [
    {
      "id": "founders",
      "title": "一线 Builder / 创业者个人号",
      "sub": "对应 X 上的创始人、工程师：本人在做产品或亲手实测，内容以一手经验为主。",
      "items": [
        {
          "name": "数字生命卡兹克",
          "mp": "yes",
          "kind": "builder",
          "role": "卡兹克（连续创业者，AI HOT 创始人）",
          "why": "亲手做产品、实测国产模型，复盘真实",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "宝玉AI（宝玉的分享）",
          "mp": "yes",
          "kind": "builder",
          "role": "宝玉 @dotey",
          "why": "每日精读英文一手资料并加独立点评，中文 AI 圈头号信源",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "歸藏的AI工具箱",
          "mp": "yes",
          "kind": "builder",
          "role": "歸藏 @op7418",
          "why": "AIGC 图像视频工具实测横评，审美在线",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "李继刚",
          "mp": "yes",
          "kind": "builder",
          "role": "李继刚",
          "why": "Prompt 方法论原创者，有独立思想体系",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "一泽Eze",
          "mp": "yes",
          "kind": "builder",
          "role": "一泽",
          "why": "AI 工作流/智能体搭建的实战拆解",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "十字路口Crossir",
          "mp": "yes",
          "kind": "builder",
          "role": "Koji 等（AI 产品人）",
          "why": "访谈一线 AI 创业者与产品人",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "饼干哥哥AGI",
          "mp": "yes",
          "kind": "builder",
          "role": "饼干哥哥",
          "why": "AI 应用落地实操与经验",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "苍何",
          "mp": "yes",
          "kind": "builder",
          "role": "苍何（开发者）",
          "why": "开发者视角的 AI 工具与编程实践",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "洛小山",
          "mp": "yes",
          "kind": "grey",
          "role": "洛小山",
          "why": "AI 产品体验与轻实操",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "AI异类弗兰克",
          "mp": "yes",
          "kind": "grey",
          "role": "弗兰克",
          "why": "可执行的 AI 效率方法与工具组合",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "卡尔的AI沃茨",
          "mp": "yes",
          "kind": "grey",
          "role": "卡尔",
          "why": "可复制的 AI 工作流",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "袋鼠帝AI客栈",
          "mp": "yes",
          "kind": "grey",
          "role": "袋鼠帝",
          "why": "工具、教程、案例，偏动手",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "开发者阿橙",
          "mp": "yes",
          "kind": "builder",
          "role": "阿橙",
          "why": "AI 编程与应用开发实战",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "莫理",
          "mp": "yes",
          "kind": "grey",
          "role": "莫理",
          "why": "个人 AI 使用经验",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        }
      ]
    },
    {
      "id": "labs",
      "title": "大模型公司 / 实验室官方号",
      "sub": "对应 Anthropic Engineering、Claude Blog：由做模型的团队直接发布。",
      "items": [
        {
          "name": "DeepSeek（深度求索）",
          "mp": "yes",
          "kind": "builder",
          "role": "杭州深度求索",
          "why": "模型发布、技术报告一手信息",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "月之暗面 Kimi",
          "mp": "yes",
          "kind": "builder",
          "role": "月之暗面",
          "why": "Kimi 模型与产品一手更新",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "智谱",
          "mp": "yes",
          "kind": "builder",
          "role": "智谱 AI",
          "why": "GLM 系列、智能体与开源动态",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "通义实验室",
          "mp": "yes",
          "kind": "builder",
          "role": "阿里巴巴通义实验室",
          "why": "Qwen 系列模型与技术实践",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "MiniMax 稀宇科技",
          "mp": "check",
          "kind": "builder",
          "role": "MiniMax",
          "why": "海螺/abab 等模型产品发布",
          "src": [
            {
              "label": "搜狗微信搜索",
              "url": "https://weixin.sogou.com/weixin?type=1&query=MiniMax%E7%A8%80%E5%AE%87%E7%A7%91%E6%8A%80"
            }
          ]
        },
        {
          "name": "阶跃星辰",
          "mp": "check",
          "kind": "builder",
          "role": "阶跃星辰",
          "why": "Step 系列多模态模型",
          "src": [
            {
              "label": "搜狗微信搜索",
              "url": "https://weixin.sogou.com/weixin?type=1&query=%E9%98%B6%E8%B7%83%E6%98%9F%E8%BE%B0"
            }
          ]
        },
        {
          "name": "豆包大模型 / 字节跳动Seed",
          "mp": "check",
          "kind": "builder",
          "role": "字节跳动 Seed 团队",
          "why": "Seed 研究成果与豆包模型",
          "src": [
            {
              "label": "搜狗微信搜索",
              "url": "https://weixin.sogou.com/weixin?type=1&query=%E5%AD%97%E8%8A%82%E8%B7%B3%E5%8A%A8Seed"
            }
          ]
        },
        {
          "name": "文心大模型",
          "mp": "yes",
          "kind": "builder",
          "role": "百度",
          "why": "文心模型与生态",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "腾讯混元",
          "mp": "check",
          "kind": "builder",
          "role": "腾讯",
          "why": "混元模型发布与开源",
          "src": [
            {
              "label": "搜狗微信搜索",
              "url": "https://weixin.sogou.com/weixin?type=1&query=%E8%85%BE%E8%AE%AF%E6%B7%B7%E5%85%83"
            }
          ]
        },
        {
          "name": "TRAE.ai",
          "mp": "yes",
          "kind": "builder",
          "role": "字节跳动 TRAE",
          "why": "AI IDE / AI 编程工具官方",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "ima.copilot",
          "mp": "yes",
          "kind": "builder",
          "role": "腾讯 ima",
          "why": "AI 知识库产品官方",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        }
      ]
    },
    {
      "id": "research",
      "title": "研究者 / 技术深度号",
      "sub": "开源、教程与深度长文，偏动手与系统学习。",
      "items": [
        {
          "name": "Datawhale",
          "mp": "yes",
          "kind": "grey",
          "role": "Datawhale 开源社区",
          "why": "开源课程与学习路线，动手派",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "GitHubDaily",
          "mp": "yes",
          "kind": "grey",
          "role": "GitHubDaily",
          "why": "每日 AI 开源项目发现",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "逛逛GitHub",
          "mp": "yes",
          "kind": "grey",
          "role": "逛逛GitHub",
          "why": "开源工具与模型应用发现",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "JackCui",
          "mp": "yes",
          "kind": "grey",
          "role": "Jack Cui",
          "why": "机器学习与工程教程",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "开源星探",
          "mp": "yes",
          "kind": "grey",
          "role": "开源星探",
          "why": "AI 开源项目灵感",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "脑极体",
          "mp": "yes",
          "kind": "grey",
          "role": "脑极体",
          "why": "宏观技术与产业叙事，深度长文",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "赛博禅心",
          "mp": "yes",
          "kind": "grey",
          "role": "赛博禅心",
          "why": "技术+人文的 AI 观念思考",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        }
      ]
    },
    {
      "id": "product",
      "title": "AI 产品 / 创业 / 投资视角",
      "sub": "创始人访谈、产品方法论与早期项目观察。",
      "items": [
        {
          "name": "Founder Park",
          "mp": "yes",
          "kind": "builder",
          "role": "极客公园旗下",
          "why": "大量 AI 创始人一手访谈与闭门分享",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "海外独角兽",
          "mp": "check",
          "kind": "builder",
          "role": "拾象科技",
          "why": "海外 AI 公司与 Agent 深度研究",
          "src": [
            {
              "label": "搜狗微信搜索",
              "url": "https://weixin.sogou.com/weixin?type=1&query=%E6%B5%B7%E5%A4%96%E7%8B%AC%E8%A7%92%E5%85%BD"
            }
          ]
        },
        {
          "name": "Z Potentials",
          "mp": "yes",
          "kind": "grey",
          "role": "Z Potentials",
          "why": "AI 创业者访谈与早期项目",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "01Founder",
          "mp": "yes",
          "kind": "grey",
          "role": "01Founder",
          "why": "面向创业者的 AI 商业机会",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "AI产品黄叔",
          "mp": "yes",
          "kind": "grey",
          "role": "黄叔",
          "why": "AI 产品方法论与案例",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "AI产品阿颖",
          "mp": "yes",
          "kind": "grey",
          "role": "阿颖",
          "why": "AI 产品设计与岗位成长",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "AI产品银海",
          "mp": "yes",
          "kind": "grey",
          "role": "银海",
          "why": "需求拆解与 AI 应用案例",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "AGENT橘",
          "mp": "yes",
          "kind": "grey",
          "role": "AGENT橘",
          "why": "智能体落地与自动化流程",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "AGI Hunt",
          "mp": "yes",
          "kind": "grey",
          "role": "AGI Hunt",
          "why": "新产品、新项目猎手",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "新皮层NewNew",
          "mp": "yes",
          "kind": "grey",
          "role": "新皮层",
          "why": "AI 时代人机协作与新认知",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "阑夕",
          "mp": "yes",
          "kind": "grey",
          "role": "阑夕",
          "why": "老互联网评论员，跳出技术看 AI",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        }
      ]
    },
    {
      "id": "radar",
      "title": "媒体 / 资讯（聚合型，非 builder）",
      "sub": "按张咋啦的原则属于 influencer / 媒体一侧，建议只扫标题，作对照。",
      "items": [
        {
          "name": "机器之心",
          "mp": "yes",
          "kind": "media",
          "role": "机器之心",
          "why": "日更前沿资讯与论文解读（聚合）",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "量子位",
          "mp": "yes",
          "kind": "media",
          "role": "量子位",
          "why": "日更 AI 新闻（聚合）",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "新智元",
          "mp": "check",
          "kind": "media",
          "role": "新智元",
          "why": "前沿资讯（聚合，标题偏夸张）",
          "src": [
            {
              "label": "搜狗微信搜索",
              "url": "https://weixin.sogou.com/weixin?type=1&query=%E6%96%B0%E6%99%BA%E5%85%83"
            }
          ]
        },
        {
          "name": "硅星人",
          "mp": "yes",
          "kind": "media",
          "role": "硅星人",
          "why": "硅谷与国内科技报道（聚合）",
          "src": [
            {
              "label": "AI跟我学 · 12个AI公众号",
              "url": "https://aigwx.org/ai-intro/ai-media-recommendation/"
            }
          ]
        },
        {
          "name": "APPSO",
          "mp": "yes",
          "kind": "media",
          "role": "爱范儿",
          "why": "AI 产品体验报道（媒体）",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "甲子光年",
          "mp": "yes",
          "kind": "media",
          "role": "甲子光年",
          "why": "科技产业研究（媒体）",
          "src": [
            {
              "label": "掘金 · 中文AI公众号Top100",
              "url": "https://juejin.cn/post/7639935548959211561"
            }
          ]
        },
        {
          "name": "AI科技评论",
          "mp": "check",
          "kind": "media",
          "role": "雷峰网",
          "why": "学术会议与研究者报道（媒体）",
          "src": [
            {
              "label": "搜狗微信搜索",
              "url": "https://weixin.sogou.com/weixin?type=1&query=AI%E7%A7%91%E6%8A%80%E8%AF%84%E8%AE%BA"
            }
          ]
        }
      ]
    }
  ],
  missing: {
    "title": "视频号说明",
    "text": "多数上述账号（如数字生命卡兹克、歸藏、Founder Park、量子位、机器之心）同名运营视频号，但视频号缺少公开网页索引，本次未逐一核实，暂不单列；「公众号待确认」的条目仅有搜狗微信搜索链接，请在微信内搜索确认。",
    "src": [
      {
        "label": "搜狗微信搜索",
        "url": "https://weixin.sogou.com/"
      }
    ]
  },
  howto: [
    '订阅：在微信「搜一搜」直接搜账号名；公众号可加入「合集」或星标，视频号可「关注」并设为常看。',
    '做成简报：用 WeWe RSS / RSSHub 把公众号转成 RSS，再接到 follow-builders 同款的 agent 工作流（如 OpenClaw、Claude Code 定时任务）生成中文日报。',
    '现成聚合：BestBlogs 已按优先级收录上述大部分公众号；followaibuilders.com 也开始收录微信公众号来源。',
    '维护原则：每季度清一次关注列表，只问一个问题——这个号最近三个月有没有亲手做出新东西？'
  ]
};
