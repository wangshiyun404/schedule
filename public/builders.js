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
      { label: 'BestBlogs 公众号订阅源', url: 'https://www.ginonotes.com/posts/bestblogs-sources-part1-from-wechat' },
      { label: 'AI百宝箱 · AI 官方公众号目录', url: 'https://www.wangzhidaquan.com/accounts/' }
    ]
  },
  groups: [
    {
      id: 'founders', title: '创始人 / 产品创业者', sub: '对应 X 上 Guillermo Rauch、Amjad Masad 这一类：边做产品边讲为什么这样做。',
      items: [
        { name: '刘小排 r', mp: 'yes', kind: 'builder', role: 'AI 产品创始人，公开 building in public，产品 Raphael AI、AnyVoice、Fast3D。', why: '典型的「边做边讲」，产品决策与增长数据一手披露。', src: [{ label: 'followaibuilders', url: 'https://followaibuilders.com/zh/builders/bourneliu66' }, { label: 'BestBlogs', url: 'https://www.ginonotes.com/posts/bestblogs-sources-part1-from-wechat' }] },
        { name: '土猛的员外', mp: 'yes', kind: 'builder', role: '卢向东，TorchV（萌嘉科技）CEO，做企业级知识库、RAG 与 Agent 产品。', why: 'ToB 大模型落地的实战记录，少见的「卖出去了」的视角。', src: [{ label: '53AI 作者介绍', url: 'https://www.53ai.com/news/2024070251906' }] },
        { name: 'AI 产品阿颖', mp: 'yes', kind: 'builder', role: 'AI 创业者、聚创稻壳 CEO，产品含聚稻全能扫描王、试卷还原等，发起 AI Maker Summit。', why: '产品方法论加真实案例拆解，往返硅谷与北京。', src: [{ label: '活动家介绍', url: 'https://m.huodongjia.com/event-1977822651.html' }] },
        { name: '向阳乔木推荐看', mp: 'yes', kind: 'builder', role: '乔向阳，AI 创作者、连续创业者，做过 AI 产品经理，有开源项目与工作流工具。', why: '产品感强，AI 编程、GEO、工作流实操。', src: [{ label: 'NextToken 人物页', url: 'https://nexttoken.tv/wiki/people/xiangyang-qiaomu' }] },
        { name: '王建硕', mp: 'yes', kind: 'builder', role: '百姓网创始人，近年深度投入 AI 与教育。', why: '老一代产品人转型 AI 的一线思考。', src: [{ label: '腾讯新闻', url: 'https://news.qq.com/rain/a/20230223A05C9O00' }] },
        { name: '傅盛', mp: 'yes', vc: 'yes', vcName: '傅盛讲AI', kind: 'builder', role: '猎豹移动创始人，推动公司 AI 智能体产品。', why: '创始人本人出镜讲 AI 落地，视频号更新活跃。', src: [{ label: '小宇宙', url: 'https://www.xiaoyuzhoufm.com/episode/69b20e9884bce022f9ff39d7' }] },
        { name: '周鸿祎', vc: 'check', kind: 'grey', role: '360 创始人，360 研发智脑大模型与 AI 产品，在视频号开 AI 课直播。', why: '大厂创始人一手观点，但营销色彩重，自行取舍。', src: [{ label: '新华网', url: 'http://www.news.cn/food/20240329/0f02d3f23c0c42d6a5dc9f88bac0969c/c.html' }] },
        { name: '李自然说', mp: 'yes', vc: 'check', kind: 'builder', role: '李自然，连续创业者、AI 内容创作者，做 AI 资讯速览与论文简报站点。', why: '创业者视角的科技与商业长谈。', src: [{ label: '虎嗅', url: 'https://www.huxiu.com/article/4841362.html' }] },
        { name: '稚晖君', vc: 'check', kind: 'builder', role: '彭志辉，智元机器人联合创始人，硬件与机器人研发。', why: '具身智能一线 builder，视频以实作为主。', src: [{ label: '博客园转载', url: 'https://www.cnblogs.com/wujianming-110117/p/19300206' }] }
      ]
    },
    {
      id: 'indie', title: '独立开发者 / 一人公司', sub: '对应 Peter Steinberger 这一类：时间线全是实战，哪里好用、哪里翻车。',
      items: [
        { name: '艾逗笔', mp: 'yes', kind: 'builder', role: 'idoubi，前腾讯后台工程师，独立开发者，作品 ThinkAny、ShipAny、MCP.so、WorkAny。', why: '两年上线 20+ AI 应用，Agent Infra 方向一手经验。', src: [{ label: 'idoubi 主页', url: 'https://idoubi.ai/zh' }, { label: '掘金', url: 'https://juejin.cn/post/7302993899107155968' }] },
        { name: '哥飞', mp: 'yes', kind: 'builder', role: '出海 AI 工具创业者、SEO 实践者，公众号 500+ 篇免费出海教程。', why: 'followaibuilders 唯一标注公众号来源的中文 builder。', src: [{ label: 'followaibuilders', url: 'https://followaibuilders.com/builders' }, { label: 'X', url: 'https://x.com/gefei55' }] },
        { name: '花叔', mp: 'yes', kind: 'builder', role: '不会写代码的独立开发者，所有产品由 AI 写成；女娲.skill（GitHub 20k+ stars）、小猫补光灯。', why: 'Vibe coding 做出真实产品的样本。', src: [{ label: '花叔主页', url: 'https://www.huasheng.ai/' }] },
        { name: '浮之静', mp: 'yes', kind: 'builder', role: 'lencx，开发者，作品 Noi 等。', why: 'BestBlogs 列为「高」优先级的个人号，工具与产品思考一手。', src: [{ label: 'X', url: 'https://x.com/lencx_' }] },
        { name: 'Draco 正在 VibeCoding', mp: 'yes', kind: 'builder', role: 'Vibe Coding 与一人公司「打怪升级路」。', why: '过程公开，适合观察个体开发者路径。', src: [{ label: 'BestBlogs 源文件', url: 'https://github.com/ginobefun/BestBlogs/blob/main/posts/bestblogs_sources_wechat_part1.md' }] },
        { name: '卡尔的 AI 沃茨', mp: 'yes', kind: 'builder', role: '有大模型研发经历，发起 GoodCase，维护 AI 视频提示词与 Skill 开源项目。', why: '「AI 界手替」，实操密度高。', src: [{ label: 'awesome-seedance', url: 'https://github.com/LearnPrompt/awesome-seedance' }] }
      ]
    },
    {
      id: 'eng', title: '工程 / 研究一线', sub: '对应 Karpathy、Amanda Askell 这一类：写自己正在做的系统与研究。',
      items: [
        { name: 'zartbot', mp: 'yes', kind: 'builder', role: '渣B，AI 算力、网络与基础设施工程分析。', why: '国内少有的 Infra 层一手硬核分析。', src: [{ label: '53AI 转载', url: 'https://www.53ai.com/news/LargeLanguageModel/2025073073861' }] },
        { name: 'AI 闲谈', mp: 'yes', kind: 'builder', role: '跟进 AI Infra、GenAI 最新发展。', why: '工程视角而非资讯视角。', src: [{ label: 'BestBlogs', url: 'https://www.ginonotes.com/posts/bestblogs-sources-part1-from-wechat' }] },
        { name: 'NLP工作站（刘聪NLP）', mp: 'yes', kind: 'builder', role: '刘聪，NLP 工程师，问答、检索、预训练模型，有开源模型。名称存在两种写法。', why: '研究者自己写自己做的东西。', src: [{ label: 'GitHub liucongg', url: 'https://github.com/liucongg' }] },
        { name: 'AI 大模型应用实践', mp: 'yes', kind: 'builder', role: '《基于大模型的 RAG 应用开发与优化》《MCP 原理揭秘与开发指南》作者，ToB 为主。', why: '书作者级别的系统化工程内容。', src: [{ label: 'BestBlogs', url: 'https://www.ginonotes.com/posts/bestblogs-sources-part1-from-wechat' }] },
        { name: '特工宇宙', mp: 'yes', kind: 'grey', role: '专注 Agent 的研发团队加媒体，作者署名特工少女。', why: 'Agent 方向既做研发又做内容。', src: [{ label: '官网', url: 'https://www.agent-universe.com/' }] }
      ]
    },
    {
      id: 'prompt', title: 'Prompt / Agent 实践者', sub: '灰区：既动手也做内容。按张咋啦的原则偏 influencer 一侧，但有自建工具或开源框架。',
      items: [
        { name: '宝玉AI', mp: 'yes', kind: 'grey', role: '宝玉（@dotey），维护 baoyu-skills（23.8k stars），AI 工程与提示工程实践。', why: '中文 AI 圈一手翻译加自建工具，最接近「builder 型创作者」。', src: [{ label: 'baoyu.ai', url: 'https://baoyu.ai/' }, { label: 'Mind Quality', url: 'https://www.mindquality.org/ai-stack/' }] },
        { name: '歸藏的 AI 工具箱', mp: 'yes', vc: 'yes', vcName: '歸藏2079', kind: 'grey', role: '产品设计师，做 CodePilot、开源 Skills、Prompt 库。', why: '视觉生成与 AI 编程双栖，教程可直接复现。', src: [{ label: 'NextToken 人物页', url: 'https://nexttoken.tv/wiki/people/guizang' }] },
        { name: '李继刚', mp: 'yes', kind: 'grey', role: 'Reader. Thinker. Prompter.，提示词创作者。', why: '提示词方法论原创度高，但不做产品，偏创作者。', src: [{ label: 'BestBlogs', url: 'https://www.ginonotes.com/posts/bestblogs-sources-part1-from-wechat' }, { label: 'X', url: 'https://x.com/lijigang' }] },
        { name: '云中江树', mp: 'yes', kind: 'builder', role: 'LangGPT 结构化提示词框架作者。', why: '有开源框架在手，Prompt 方向的 builder。', src: [{ label: 'LangGPT 仓库', url: 'https://github.com/langgptai/LangGPT' }] },
        { name: '一泽 Eze', mp: 'yes', kind: 'grey', role: '产品从业者、Prompt Engineer，专注 AI 智能体。', why: '提示词框架与模型测试。', src: [{ label: 'X', url: 'https://x.com/eze_is_1' }] },
        { name: 'AI 产品黄叔', mp: 'yes', kind: 'grey', role: '用 AI 做选题雷达、微信自动 Agent 等项目，同时经营课程与社群。', why: '动手实践多，但带课程推广，自行取舍。', src: [{ label: '53AI', url: 'https://www.53ai.com/news/LargeLanguageModel/2026052260982.html' }] },
        { name: '玉树芝兰', mp: 'yes', kind: 'builder', role: '王树义，大学教师、研究者，AI 辅助科研、写作、编程方法。', why: '高校教师做 AI 教学实践的一手记录，对教育工作者尤其有参考价值。', src: [{ label: '暨南大学', url: 'https://gs.jnu.edu.cn/2024/1219/c11866a828050/page.htm' }] }
      ]
    },
    {
      id: 'labs', title: '模型厂商官方号', sub: '对应 Anthropic Engineering、Claude Blog：一手发布模型、API 与产品。',
      items: [
        { name: 'DeepSeek', mp: 'yes', kind: 'builder', role: '深度求索官方号。「投身于探索 AGI 的本质，不做中庸的事。」', why: '官方自述渠道仅公众号、小红书、X，未设视频号。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }, { label: 'IT之家', url: 'https://www.ithome.com/0/829/010.htm' }] },
        { name: '月之暗面 Kimi', mp: 'yes', vc: 'check', kind: 'builder', role: 'Kimi 是月之暗面打造的 AI 助手。', why: '模型与产品发布一手来源。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '智谱 / GLM大模型', mp: 'yes', vc: 'check', kind: 'builder', role: '「让机器像人一样思考」；GLM 系列官方账号。', why: '模型能力、API 与产品动态。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: 'MiniMax 稀宇科技', mp: 'yes', vc: 'check', kind: 'builder', role: '自研多模态大模型 MiniMax M 系列、Hailuo、Speech。', why: '一手模型发布。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '腾讯混元', mp: 'yes', kind: 'builder', role: '混元大模型官方公众号。', why: '一手模型发布。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '元宝', mp: 'yes', vc: 'yes', kind: 'builder', role: '腾讯 AI 助手官方号。', why: '公众号与视频号都有。', src: [{ label: '掘金', url: 'https://juejin.cn/post/7546564423893237775' }] },
        { name: '字节跳动 Seed', mp: 'yes', kind: 'builder', role: '字节 AI 研究团队，追求智能上限。', why: '研究团队直发。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '豆包', mp: 'yes', kind: 'builder', role: '字节 AI 助手官方号。', why: '产品更新一手来源。', src: [{ label: 'CrazyAIGC', url: 'https://crazyaigc.com/daily/2026/06/24-doubao-pro-office-agent' }] },
        { name: '通义实验室 / 通义千问', mp: 'yes', kind: 'builder', role: '阿里 Qwen 系列模型与开源。', why: '开源模型发布一手来源。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }, { label: '量子位', url: 'https://www.qbitai.com/2026/03/383842.html' }] },
        { name: '阶跃StepFun', mp: 'yes', kind: 'builder', role: '原「阶跃星辰」。「智能阶跃，十倍每个人的可能。」', why: '一手模型发布。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '百度AI', mp: 'yes', kind: 'builder', role: '原「百度文心」，百度 AI 技术品牌官方号。', why: '一手模型发布。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: 'Xiaomi MiMo', mp: 'yes', kind: 'builder', role: '小米大模型团队。', why: '一手模型发布。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '面壁智能', mp: 'yes', kind: 'builder', role: 'MiniCPM 端侧模型研发与开源。', why: '端侧模型一手来源。', src: [{ label: 'OpenBMB', url: 'https://openbmb.cn/' }] },
        { name: '可灵AI', mp: 'yes', kind: 'builder', role: '快手 AI 视频与图像生成。', why: '视频生成一手来源。', src: [{ label: '可灵', url: 'https://klingai.com/docs/user-policy' }] },
        { name: '生数科技', mp: 'yes', kind: 'builder', role: 'Vidu 视频生成模型。', why: '视频生成一手来源。', src: [{ label: 'Genspi', url: 'https://www.genspi.com/zh/about/' }] },
        { name: '讯飞开放平台', mp: 'yes', kind: 'builder', role: '科大讯飞星火大模型开发者侧官方号。', why: '开发者侧一手来源。', src: [{ label: 'App Store', url: 'https://apps.apple.com/kr/app/%E8%AE%AF%E9%A3%9E%E6%98%9F%E7%81%AB-%E6%87%82%E4%BD%A0%E7%9A%84ai%E5%8A%A9%E6%89%8B/id6449919551' }] }
      ],
      note: '未核实到官方公众号名称：硅基流动 SiliconFlow、扣子 Coze、Manus、智源研究院、上海人工智能实验室，建议在微信内直接搜索。'
    },
    {
      id: 'research', title: '研究机构 / 国际厂商 / 大厂技术团队', sub: '工程师写自己做的系统。',
      items: [
        { name: '微软亚洲研究院', mp: 'yes', kind: 'builder', role: 'MSRA 官方号，研究一手发布。', why: '研究团队直发。', src: [{ label: '小宇宙', url: 'https://www.xiaoyuzhoufm.com/episode/69734b97ef1cf272a70fcdf3' }] },
        { name: 'NVIDIA英伟达', mp: 'yes', kind: 'builder', role: 'NVIDIA 中国官方公众号。', why: '算力与开发者生态一手来源。', src: [{ label: 'NVIDIA', url: 'https://www.nvidia.cn/newsroom/contacts/' }] },
        { name: '谷歌开发者', mp: 'yes', kind: 'builder', role: 'Google 中国官方，含 AI 开发技术。', why: '官方开发者渠道。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: 'DeeplearningAI', mp: 'yes', kind: 'builder', role: '吴恩达的 AI 教育传播平台。', why: '课程与行业观察一手来源。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: 'Jina AI', mp: 'yes', kind: 'builder', role: '搜索基础模型团队（创始人肖涵）。', why: '团队直发。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '腾讯技术工程', mp: 'yes', kind: 'builder', role: '腾讯技术官方号。', why: '工程实践一手。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '阿里云开发者 / 阿里技术', mp: 'yes', kind: 'builder', role: '阿里巴巴官方技术号。', why: '工程实践一手。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '字节跳动技术团队 / 字节跳动开源', mp: 'yes', kind: 'builder', role: '字节技术实践与开源动态。', why: '工程实践一手。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '蚂蚁技术 AntTech', mp: 'yes', kind: 'builder', role: '蚂蚁集团技术官方号。', why: '工程实践一手。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '小红书技术 REDtech', mp: 'yes', kind: 'builder', role: '小红书技术团队官方账号。', why: '工程实践一手。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '百度 Geek 说', mp: 'yes', kind: 'builder', role: '百度技术干货。', why: '工程实践一手。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] }
      ]
    },
    {
      id: 'oss', title: '开源平台与社区', sub: '对应 Hugging Face、LangChain 这一类官方号。',
      items: [
        { name: 'Dify', mp: 'yes', kind: 'builder', role: '开源 LLMOps 平台官方号。', why: '产品团队直发。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '魔搭 ModelScope 社区', mp: 'yes', kind: 'builder', role: '阿里模型开源社区。', why: '开源模型一手来源。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: 'Datawhale', mp: 'yes', kind: 'builder', role: 'AI 开源学习组织。', why: '系统学习路径，适合教学参考。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '通往 AGI 之路', mp: 'yes', kind: 'grey', role: 'WaytoAGI 社区。', why: '社区型知识库。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '哩布哩布AI', mp: 'yes', kind: 'builder', role: 'LiblibAI 创作平台官方。', why: '平台直发。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '微信派', mp: 'yes', kind: 'builder', role: '微信官方产品更新，含微信内 AI 功能。', why: '微信生态自身的 AI 动向。', src: [{ label: '新浪财经', url: 'https://finance.sina.com.cn/stock/t/2025-09-11/doc-infqcceh3263071.shtml' }] }
      ]
    },
    {
      id: 'podcasts', title: '深度访谈播客', sub: '对应 Latent Space、No Priors 等 6 档播客：请 builder 本人上麦长谈。',
      items: [
        { name: '十字路口 Crossing', mp: 'yes', kind: 'builder', role: '真格基金 Koji 与 Ronghui 主持，访谈 AI 时代的「积极行动者」。', why: '嘉宾几乎全是创业者与产品人；张咋啦本人曾做客。', src: [{ label: 'BestBlogs', url: 'https://www.ginonotes.com/posts/bestblogs-sources-part1-from-wechat' }, { label: 'AI TNT 访谈', url: 'https://m.aitntnews.com/newDetail.html?newId=21420' }] },
        { name: '张小珺', mp: 'yes', vc: 'check', kind: 'builder', role: '张小珺商业访谈录，2–7 小时长谈。', why: '请姚顺雨、杨植麟、肖弘、罗福莉等 builder 本人上麦。', src: [{ label: 'X 推荐帖', url: 'https://x.com/Ryrenz/status/2058042855386439957' }, { label: 'RSSPod', url: 'https://rsspod.pro/podcast/5580389?cursor=50&limit=10' }] },
        { name: '42章经', mp: 'yes', kind: 'builder', role: '曲凯，对谈 AI 应用创始人。公众号 ID：MyFortyTwo。', why: '近期多期是一线 AI 创业者复盘。', src: [{ label: 'Apple Podcasts', url: 'https://podcasts.apple.com/cn/podcast/42%E7%AB%A0%E7%BB%8F/id1700299886' }] },
        { name: '硅谷101', mp: 'yes', kind: 'builder', role: '陈茜，硅谷一线中文深度报道。', why: '调研深、有现场感。', src: [{ label: 'Fireside', url: 'https://sv101.fireside.fm/hosts/qian' }] },
        { name: 'OnBoard!', mp: 'yes', kind: 'builder', role: '两位科技投资人，访谈 SaaS 与 AI 创业者。公众号：M小姐研习录 / 我思锅我在。', why: '投资人与创业者双视角。', src: [{ label: '播客索引', url: 'https://tech-podcasts.github.io//it-technology-podcast/docs/podcast/OnBoard' }] },
        { name: '海外独角兽', mp: 'yes', kind: 'builder', role: '拾象，全球 AI 公司深度研究。公众号 ID：unicornobserver。', why: '研究型一手分析，非速递。', src: [{ label: 'Rephonic', url: 'https://rephonic.com/podcasts/alignment-2' }] },
        { name: 'Founder Park', mp: 'yes', vc: 'yes', kind: 'builder', role: '极客公园创业者社区。', why: '创始人访谈与工作坊。', src: [{ label: '极客公园', url: 'https://about.geekpark.net/' }] },
        { name: '乱翻书', mp: 'yes', vc: 'yes', vcName: '潘乱', kind: 'builder', role: '潘乱的圆桌直播。', why: '常请一线产品负责人同台。', src: [{ label: '小宇宙', url: 'https://www.xiaoyuzhoufm.com/episode/67d5a5a70766616acd310b77' }] },
        { name: '晚点 LatePost / 晚点对话', mp: 'yes', kind: 'builder', role: '晚点聊 LateTalk 播客配套。', why: '深度人物访谈。', src: [{ label: 'Apple Podcasts', url: 'https://podcasts.apple.com/ee/podcast/%E6%99%9A%E7%82%B9%E8%81%8A-latetalk/id1564877433' }] },
        { name: 'AI 炼金术', mp: 'yes', kind: 'builder', role: '徐文浩与任鑫，关注 AI 本质变化与商业机会。', why: '两位主理人都有产品孵化经历。', src: [{ label: '任鑫主页', url: 'https://www.marsren.ai/' }] }
      ]
    },
    {
      id: 'radar', title: '背景雷达（非 builder，对照组）', sub: '按张咋啦的原则属于 influencer / 媒体一侧，建议每天只扫标题，不作为主信息源。',
      items: [
        { name: '机器之心 · 量子位 · 新智元', mp: 'yes', kind: 'media', role: '覆盖面最广的三家 AI 综合媒体。', why: '新榜 2026 AI 公众号榜单与多篇推荐文均归为「综合媒体」。', src: [{ label: '搜狐整理文', url: 'https://www.sohu.com/a/1027864441_122805610' }] },
        { name: 'AI 前线 · 智东西 · 晚点 AI · 智能涌现 · AI 科技评论 · APPSO', mp: 'yes', kind: 'media', role: '产业与技术资讯媒体。', why: '适合阶段性检索。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: 'PaperWeekly · PaperAgent · 夕小瑶科技说 · AINLP', mp: 'yes', kind: 'media', role: '论文与技术解读。', why: '做科研时作资料库。', src: [{ label: 'AI百宝箱', url: 'https://www.wangzhidaquan.com/accounts/' }] },
        { name: '数字生命卡兹克', mp: 'yes', vc: 'yes', kind: 'grey', role: '张仁杰，AI 内容创作者、连续创业者。', why: '实操型内容创作者，偏 influencer。', src: [{ label: 'X', url: 'https://x.com/Khazix0918' }] },
        { name: '赛博禅心', mp: 'yes', kind: 'grey', role: '主理人大聪明，AI 技术解读与评论。', why: '解读质量高，但未见自有产品。', src: [{ label: '虎嗅', url: 'https://www.huxiu.com/article/4819513.html' }] },
        { name: '秋芝2046 · 小互 AI · 袋鼠帝', mp: 'yes', kind: 'grey', role: 'AI 工具教程与资讯整理。', why: '教程可用，信息多为二手。', src: [{ label: 'B 站', url: 'https://www.bilibili.com/list/385670211?bvid=BV1G3FNznEiS' }] },
        { name: '高飞的电子替身', mp: 'yes', kind: 'media', role: '科技观察家高飞，模型时代的观察笔记。', why: '观察者视角，非建造者。', src: [{ label: '至顶', url: 'https://www.zhiding.cn/gaofei/' }] }
      ]
    }
  ],
  missing: {
    title: '未能在微信里核实到个人账号的中国 builder',
    text: '玉伯（YouMind 创始人）、肖弘（Manus 创始人）、林俊旸（前 Qwen 负责人）、李开复（零一万物）、Tw93、小七姐——他们在即刻、X、小红书更活跃，本次检索未找到可确认的公众号或视频号。',
    src: [{ label: '36氪', url: 'https://www.36kr.com/p/3381249732094472' }, { label: '量子位', url: 'https://www.qbitai.com/2026/03/383842.html' }]
  },
  howto: [
    '订阅：在微信「搜一搜」直接搜账号名；公众号可加入「合集」或星标，视频号可「关注」并设为常看。',
    '做成简报：用 WeWe RSS / RSSHub 把公众号转成 RSS，再接到 follow-builders 同款的 agent 工作流（如 OpenClaw、Claude Code 定时任务）生成中文日报。',
    '现成聚合：BestBlogs 已按优先级收录上述大部分公众号；followaibuilders.com 也开始收录微信公众号来源。',
    '维护原则：每季度清一次关注列表，只问一个问题——这个号最近三个月有没有亲手做出新东西？'
  ]
};
