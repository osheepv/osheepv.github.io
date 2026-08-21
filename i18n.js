/* ============================================
   欧阳威个人网站 · 中英文切换
   i18n.js — 字典 + 切换逻辑 + 持久化 + 动效
   依赖：无（先于 script.js 加载）
   ============================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'ow-lang';

  /* ===== 翻译字典 ===== */
  var DICT = {
    zh: {
      /* Nav */
      'nav.resume': '个人简历',
      'nav.ai': 'AI助手',
      'nav.other': '其他',
      'nav.contact': '联系我',
      'menu.open': '打开菜单',
      'menu.close': '关闭菜单',
      'skip.link': '跳到主要内容',
      'theme.aria': '切换明暗主题',
      'lang.aria': '切换语言',
      'theme.light': '◐ 浅色',
      'theme.dark': '◐ 深色',
      'theme.light.en': '◐ Light',
      'theme.dark.en': '◐ Dark',

      /* Hero */
      'hero.eyebrow': '机械工程 · 数学建模 · AI Agent',
      'hero.title': '用数据、模型与 AI，\n让工程更精准更高效。',
      'hero.sub': '欧阳威 · 衢州学院机械设计制造及其自动化专业。专注于将数学建模与机械工程相结合，在多场竞赛中斩获佳绩。同时熟练运用 Claude Code、n8n 等 AI Agent 工具完成开发自动化与工作流搭建，持续探索工程与智能化的融合解法。',
      'hero.cta1': '查看荣誉',
      'hero.cta2': '联系我',
      'hero.scroll': '向下滚动',

      /* Stats */
      'stat.1': '竞赛奖项',
      'stat.2': '实习与校园经历',
      'stat.3': '核心技能领域',
      'stat.4': '校级以上证书',

      /* Ticker */
      'ticker.1': '数学建模', 'ticker.2': '3D建模', 'ticker.3': '仿真分析',
      'ticker.4': 'Python', 'ticker.5': 'Matlab', 'ticker.6': '机械设计',
      'ticker.7': 'Claude Code', 'ticker.8': 'n8n', 'ticker.9': 'AI Agent',
      'ticker.10': '数据清洗', 'ticker.11': '运筹优化', 'ticker.12': 'SolidWorks',
      'ticker.13': 'ANSYS', 'ticker.14': 'WorkBuddy', 'ticker.15': 'Codex',
      'ticker.16': '工作流搭建',

      /* Section nav */
      'secnav.1': '关于', 'secnav.2': '技能', 'secnav.3': '竞赛荣誉',
      'secnav.4': '经历', 'secnav.5': '联系',

      /* About */
      'about.kicker': 'About',
      'about.title': '关于我',
      'about.sub': '机械工程与数据建模的交叉探索者',
      'about.c1t': '<span class="icon">🎓</span>教育背景',
      'about.c1b': '衢州学院 · 机械设计制造及其自动化专业。系统学习机械设计、制造工艺与工程力学，同时自学编程与数据建模，将工程思维与数据方法结合。',
      'about.c1tag': '2023 — 2027（预计）',
      'about.c2t': '<span class="icon">⬢</span>自我定位',
      'about.c2b': '擅长用数学模型解决工程问题，在数学建模竞赛中多次获奖。具备从数据清洗、特征工程到模型求解的全流程能力。同时熟练运用 AI Agent 工具（Claude Code、n8n 等）完成项目开发与自动化工作流搭建，已在个人网站部署上线、微信小程序开发等项目中落地实践。',
      'about.c2tag': '建模 · 编程 · AI Agent',

      /* Quote */
      'quote.text': '<span class="quote-open">“</span>好模型不是越复杂越好，而是能用最简洁的假设解释清楚现象，并在有限时间内完成验证。<span class="quote-close">”</span>',

      /* Skills */
      'skills.kicker': 'Skills',
      'skills.title': '技能领域',
      'skills.sub': '从三维设计到 AI Agent，覆盖工程与智能化全链条',
      'skills.s1t': '3D建模与机械设计',
      'skills.s1b': '熟练运用 SolidWorks、AutoCAD 完成零部件三维建模与工程图纸绘制。掌握机械原理与机械设计基础，能独立完成从需求分析到结构设计的全流程。',
      'skills.s2t': '仿真分析',
      'skills.s2b': '运用 ANSYS 进行有限元分析与结构仿真，验证设计方案的合理性与可靠性。',
      'skills.s3t': '编程与数据建模',
      'skills.s3b': 'Python + Matlab 完成数据清洗、数值计算、模型验证与可视化，具备完整的建模竞赛方法论。',
      'skills.s4t': 'AI Agent 与工作流',
      'skills.s4b': '熟练运用 Claude Code、Codex、OpenClaw、WorkBuddy、n8n 等 AI Agent 工具完成开发自动化与工作流搭建。已落地项目包括个人网站搭建与部署上线、微信小程序开发上线等。',

      /* Awards */
      'awards.kicker': 'Awards',
      'awards.title': '竞赛荣誉',
      'awards.sub': '在全国与区域性数学建模竞赛中累计获得 6 项奖项',
      'awards.arrow': '查看详情 →',
      'badge.province1': '省一', 'badge.national3': '国三',
      'badge.prize3': '三奖', 'badge.exp': '经历',
      'a.a1.badge': '省一',
      'a.a1.title': '全国大学生数学建模竞赛 · 浙江赛区一等奖',
      'a.a1.meta': '2025 · CUMCM · 浙江赛区 A 题',
      'a.a1.summary': '从建模、编程到论文撰写全流程主导完成，72小时高强度赛程中反复验证确保模型结果合理可信。',
      'a.a2.badge': '国三',
      'a.a2.title': '"华数杯"全国大学生数学建模 · 本科生组三等奖',
      'a.a2.meta': '2025 · 华数杯 · 本科生组',
      'a.a2.summary': '聚焦大数据分析类题目，在数据清洗、特征工程与模型调优中投入大量精力。',
      'a.a3.badge': '三奖',
      'a.a3.title': 'MathorCup 数学应用挑战赛 · 本科生组三等奖',
      'a.a3.meta': '2025 · MathorCup · 本科生组',
      'a.a3.summary': '运用线性规划与启发式算法相结合的方式求解调度优化问题，积累了运筹优化实战经验。',
      'a.a4.badge': '三奖',
      'a.a4.title': '长三角高校数学建模竞赛 · 三等奖（连续两届）',
      'a.a4.meta': '2024 — 2025 · 长三角赛区',
      'a.a4.summary': '从首届的摸索到次届的稳定输出，每次参赛都在建模流程与论文质量上有明显进步。',

      /* Experience */
      'exp.kicker': 'Experience',
      'exp.title': '实习与校园经历',
      'exp.sub': '从车间一线到社团管理，在实践中持续成长',
      'exp.arrow': '查看详情 →',
      'e.e1.time': '2024.11 — 2024.12',
      'e.e1.title': '企业走访实习',
      'e.e1.body': '实地走访 4 家机械制造标杆企业，深入生产车间与研发中心，系统学习零部件加工工艺与流程管控。',
      'e.e2.time': '2023.10 — 2025.02',
      'e.e2.title': 'KAB 创业联盟副部长',
      'e.e2.body': '协同筹办两届校园淘宝街活动，负责摊主招募、场地规划与现场管控，沉淀了一套可复用的活动应急方案。',
      'e.e3.time': '2023.10 — 2025.12',
      'e.e3.title': '数学建模社团 · 核心成员',
      'e.e3.body': '累计参与 6 场省级及以上竞赛收获 6 项奖项，熟练运用 Python/Matlab 完成数据建模全流程，主导搭建社团知识库。',
      'e.e4.time': '2024 — 2025',
      'e.e4.title': '荣誉 & 奖学金',
      'e.e4.body': '本科期间累计获得三等奖学金、优秀学生干部，以及 10+ 项校级及以上竞赛证书。',

      /* CTA */
      'cta.title': '有项目合作或问题咨询？',
      'cta.sub': '无论是数学建模、机械设计、数据分析还是 AI Agent 工作流搭建，欢迎随时联系我交流。',
      'cta.btn': '联系我 →',

      /* Footer */
      'footer.brand': '欧阳威的个人简历网站。机械设计制造及其自动化专业，数学建模竞赛获奖者。用数据、模型与 AI Agent 让工程更精准、更高效。',
      'footer.brand2': '欧阳威的个人简历网站。机械设计制造及其自动化专业，数学建模竞赛获奖者。',
      'footer.explore': '探索',
      'footer.contact': '联系',
      'footer.copy': '© 2026 欧阳威 · Built with passion',

      /* Contact page */
      'contact.kicker': 'Contact',
      'contact.title': '联系我',
      'contact.sub': '无论是项目合作、学术交流还是问题咨询，都欢迎随时联系',
      'contact.back': '← 返回首页',
      'contact.cardTitle': '联系方式',
      'contact.email1': '邮箱（主要）',
      'contact.email2': '邮箱（备用）',
      'contact.phone': '电话',
      'contact.loc': '所在地',
      'contact.formTitle': '发送消息',
      'contact.success': '✓ 消息已发送！我会尽快回复你。',
      'contact.name': '姓名',
      'contact.email': '邮箱',
      'contact.subject': '主题',
      'contact.message': '消息内容',
      'contact.ph.name': '你的姓名',
      'contact.ph.email': 'your@email.com',
      'contact.ph.subject': '消息主题（可选）',
      'contact.ph.message': '输入你想说的内容...',
      'contact.submit': '发送消息',
      'contact.err.name': '请输入姓名（至少2个字）',
      'contact.err.email': '请输入有效的电子邮箱',
      'contact.err.message': '请输入至少10个字的消息',

      /* Other page */
      'other.kicker': 'More',
      'other.title': '其他',
      'other.sub': '欧阳威的其他内容与链接',
      'other.cardTitle': '内容建设中',
      'other.cardBody': '这里将展示欧阳威的更多内容 —— 博客文章、项目细节、学习笔记等。敬请期待。',
      'other.back': '← 返回简历',
      'other.contact': '联系我 →',

      /* Detail page */
      'detail.pageTitle': '详情',
      'detail.back': '← 返回个人简历',
      'detail.loading': '加载中…',
      'detail.notfoundT': '内容不存在',
      'detail.notfoundB': '找不到对应的详情内容，请返回简历页。',
      'detail.achievements': '主要成果',
      'detail.details': '详细经历',
      'detail.skills': '相关技能',
      'detail.takeaway': '我的感悟',
      'detail.prev': '← 上一篇',
      'detail.next': '下一篇 →',
      'detail.related': '继续阅读',
      'detail.relAward': '竞赛荣誉',
      'detail.relExp': '经历',
      'detail.ctaT': '对这些内容感兴趣？',
      'detail.ctaB': '如果想了解更多或者讨论相关话题，欢迎随时联系。',
      'detail.ctaBtn': '联系我 →',

      /* AI Assistant */
      'chat.kicker': 'AI Assistant',
      'chat.pageTitle': 'AI助手 — 欧阳威',
      'chat.title': '欧阳威的 AI 助手',
      'chat.sub': '问我任何关于欧阳威的问题 —— 经历、技能、作品、竞赛',
      'chat.name': '欧阳威 · AI 助手',
      'chat.statusConn': '连接中…',
      'chat.statusOn': '在线 · 了解欧阳威的一切',
      'chat.statusOff': '离线 · 服务暂不可用',
      'chat.hello': '你好！我是欧阳威的 AI 助手。你可以问我关于他的教育背景、技术技能、竞赛荣誉、实习经历，或者任何关于他的问题。想从哪里开始？',
      'chat.now': '现在',
      'chat.ph': '输入你的问题…（如：他擅长什么？）',
      'chat.send': '发送',
      'chat.hint': '试试问：',
      'chat.q1': '他擅长哪些方面？',
      'chat.q2': '竞赛奖项',
      'chat.q3': '实习经历',
      'chat.user': '我',
      'chat.fail': 'AI 助手当前离线，暂时无法回复。请稍后再试。',
      'chat.noReply': '（未收到回复）'
    },

    en: {
      /* Nav */
      'nav.resume': 'Resume',
      'nav.ai': 'AI Assistant',
      'nav.other': 'More',
      'nav.contact': 'Contact',
      'menu.open': 'Open menu',
      'menu.close': 'Close menu',
      'skip.link': 'Skip to main content',
      'theme.aria': 'Toggle light/dark theme',
      'lang.aria': 'Switch language',
      'theme.light': '◐ Light',
      'theme.dark': '◐ Dark',
      'theme.light.en': '◐ Light',
      'theme.dark.en': '◐ Dark',

      /* Hero */
      'hero.eyebrow': 'Mechanical Engineering · Math Modeling · AI Agent',
      'hero.title': 'With data, models and AI,\nmake engineering more precise and efficient.',
      'hero.sub': 'OuYang Wei · Mechanical Design, Manufacturing and Automation at Quzhou University. Focused on combining mathematical modeling with mechanical engineering, with outstanding results in multiple competitions. Also proficient in AI Agent tools such as Claude Code and n8n for development automation and workflow building, constantly exploring the fusion of engineering and intelligence.',
      'hero.cta1': 'View Awards',
      'hero.cta2': 'Contact Me',
      'hero.scroll': 'Scroll down',

      /* Stats */
      'stat.1': 'Competition Awards',
      'stat.2': 'Internships & Campus',
      'stat.3': 'Core Skill Areas',
      'stat.4': 'Certificates (Univ.+)',

      /* Ticker */
      'ticker.1': 'Math Modeling', 'ticker.2': '3D Modeling', 'ticker.3': 'Simulation',
      'ticker.4': 'Python', 'ticker.5': 'MATLAB', 'ticker.6': 'Mechanical Design',
      'ticker.7': 'Claude Code', 'ticker.8': 'n8n', 'ticker.9': 'AI Agent',
      'ticker.10': 'Data Cleaning', 'ticker.11': 'Optimization', 'ticker.12': 'SolidWorks',
      'ticker.13': 'ANSYS', 'ticker.14': 'WorkBuddy', 'ticker.15': 'Codex',
      'ticker.16': 'Workflow Automation',

      /* Section nav */
      'secnav.1': 'About', 'secnav.2': 'Skills', 'secnav.3': 'Awards',
      'secnav.4': 'Experience', 'secnav.5': 'Contact',

      /* About */
      'about.kicker': 'About',
      'about.title': 'About Me',
      'about.sub': 'Explorer at the intersection of mechanical engineering and data modeling',
      'about.c1t': '<span class="icon">🎓</span>Education',
      'about.c1b': 'Quzhou University · Mechanical Design, Manufacturing and Automation. Systematically studied mechanical design, manufacturing processes and engineering mechanics, while self-learning programming and data modeling to combine engineering thinking with data-driven methods.',
      'about.c1tag': '2023 — 2027 (expected)',
      'about.c2t': '<span class="icon">⬢</span>Self Positioning',
      'about.c2b': 'Skilled at solving engineering problems with mathematical models, winning multiple awards in mathematical modeling competitions. Full-pipeline capability from data cleaning and feature engineering to model solving. Also proficient in AI Agent tools (Claude Code, n8n, etc.) for project development and automated workflow building — applied in projects like deploying this personal website and developing a WeChat Mini Program.',
      'about.c2tag': 'Modeling · Coding · AI Agent',

      /* Quote */
      'quote.text': '<span class="quote-open">“</span>A good model is not the most complex one, but the one that explains the phenomenon with the simplest assumptions and can be validated within a limited time.<span class="quote-close">”</span>',

      /* Skills */
      'skills.kicker': 'Skills',
      'skills.title': 'Skill Areas',
      'skills.sub': 'From 3D design to AI Agent — covering the full engineering & intelligence chain',
      'skills.s1t': '3D Modeling & Mechanical Design',
      'skills.s1b': 'Proficient in SolidWorks and AutoCAD for 3D part modeling and engineering drawings. Solid grasp of mechanical principles and design fundamentals — capable of the full pipeline from requirement analysis to structural design.',
      'skills.s2t': 'Simulation & Analysis',
      'skills.s2b': 'Finite element analysis and structural simulation with ANSYS to verify the rationality and reliability of design solutions.',
      'skills.s3t': 'Programming & Data Modeling',
      'skills.s3b': 'Python + MATLAB for data cleaning, numerical computation, model validation and visualization, with a complete competition modeling methodology.',
      'skills.s4t': 'AI Agent & Workflows',
      'skills.s4b': 'Proficient in AI Agent tools — Claude Code, Codex, OpenClaw, WorkBuddy, n8n — for development automation and workflow building. Shipped projects include this website (built & deployed) and a WeChat Mini Program (developed & launched).',

      /* Awards */
      'awards.kicker': 'Awards',
      'awards.title': 'Awards & Honors',
      'awards.sub': '6 awards in national and regional mathematical modeling competitions',
      'awards.arrow': 'View details →',
      'badge.province1': 'Prov. 1st', 'badge.national3': 'Nat. 3rd',
      'badge.prize3': '3rd Prize', 'badge.exp': 'Experience',
      'a.a1.badge': 'Prov. 1st',
      'a.a1.title': 'CUMCM National College Math Modeling · Zhejiang 1st Prize',
      'a.a1.meta': '2025 · CUMCM · Zhejiang Problem A',
      'a.a1.summary': 'Led the full pipeline from modeling and coding to paper writing, with repeated validation during the intense 72-hour contest to keep results reliable.',
      'a.a2.badge': 'Nat. 3rd',
      'a.a2.title': '"Huashu Cup" National College Math Modeling · Undergrad 3rd Prize',
      'a.a2.meta': '2025 · Huashu Cup · Undergrad',
      'a.a2.summary': 'Focused on a big-data analysis problem, investing heavily in data cleaning, feature engineering and model tuning.',
      'a.a3.badge': '3rd Prize',
      'a.a3.title': 'MathorCup Mathematical Modeling Challenge · Undergrad 3rd Prize',
      'a.a3.meta': '2025 · MathorCup · Undergrad',
      'a.a3.summary': 'Solved a scheduling optimization problem with linear programming combined with heuristic algorithms, gaining hands-on operations research experience.',
      'a.a4.badge': '3rd Prize',
      'a.a4.title': 'Yangtze Delta Universities Math Modeling · 3rd Prize (twice)',
      'a.a4.meta': '2024 — 2025 · Yangtze Delta',
      'a.a4.summary': 'From groping in the first year to steady output in the second, each contest brought visible progress in modeling process and paper quality.',

      /* Experience */
      'exp.kicker': 'Experience',
      'exp.title': 'Internships & Campus Experience',
      'exp.sub': 'From the workshop floor to club management — growing through practice',
      'exp.arrow': 'View details →',
      'e.e1.time': '2024.11 — 2024.12',
      'e.e1.title': 'Company Visit Internship',
      'e.e1.body': 'Visited 4 benchmark machinery manufacturers, going deep into production workshops and R&D centers to learn part machining processes and process control.',
      'e.e2.time': '2023.10 — 2025.02',
      'e.e2.title': 'Vice Minister, KAB Entrepreneurship Union',
      'e.e2.body': 'Co-organized two campus bazaar events, handling vendor recruitment, venue planning and on-site management, and building a reusable contingency plan.',
      'e.e3.time': '2023.10 — 2025.12',
      'e.e3.title': 'Math Modeling Club · Core Member',
      'e.e3.body': 'Participated in 6 provincial+ competitions with 6 awards, proficient in full-pipeline data modeling with Python/MATLAB, and led the club knowledge base.',
      'e.e4.time': '2024 — 2025',
      'e.e4.title': 'Honors & Scholarships',
      'e.e4.body': 'Earned a Third-Class Scholarship, Outstanding Student Cadre, and 10+ university-level or above competition certificates during undergraduate study.',

      /* CTA */
      'cta.title': 'Have a project or a question?',
      'cta.sub': 'Whether it is math modeling, mechanical design, data analysis or AI Agent workflow building — feel free to reach out.',
      'cta.btn': 'Contact Me →',

      /* Footer */
      'footer.brand': 'Personal resume website of OuYang Wei. Major in Mechanical Design, Manufacturing and Automation; award winner in math modeling. Making engineering more precise and efficient with data, models and AI Agents.',
      'footer.brand2': 'Personal resume website of OuYang Wei. Mechanical Design, Manufacturing and Automation major, math modeling award winner.',
      'footer.explore': 'Explore',
      'footer.contact': 'Contact',
      'footer.copy': '© 2026 OuYang Wei · Built with passion',

      /* Contact page */
      'contact.kicker': 'Contact',
      'contact.title': 'Contact Me',
      'contact.sub': 'For project collaboration, academic exchange or any question — feel free to reach out anytime',
      'contact.back': '← Back to Home',
      'contact.cardTitle': 'Contact Info',
      'contact.email1': 'Email (Primary)',
      'contact.email2': 'Email (Alt)',
      'contact.phone': 'Phone',
      'contact.loc': 'Location',
      'contact.formTitle': 'Send a Message',
      'contact.success': '✓ Message sent! I will get back to you soon.',
      'contact.name': 'Name',
      'contact.email': 'Email',
      'contact.subject': 'Subject',
      'contact.message': 'Message',
      'contact.ph.name': 'Your name',
      'contact.ph.email': 'your@email.com',
      'contact.ph.subject': 'Message subject (optional)',
      'contact.ph.message': 'Type your message...',
      'contact.submit': 'Send Message',
      'contact.err.name': 'Please enter your name (at least 2 characters)',
      'contact.err.email': 'Please enter a valid email address',
      'contact.err.message': 'Please enter a message of at least 10 characters',

      /* Other page */
      'other.kicker': 'More',
      'other.title': 'More',
      'other.sub': 'Other content and links of OuYang Wei',
      'other.cardTitle': 'Under Construction',
      'other.cardBody': 'More content will appear here — blog posts, project details, study notes, etc. Stay tuned.',
      'other.back': '← Back to Resume',
      'other.contact': 'Contact Me →',

      /* Detail page */
      'detail.pageTitle': 'Details',
      'detail.back': '← Back to Resume',
      'detail.loading': 'Loading…',
      'detail.notfoundT': 'Content Not Found',
      'detail.notfoundB': 'The requested detail is not available. Please go back to the resume page.',
      'detail.achievements': 'Key Achievements',
      'detail.details': 'Detailed Story',
      'detail.skills': 'Related Skills',
      'detail.takeaway': 'My Takeaway',
      'detail.prev': '← Previous',
      'detail.next': 'Next →',
      'detail.related': 'Keep Reading',
      'detail.relAward': 'Award',
      'detail.relExp': 'Experience',
      'detail.ctaT': 'Interested in these?',
      'detail.ctaB': 'Want to know more or discuss related topics? Feel free to contact me.',
      'detail.ctaBtn': 'Contact Me →',

      /* AI Assistant */
      'chat.kicker': 'AI Assistant',
      'chat.pageTitle': 'AI Assistant — OuYang Wei',
      'chat.title': "OuYang Wei's AI Assistant",
      'chat.sub': 'Ask me anything about OuYang Wei — experience, skills, projects, competitions',
      'chat.name': 'OuYang Wei · AI Assistant',
      'chat.statusConn': 'Connecting…',
      'chat.statusOn': 'Online · Know everything about OYW',
      'chat.statusOff': 'Offline · Service unavailable',
      'chat.hello': "Hi! I'm OuYang Wei's AI assistant. Ask me about his education, technical skills, competition awards, internship experience, or anything about him. Where would you like to start?",
      'chat.now': 'now',
      'chat.ph': 'Type your question… (e.g. What is he good at?)',
      'chat.send': 'Send',
      'chat.hint': 'Try asking:',
      'chat.q1': 'What is he good at?',
      'chat.q2': 'Competition awards',
      'chat.q3': 'Internship experience',
      'chat.user': 'Me',
      'chat.fail': 'The AI assistant is offline and cannot reply right now. Please try again later.',
      'chat.noReply': '(No reply received)'
    }
  };

  /* ===== 详情页动态内容（en 覆盖） ===== */
  DICT.en['d:award-1:title'] = '2025 CUMCM · Zhejiang Regional 1st Prize';
  DICT.en['d:award-1:meta'] = '2025 · CUMCM (National College Math Modeling) · Zhejiang Problem A';
  DICT.en['d:award-1:summary'] = 'CUMCM is one of the largest and most recognized mathematical modeling contests in China. Problem A of the Zhejiang region focused on real engineering problems — I led the full pipeline from modeling and coding to paper writing and earned the Zhejiang Regional 1st Prize.';
  DICT.en['d:award-1:highlights'] = [
    'Chose CUMCM 2025 Problem A and built mathematical models for real engineering problems',
    'Independently completed problem analysis, model selection, data preprocessing and validation',
    'Led paper writing and typesetting, finally winning the Zhejiang Regional 1st Prize'
  ];
  DICT.en['d:award-1:details'] = [
    'Engineering optimization & data analysis problem requiring deep modeling and solving skills',
    '3-member team with clear roles: I handled modeling and coding; teammates handled data processing and paper layout',
    '72 intense hours with repeated validation to keep the model results reliable'
  ];
  DICT.en['d:award-1:skills'] = ['Math Modeling', 'Python', 'MATLAB', 'Paper Writing'];
  DICT.en['d:award-1:takeaway'] = "This experience taught me the essence of 'models serving problems' — a good model is not the most complex one, but one that explains phenomena with the simplest assumptions and can be validated in time.";

  DICT.en['d:award-2:title'] = '2025 6th "Huashu Cup" National Math Modeling · Undergrad 3rd Prize';
  DICT.en['d:award-2:meta'] = '2025 · Huashu Cup National College Math Modeling · Undergrad';
  DICT.en['d:award-2:summary'] = 'Huashu Cup is a well-known national math modeling contest following industry hot topics. This time I focused on a big-data analysis problem, investing heavily in data cleaning, feature engineering and model tuning, and earned the Undergrad 3rd Prize.';
  DICT.en['d:award-2:highlights'] = [
    'Completed data cleaning and feature engineering for a big-data problem',
    'Compared multiple models (regression, tree models) to find the best solution',
    'Won the national Undergrad 3rd Prize'
  ];
  DICT.en['d:award-2:details'] = [
    'Real data emphasis — trained the full pipeline from raw data to usable features',
    'Focused on handling missing values and outliers to ensure model input quality',
    'Extra work on model interpretability so results were easier for judges to understand'
  ];
  DICT.en['d:award-2:skills'] = ['Data Cleaning', 'Feature Engineering', 'Python', 'ML Basics'];
  DICT.en['d:award-2:takeaway'] = 'Data quality determines the model ceiling — time spent cleaning data always pays back in model accuracy.';

  DICT.en['d:award-3:title'] = '2025 15th MathorCup Challenge · Undergrad 3rd Prize';
  DICT.en['d:award-3:meta'] = '2025 · MathorCup University Math Modeling Challenge · Undergrad';
  DICT.en['d:award-3:summary'] = 'MathorCup is known for practical engineering and operations research. The problem involved scheduling optimization — I combined linear programming with heuristic algorithms to solve it, gaining hands-on OR experience and earning the Undergrad 3rd Prize.';
  DICT.en['d:award-3:highlights'] = [
    'Scheduling/OR problem solved with linear programming',
    'Combined heuristic algorithms to boost solving efficiency',
    'Won the Undergrad 3rd Prize'
  ];
  DICT.en['d:award-3:details'] = [
    'Learned and applied integer programming plus greedy/simulated-annealing heuristics',
    'Handled constraint modeling details to avoid infeasible solutions',
    'Visualized scheduling results to strengthen the paper'
  ];
  DICT.en['d:award-3:skills'] = ['Optimization', 'Linear Programming', 'MATLAB', 'Heuristics'];
  DICT.en['d:award-3:takeaway'] = "The essence of operations research is constraint modeling — translating real constraints into mathematical language matters more than knowing algorithm libraries.";

  DICT.en['d:award-4:title'] = '2024 4th & 2025 5th Yangtze Delta Univ. Math Modeling · 3rd Prize';
  DICT.en['d:award-4:meta'] = '2024–2025 · Yangtze Delta Univ. Math Modeling Contest · two years in a row';
  DICT.en['d:award-4:summary'] = 'The Yangtze Delta contest focuses on regional economy and livelihood topics. I competed two years in a row — from nervous first attempt to calm second — with clear progress in modeling process and paper quality, earning 3rd Prize both times.';
  DICT.en['d:award-4:highlights'] = [
    'Competed two years in a row, 3rd Prize in the Yangtze Delta region both times',
    'From groping in year one to steady output in year two — process capability improved significantly',
    'Continuously iterated modeling approach and paper typesetting methodology'
  ];
  DICT.en['d:award-4:details'] = [
    'Year one focused on a data problem, learning the complete contest workflow',
    'Year two showed much more mature time management and teamwork',
    'Built a reusable paper typesetting and figure standard'
  ];
  DICT.en['d:award-4:skills'] = ['Modeling Process', 'Teamwork', 'Paper Typesetting', 'Word/LaTeX'];
  DICT.en['d:award-4:takeaway'] = "The biggest gain from competing repeatedly is not the awards — it's turning 'competing' into a reviewable process that improves with every run.";

  DICT.en['d:exp-1:title'] = 'Company Visit Internship';
  DICT.en['d:exp-1:meta'] = '2024.11 — 2024.12';
  DICT.en['d:exp-1:summary'] = 'Visited 4 benchmark machinery manufacturers, going deep into workshops and R&D centers to systematically learn part machining processes and process control, and compared each company\'s technical strengths and management features.';
  DICT.en['d:exp-1:highlights'] = [
    'Visited 4 benchmark companies: Yonglida, Shangyang Machinery, Hongwuhuan, Jinwo Precision',
    'Learned machining processes and process control in workshops and R&D centers',
    'Produced a complete internship summary report'
  ];
  DICT.en['d:exp-1:details'] = [
    'Observed typical turning, milling and grinding operations on the shop floor, understanding how process parameters affect quality',
    'Talked with engineers about the full production chain from drawing to finished product',
    'Compared automation level, quality management and R&D investment across companies, forming industry insights'
  ];
  DICT.en['d:exp-1:skills'] = ['Machining Processes', 'Process Control', 'Company Research', 'Report Writing'];
  DICT.en['d:exp-1:takeaway'] = 'The process flowcharts in textbooks and the real roar of machines on the shop floor are two different things — only by being on site do you truly understand what "mechanical manufacturing" means.';

  DICT.en['d:exp-2:title'] = 'Vice Minister, KAB Entrepreneurship Union';
  DICT.en['d:exp-2:meta'] = '2023.10 — 2025.02';
  DICT.en['d:exp-2:summary'] = 'As Vice Minister of the campus KAB Entrepreneurship Union, co-organized two campus bazaar events — handling vendor recruitment, venue planning and on-site management, and building a reusable event contingency plan.';
  DICT.en['d:exp-2:highlights'] = [
    'Organized two campus bazaar events (vendor recruitment, venue planning, on-site control)',
    'Documented 3 common contingency scenarios',
    'Zero major order issues across both events'
  ];
  DICT.en['d:exp-2:details'] = [
    'Delivered a large campus event from zero — booth zoning, application screening and on-site flow',
    'Prepared contingency plans for crowd peaks and weather changes',
    'Led a team of assistants, sharpening coordination and on-the-spot decision making'
  ];
  DICT.en['d:exp-2:skills'] = ['Event Planning', 'Team Management', 'On-site Coordination', 'Contingency'];
  DICT.en['d:exp-2:takeaway'] = 'Running an event is like running a small project: think through the risks and divide responsibilities in advance, and you can handle the scene calmly.';

  DICT.en['d:exp-3:title'] = 'Math Modeling Club · Core Member';
  DICT.en['d:exp-3:meta'] = '2023.10 — 2025.12';
  DICT.en['d:exp-3:summary'] = 'As a core member of the math modeling club, participated in 6 provincial+ competitions with 6 awards, proficient in Python/MATLAB for data cleaning, numerical computation and visualization, and distilled the methodology into the club knowledge base.';
  DICT.en['d:exp-3:highlights'] = [
    '6 provincial+ competitions with 6 awards',
    'Proficient in Python/MATLAB for data cleaning, numerical computation, model validation and visualization',
    'Methodology distilled into the shared club knowledge base'
  ];
  DICT.en['d:exp-3:details'] = [
    'Gave tech sharing and mentored newcomers, turning pitfalls into reusable experience',
    'Led the club modeling toolbox and template library to lower the entry barrier',
    'Formed a complete methodology from topic selection to paper through real contests'
  ];
  DICT.en['d:exp-3:skills'] = ['Python', 'MATLAB', 'Data Modeling', 'Knowledge Sharing', 'Mentoring'];
  DICT.en['d:exp-3:takeaway'] = 'Real growth happens the moment you write experience down and teach others — output is the most efficient input.';

  DICT.en['d:exp-4:title'] = 'Honors & Scholarships';
  DICT.en['d:exp-4:meta'] = '2024 — 2025';
  DICT.en['d:exp-4:summary'] = 'Earned multiple university honors and scholarships during undergraduate study, including a Third-Class Scholarship, Outstanding Student Cadre, and 10+ university-level or above competition certificates — recognition of sustained effort and balanced development.';
  DICT.en['d:exp-4:highlights'] = [
    '2024–2025 · Third-Class Scholarship',
    '2024–2025 · Outstanding Student Cadre',
    '10+ university-level or above competition certificates'
  ];
  DICT.en['d:exp-4:details'] = [
    'Balanced academics and competitions — keeping stable GPA while investing heavily in modeling contests',
    'Outstanding Student Cadre came from sustained dedication to KAB club and class work',
    'Scholarships and certificates reward "focus + persistence"'
  ];
  DICT.en['d:exp-4:skills'] = ['Academic Planning', 'Time Management', 'Balanced Development'];
  DICT.en['d:exp-4:takeaway'] = 'Honors are not the destination — they are confirmation that you are spending time on the right things.';

  /* ===== 核心逻辑 ===== */
  function currentLang() {
    try {
      var l = localStorage.getItem(STORAGE_KEY);
      if (l === 'en' || l === 'zh') return l;
    } catch (e) {}
    var docLang = document.documentElement.lang || 'zh-CN';
    return docLang.indexOf('en') === 0 ? 'en' : 'zh';
  }

  /* 立即同步 <html lang>（head 同步加载时执行，避免英文用户首帧闪烁） */
  document.documentElement.setAttribute('lang', currentLang() === 'en' ? 'en' : 'zh-CN');

  function saveLang(lang) {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
  }

  function t(key, fallback) {
    var dict = DICT[currentLang()] || {};
    var v = dict[key];
    if (v === undefined || v === null) {
      return fallback !== undefined ? fallback : key;
    }
    return v;
  }

  /* 详情页动态内容取当前语言版本 */
  function pickDetail(id, field, zhFallback) {
    if (currentLang() === 'en') {
      var v = DICT.en['d:' + id + ':' + field];
      if (v !== undefined && v !== null) return v;
    }
    return zhFallback;
  }

  /* ===== 应用到页面 ===== */
  function apply() {
    var lang = currentLang();

    // html lang
    document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');

    // 文本节点（\n → <br>）
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-i18n');
      var val = t(key);
      nodes[i].innerHTML = String(val).replace(/\n/g, '<br>');
    }

    // placeholder
    var phs = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phs.length; j++) {
      phs[j].setAttribute('placeholder', t(phs[j].getAttribute('data-i18n-ph')));
    }

    // aria-label
    var arias = document.querySelectorAll('[data-i18n-aria]');
    for (var k = 0; k < arias.length; k++) {
      arias[k].setAttribute('aria-label', t(arias[k].getAttribute('data-i18n-aria')));
    }

    // title（页面标题）
    var titleEl = document.querySelector('title[data-i18n-title]');
    if (titleEl) titleEl.textContent = t(titleEl.getAttribute('data-i18n-title'));

    // 语言按钮状态
    syncLangBtn();

    // 钩子（script.js 主题按钮、detail 页重新渲染等）
    var hooks = window.__i18nHooks || [];
    for (var h = 0; h < hooks.length; h++) {
      try { hooks[h](lang); } catch (e) {}
    }
  }

  /* ===== 语言按钮 ===== */
  function getLangToggle() {
    return document.querySelector('.lang-toggle');
  }

  function syncLangBtn() {
    var langToggle = getLangToggle();
    if (!langToggle) return;
    var lang = currentLang();
    langToggle.setAttribute('data-lang', lang);
    var btns = langToggle.querySelectorAll('button[data-lang]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].setAttribute('aria-pressed', btns[i].getAttribute('data-lang') === lang ? 'true' : 'false');
    }
  }

  /* 事件委托：head 同步加载时按钮还不存在 */
  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('button[data-lang]') : null;
    if (!btn) return;
    var langToggle = getLangToggle();
    if (!langToggle || !langToggle.contains(btn)) return;
    var lang = btn.getAttribute('data-lang');
    if (lang === currentLang()) return;
    switchLang(lang);
  });

  /* ===== 切换（带淡入淡出动效） ===== */
  var switching = false;

  function switchLang(lang) {
    if (switching || lang === currentLang()) return;
    switching = true;
    saveLang(lang);

    var body = document.body;
    body.classList.add('i18n-fade-out');

    window.setTimeout(function () {
      document.documentElement.setAttribute('lang', lang === 'en' ? 'en' : 'zh-CN');
      apply();
      // 下一帧淡入
      requestAnimationFrame(function () {
        body.classList.remove('i18n-fade-out');
        switching = false;
      });
    }, 220);
  }

  /* ===== 对外 API ===== */
  window.I18N = {
    t: t,
    apply: apply,
    current: currentLang,
    switch: switchLang,
    pickDetail: pickDetail,
    hooks: function (fn) {
      window.__i18nHooks = window.__i18nHooks || [];
      window.__i18nHooks.push(fn);
    }
  };

  /* 首次应用（DOM 已就绪时） */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
})();
