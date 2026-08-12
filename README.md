# 欧阳威 · 个人网站

[![Website](https://img.shields.io/badge/website-osheepv.github.io-blue)](https://osheepv.github.io)

机械工程 × 数据建模方向的个人品牌网站。基于纯 HTML/CSS/JS 构建，托管于 GitHub Pages，包含个人简历、AI 助手、联系方式等模块。

## 在线地址

**https://osheepv.github.io**

## 页面结构

| 导航 | 页面 | 说明 |
|------|------|------|
| 个人简历 | `index.html` | 教育背景、技术栈、竞赛荣誉、实习经历，卡片可点击查看详情 |
| AI 助手 | `ai-assistant.html` | 与"欧阳威本人"AI 对话，了解经历/技能/竞赛/实习 |
| 其他 | `other.html` | 预留扩展区 |
| 联系我 | `contact.html` | 邮箱、电话、简历下载 |

## 技术栈

- **纯前端**：HTML + CSS + JavaScript，无框架依赖
- **视觉风格**：mldangelo 风格，米白/深色双主题，玻璃质感卡片
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

直接用浏览器打开 `index.html`，或起一个本地静态服务器：

```bash
# Python 方式
python -m http.server 8080
# 或 Node 方式
npx serve
```

## 项目结构

```
├── index.html          # 个人简历
├── ai-assistant.html   # AI 助手
├── other.html          # 其他
├── contact.html        # 联系我
├── detail.html         # 详情页模板（URL 参数 id 渲染）
├── details.js          # 详情页数据（竞赛/经历详细内容）
├── resume.pdf          # 个人简历原件
└── README.md
```

## 更新内容

1. 直接编辑对应 HTML 文件
2. 提交推送，GitHub Pages 自动部署

详情页内容新增：在 `details.js` 的 `DETAILS` 对象中加一条即可。

## License

© 2026 欧阳威
