# 欧阳威 · 个人网站

[![Website](https://img.shields.io/badge/website-vvosp.top-blue)](https://vvosp.top)
[![HTTPS](https://img.shields.io/badge/HTTPS-Let's%20Encrypt-success)](https://vvosp.top)

机械工程 × 数学建模 × AI Agent 方向的个人品牌网站。纯 HTML/CSS/JS 构建，无框架依赖，采用 Apple Design 视觉系统（Squircle 连续曲率圆角 + 玻璃拟态），支持中英双语与亮/暗主题，托管于 GitHub Pages 并绑定自有域名。

## 在线地址

**https://vvosp.top**

> 旧地址 `osheepv.github.io` 已由 GitHub Pages 自动 301 跳转，历史链接和搜索收录都不会断。

## 页面结构

| 导航 | 页面 | 说明 |
|------|------|------|
| 个人简历 | `index.html` | Hero / 数据统计 / 关键词滚动条 / 关于我 / 技能 Bento Grid / 竞赛荣誉 / 项目经历 / 经历 / CTA / Footer |
| AI 助手 | `ai-assistant.html` | 与「欧阳威本人」AI 对话，了解经历 / 技能 / 竞赛 / 实习 |
| 其他 | `other.html` | 预留扩展区（后续博客、笔记入口） |
| 联系我 | `contact.html` | EmailJS 真实发信表单（含 mailto 降级）+ 邮箱 / 电话 / 位置卡片 |
| 更新日志 | `changelog.html` | 站点自身的迭代记录（时间线布局，跟随明暗主题） |
| 项目 / 荣誉详情 | `projects/*.html` | **14 个独立页面**：4 个奖项 + 6 个项目 + 4 段经历，各自有独立 title / description / canonical / OG |
| 详情兼容页 | `detail.html` | 旧的 `?id=award-1` 参数入口，保留可用，渲染逻辑与项目页一致 |
| 404 | `404.html` | 自定义 404（带 `noindex`），GitHub Pages 自动接管 |

## 简历下载

| 文件 | 方向 | 说明 |
|------|------|------|
| `resume.pdf` | AI 应用 / 智能体产品 | 网站主简历 |
| `resume-mech.pdf` | 机械设计 / 研发 | 机械方向投递用 |

页脚「更多」栏提供两个方向的下载入口。

## 联系方式

| 类型 | 地址 | 说明 |
|------|------|------|
| 主要邮箱 | `3402685368@qq.com` | 国内 HR / 招聘系统兼容性最好 |
| 域名邮箱 | `me@vvosp.top` | 经 Cloudflare Email Routing 转发到 Gmail |
| 备用邮箱 | `oyw20041015@gmail.com` | — |
| 电话 | `19858807815` | — |

## 技能领域

| 领域 | 工具 / 技能 |
|------|-------------|
| 3D 建模与机械设计 | SolidWorks、AutoCAD、机械原理、工程制图、减速器设计全流程 |
| 数值建模与算法优化 | MATLAB — BP 神经网络、WOA / PSO / ILSO 群体智能优化、数据清洗与可视化 |
| 编程与控制 | Python（pytest / CI）、C 语言（51 单片机，Keil + Proteus）、三菱 FX 系列 PLC（GX Works2） |
| AI Agent 与工作流 | Claude Code、Codex、Cursor、n8n；需求拆解、任务编排、代码审查 |

## 技术栈

- **纯前端**：HTML + CSS + JavaScript，无框架依赖
- **视觉风格**：Apple Design 系统 — Inter 字体、Action Blue (#0066cc)、Parchment 背景 (#f5f5f7)、hairline 边框、pill 按钮
- **Apple Squircle 圆角**：全站统一连续曲率超椭圆圆角（n≈4），分 6 档（xs6 / sm10 / md14 / lg20 / xl28 / pill），5 层 SVG mask 实现，`corner-shape: squircle` 原生支持时自动升级，不支持时平滑降级
- **玻璃拟态**：卡片 / 按钮 / 输入框 / 弹窗统一 `backdrop-filter: blur(22px) saturate(180%)` + 半透明背景，`@supports` 降级
- **中英双语**：`i18n.js` 全站字典，右上角分段切换按钮带滑动动效，localStorage 持久化，覆盖文案 / 占位符 / ARIA / title 属性
- **共享样式**：`styles.css` — 设计令牌系统，亮 / 暗双主题，CSS 自定义属性 + localStorage；主题按钮遵循 iOS HIG
- **共享脚本**：`script.js` — 主题切换、汉堡菜单、Intersection Observer 滚动动画、数字计数器、平滑滚动、页内导航高亮、联系表单校验与 EmailJS 发送
- **波浪背景**：`wave.js` — Canvas2D 俯视水面物理涟漪，30fps 限帧、后台暂停、尊重 `prefers-reduced-motion`
- **性能**：全部 `<script>` 使用 `defer`；配图统一 WebP（9 张图总体积 1.36 MB → 0.45 MB）；Google Fonts 走国内镜像 + preconnect
- **响应式**：移动优先，断点 900px / 768px / 480px，`clamp()` 流式排版
- **可访问性**：语义化 HTML5、ARIA 标签、键盘导航、跳转链接、焦点样式、`prefers-reduced-motion`
- **托管**：GitHub Pages（静态）+ 自有域名 + Let's Encrypt 免费证书

## 域名与部署

```
访客 → Cloudflare DNS → GitHub Pages（185.199.108-111.153）→ 静态文件
```

| 项目 | 配置 |
|------|------|
| 自定义域名 | 仓库根目录 `CNAME` 文件，内容 `vvosp.top` |
| DNS 托管 | Cloudflare |
| 主域解析 | 4 条 A 记录 → `185.199.108/109/110/111.153`，**DNS only（灰云）** |
| `www` 解析 | CNAME → `osheepv.github.io`，**代理（橙云）**，由 Cloudflare Single Redirect 规则 301 到主域并保留路径与查询参数 |
| HTTPS | GitHub Pages 自动签发 Let's Encrypt，已开启 Enforce HTTPS，http 全部 301 到 https |
| 邮箱 | Cloudflare Email Routing：`me@` / `hi@` / `contact@` → Gmail；MX / SPF / DKIM / DMARC 均已配置 |

> ⚠️ 改 DNS 时注意：主域 A 记录必须是 **灰云（DNS only）**，否则 GitHub 的域名校验和证书签发会失败。

## 搜索与分享优化

- **每页元数据**：`title` / `description` / `canonical` / `og:*` / `twitter:card` 全站覆盖
- **结构化数据**：首页 `Person`，各项目页 `BreadcrumbList`，更新日志 `CollectionPage`
- **`sitemap.xml`**：19 条 URL（首页 + 3 个栏目页 + 14 个项目页 + 更新日志）
- **`robots.txt`**：声明 Sitemap 地址，Google 会自动发现
- **IndexNow**：仓库内的 `indexnow-<key>.txt` 为协议验证文件，推送 Bing / Yandex / Naver / DuckDuckGo
- **分享封面**：`assets/og-cover.png` + 每页专属 `og-ai-assistant.png` / `og-other.png` / `og-contact.png` / `og-detail.png`（1200×630）
- **图标**：`favicon.svg`（矢量）+ `apple-touch-icon.png`（180×180）

### 重新推送 IndexNow

```bash
curl -X POST https://api.indexnow.org/indexnow \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"host":"vvosp.top","key":"<indexnow 文件名里的 key>","keyLocation":"https://vvosp.top/indexnow-<key>.txt","urlList":["https://vvosp.top/changelog.html"]}'
```

## 本地预览

```bash
# Python
python -m http.server 8080

# 或 Node
npx serve
```

然后打开 <http://localhost:8080>。

## 项目结构

```
├── index.html                 # 首页（个人简历）
├── ai-assistant.html          # AI 助手聊天页
├── other.html                 # 其他
├── contact.html               # 联系我（EmailJS 表单）
├── changelog.html             # 更新日志（时间线）
├── detail.html                # 详情兼容页（?id= 参数渲染）
├── 404.html                   # 自定义 404
├── projects/                  # 14 个独立详情页（award-1…4 / project-1…6 / exp-1…4）
├── assets/
│   ├── figures/               # 项目配图（WebP）
│   └── og-*.png               # 社交分享封面
├── styles.css                 # 共享样式（Apple Design 设计系统）
├── script.js                  # 共享脚本（主题/动画/导航/表单/EmailJS）
├── i18n.js                    # 中英双语字典与切换逻辑
├── wave.js                    # 水面涟漪背景（Canvas2D）
├── details.js                 # 详情页数据（奖项 / 项目 / 经历）
├── resume.pdf                 # 简历（AI 方向）
├── resume-mech.pdf            # 简历（机械方向）
├── CNAME                      # GitHub Pages 自定义域名
├── robots.txt                 # 抓取规则 + Sitemap 声明
├── sitemap.xml                # 站点地图（19 条）
├── favicon.svg                # 矢量图标
├── apple-touch-icon.png       # iOS 主屏图标
├── indexnow-<key>.txt         # IndexNow 验证文件
└── README.md
```

## 内容维护

1. **改页面**：直接编辑对应 HTML；`styles.css` / `script.js` / `i18n.js` / `wave.js` 为全站共享
2. **改共享资源后必须升版本号**（关键）：
   ```html
   <link rel="stylesheet" href="styles.css?v=22">   <!-- 改成 23 -->
   <script src="i18n.js?v=15"></script>             <!-- 改成 16 -->
   ```
   否则浏览器会一直用缓存里的旧文件（表现为：新文案不生效、新版式不生效，甚至 i18n key 原样显示成 `FOOTER.MORE`）
3. **新增项目 / 荣誉页**：
   - 在 `details.js` 的 `DETAILS` 对象里加一条数据（`id` 作为 URL）
   - 复制 `projects/project-5.html`，改 `<meta name="detail-id" content="新 id">`，以及 title / description / canonical / og 相关标签
   - 把新 URL 加进 `sitemap.xml`
   - 在 `index.html` 对应卡片链接到新页面
4. **更新日志**：在 `changelog.html` 的 `.timeline` 里按时间倒序插入 `<article class="entry reveal">`
5. **提交推送**：`git add -A && git commit -m "..." && git push`，GitHub Pages 自动部署（约 30 秒）
6. **新页面想让搜索引擎更快收录**：用上面的 IndexNow 命令推送，或在 Google Search Console 里「请求编入索引」

## AI 助手架构

```
浏览者 → 页面 JS → cpolar 公网隧道 → 本地 n8n → DeepSeek
```

- 在线状态灯三态检测（连接中 / 在线 / 离线），走 n8n 轻量 health 端点
- 会话隔离：每个浏览者独立 `sessionId`，互不串记忆

> ⚠️ AI 助手依赖本机 n8n + cpolar 隧道运行，隧道 URL 变更时需同步更新 `ai-assistant.html` 中的 `API_URL`。

## 设计系统

| 设计令牌 | 值 |
|----------|-----|
| 主色 | `#0066cc` (Action Blue) |
| 背景 | `#f5f5f7` (Parchment) / `#000000` (Dark) |
| 正文色 | `#1d1d1f` (Ink) |
| 边框 | `#e0e0e0` (Hairline) |
| 字体 | Inter (Sans) / JetBrains Mono (Mono) |
| 圆角 | Apple Squircle 6 档：xs6 / sm10 / md14 / lg20 / xl28 / pill |
| 玻璃透明度 | 统一 `rgba(255,255,255,0.65)` / 暗色 `rgba(28,28,30,0.65)` |
| 按钮圆角 | 9999px (pill) |
| 阴影 | sm / md / lg / xl 四级体系 |

---

© 2026 欧阳威 · 站点更新记录见 [changelog](https://vvosp.top/changelog.html)
