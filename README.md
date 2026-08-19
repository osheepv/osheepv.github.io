# 欧阳威 · 个人网站

[![Website](https://img.shields.io/badge/website-osheepv.github.io-blue)](https://osheepv.github.io)

机械工程 × 数据建模 × AI Agent 方向的个人品牌网站。基于纯 HTML/CSS/JS 构建，采用 Apple Design 视觉系统，托管于 GitHub Pages，包含个人简历、AI 助手、联系方式等模块。

## 在线地址

**https://osheepv.github.io**

## 页面结构

| 导航 | 页面 | 说明 |
|------|------|------|
| 个人简历 | `index.html` | Hero / 数据统计 / 关键词滚动条 / 关于我 / 技能 Bento Grid / 竞赛荣誉 / 实习经历 / CTA / Footer |
| AI 助手 | `ai-assistant.html` | 与"欧阳威本人"AI 对话，了解经历/技能/竞赛/实习 |
| 其他 | `other.html` | 预留扩展区 |
| 联系我 | `contact.html` | 交互表单 + 邮箱/电话/位置信息卡片 |
| 详情页 | `detail.html` | URL 参数 `?id=award-1` 动态渲染，含导航/相关推荐/CTA |

## 技能领域

| 领域 | 工具 / 技能 |
|------|-------------|
| 3D建模与机械设计 | SolidWorks、AutoCAD、机械原理、工程制图 |
| 仿真分析 | ANSYS、有限元、结构仿真 |
| 编程与数据建模 | Python、Matlab、数据清洗、可视化 |
| AI Agent 与工作流 | Claude Code、Codex、OpenClaw、WorkBuddy、n8n |

## 技术栈

- **纯前端**：HTML + CSS + JavaScript，无框架依赖
- **视觉风格**：Apple Design 系统 — Inter 字体、Action Blue (#0066cc)、Parchment 背景 (#f5f5f7)、hairline 边框、pill 按钮、18px 圆角卡片
- **共享样式**：`styles.css` — 完整设计令牌系统，支持亮/暗双主题，CSS 自定义属性 + localStorage 持久化
- **共享脚本**：`script.js` — 主题切换、汉堡菜单、Intersection Observer 滚动动画、数字计数器动画、平滑滚动、页内导航高亮、键盘导航、联系表单验证
- **响应式**：移动优先，断点 900px / 768px / 480px，clamp() 流式排版
- **可访问性**：WCAG 2.1 AA，语义化 HTML5、ARIA 标签、键盘导航、跳转链接、焦点样式
- **托管**：GitHub Pages 静态部署
- **AI 助手**：前端接入 n8n 工作流 → DeepSeek 大模型 + 简历知识库

## AI 助手架构

```
浏览者 → 页面 JS → cpolar 公网隧道 → 本地 n8n → DeepSeek
```

- 在线状态灯三态检测（连接中/在线/离线），走 n8n 轻量 health 端点
- 会话隔离：每个浏览者独立 sessionId，互不串记忆

> ⚠️ AI 助手依赖本机 n8n + cpolar 隧道运行，隧道 URL 变更时需同步更新 `ai-assistant.html` 中的 `API_URL`。

## 本地运行

```bash
# Python 方式
python -m http.server 8080

# 或 Node 方式
npx serve
```

## 项目结构

```
├── index.html          # 首页（个人简历）
├── styles.css          # 共享样式表（Apple Design 设计系统）
├── script.js           # 共享脚本（主题/动画/导航/表单）
├── ai-assistant.html   # AI 助手聊天页
├── other.html          # 其他
├── contact.html        # 联系我（交互表单）
├── detail.html         # 详情页模板（URL 参数 id 渲染）
├── details.js          # 详情页数据（竞赛/经历详细内容）
├── resume.pdf          # 个人简历原件
└── README.md
```

## 更新内容

1. 直接编辑对应 HTML 文件（`styles.css` 和 `script.js` 为全站共享）
2. 提交推送，GitHub Pages 自动部署
3. 详情页内容新增：在 `details.js` 的 `DETAILS` 对象中加一条即可

## 设计系统

| 设计令牌 | 值 |
|----------|-----|
| 主色 | `#0066cc` (Action Blue) |
| 背景 | `#f5f5f7` (Parchment) / `#000000` (Dark) |
| 正文色 | `#1d1d1f` (Ink) |
| 边框 | `#e0e0e0` (Hairline) |
| 字体 | Inter (Sans) / JetBrains Mono (Mono) |
| 卡片圆角 | 18px (radius-lg) |
| 按钮圆角 | 9999px (pill) |
| 阴影 | sm / md / lg / xl 四级体系 |

## License

© 2026 欧阳威
