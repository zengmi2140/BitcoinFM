# 产品需求文档 (PRD): Bitcoin FM

**版本：** v1.0 
**核心理念：** Signal over Noise, Low Time Preference.
**目标用户：** 比特币硬核爱好者（Bitcoiners），寻找随机性、惊喜感以及高质量内容的听众。

---

## 1. 产品概述 (Overview)

Bitcoin FM 是一个极简主义的网页版比特币播客电台。它通过算法引入“熵（Entropy）”，从精心挑选的 RSS 白名单中随机挖掘内容，打破推荐算法的回音室效应。

**核心价值：**

- **减少选择疲劳：** 不用思考听什么，让系统为你决定。
- **数字考古：** 在“低时间偏好”模式下，重现多年前的经典对话。
- **无缝体验：** 极简交互，沉浸式收听，后台播放支持。

---

## 2. 核心功能与交互 (Core Features)

### 2.1 随机推荐引擎 (The Entropy Engine)

这是产品的灵魂功能。

- **触发机制：** 页面加载或点击 **"Reseed Entropy"** 按钮。
- **逻辑流程：**
    1. 本地维护一个包含 N 个高质量 RSS URL 的白名单 Markdown 文件。
    2. **初始化：** 页面加载时，服务端读取并解析 Markdown 白名单，将完整的源列表注入前端。
    3. **随机抽取：** 前端从列表中随机抽取 3 个 RSS 源。
    4. **数据抓取：** 通过无服务器代理 (Serverless Proxy) 请求这 3 个源 (以绕过 CORS 限制)。
    5. **单集选择：** 根据当前的“时间偏好”设置，从每个源中选取 1 集节目。
    6. **渲染：** 渲染 3 张播客卡片。
- **交互动画：**
    - 按钮文案：`Reseed Entropy`
    - 图标：骰子 (Dice)。
    - 动作：点击后，骰子开始旋转 (`animate-spin`)，文案变为 `Reseeding...` ，直到新数据加载完成，骰子停止，文案恢复为`Reseed Entropy`。
- **数据源逻辑 (混合模式):**
    - **动态源 (Feeds):** 传统的 RSS 列表，需实时抓取并随机选一集。本地维护一个包含 N 个高质量 RSS URL 的白名单 Markdown 文件。
    - **静态源 (Singles):** 人工精选的特定单集数据 (已包含 MP3 直链)，无需解析 XML。
- **抽取算法：**
    1. 确定当前语言 (如 `zh`)。
    2. 加载该语言的 `feeds.md` 和 `singles.json`。
    3. 混合策略：随机从两个池子中抽取共 3 个项目。
        - 若抽中“动态源”，执行实时 RSS 抓取逻辑。通过无服务器代理 (Serverless Proxy) 请求被抽中的动态源 (以绕过 CORS 限制)。
        - 若抽中“静态源”，直接渲染卡片 (速度极快)。
    4. **单集选择：** 根据当前的“时间偏好”设置，从每个源中选取 1 集节目。
    5. 渲染 3 张播客卡片。

### 

### 2.2 时间偏好过滤器 (Time Preference Filter)

利用奥派经济学概念作为背景叙事，但 UI 开关文案采用更直观的 "All/New"。

- **位置：** 页面右上角或 Header 区域。
- **控件类型：** Toggle Switch (切换开关)。
- **状态定义：**
    - **New (最新)：** 更贴近当下的信号。
        - *逻辑：* 仅从 RSS 源的 **最新 10 集** 或 **最近 180 天** 的节目，以及静态源中发布时间在 180 天内的单集中随机。
    - **All (全部)：** 默认状态，从全量历史中随机。
        - *逻辑：* 从 RSS 源的 **所有历史剧集** 中和所有静态源中全量随机（可能是很多年前的播客）。
    - **交互增强 (Mobile/Desktop)：**
        - 点击切换时，页面顶部的 Tagline ("The Sound of Sound Money") 会暂时替换为对应模式的描述文案 (如 "A random walk down the Timechain")，持续 3 秒后自动恢复。此设计确保移动端也能获得清晰的上下文反馈，且不污染界面。

### 2.3 全局播放器 (Global Footer Player)

- **架构要求：** 播放器必须与主内容区（Main Content）**解耦**。
    - 点击 `Reseed Entropy` 刷新卡片时，**当前播放的声音不能中断**。
    - 使用 React Context (或 Zustand) 管理播放状态。
- **UI 布局 (移动端三明治结构)：**
    - **顶层：** 极细进度条 (2px)，可拖拽。
    - **中层（核心）：**
        - `Rewind 15s` (快退 15秒)
        - `Play/Pause` (播放/暂停 - 橙色高亮)
        - `Fast Forward 15s` (快进 15秒)
    - **底层（信息）：**
        - 左侧：滚动标题 (Marquee) - 防止长标题溢出。
        - 右侧：倍速按钮 (`1x`) - 点击弹出菜单 (0.75x, 1.0x, 1.25x, 1.5x, 2.0x)。

### 2.4 系统原生集成 (Media Session API)

**系统集成：** 必须实现 `Media Session API`，以支持移动端的锁屏控制和后台播放功能。

- **元数据：** 锁屏界面需显示 封面图、标题、播客名称。
- **控制：** 支持耳机线控/蓝牙控制（暂停、播放、下一首）。

---

## 3. UI/UX 设计规范 (Design Specs)

### 3.1 视觉风格

- **主题：** **Dark Mode Only** (强制暗黑模式)。
- **色板：**
    - 背景：`#111111` (Rich Black)
    - 主色/强调色：`#F7931A` (Bitcoin Orange)
    - 文字：`#E5E5E5` (主要), `#A3A3A3` (次要/日期)
- **字体：**
    - 正文：无衬线字体 (Inter, Roboto)。
    - 数据/随机数/时间：**等宽字体 (Monospace)**，强调极客感和计算感。

### 3.2 页面布局

1. **Header (顶部导航):**
    - **Left (品牌区):**
        - Logo / 标题: Bitcoin**FM**
        - Tagline (一句话介绍): **"The Sound of Sound Money"** (小字号，灰色，紧随标题下方或右侧)
    - **Right (功能区):**
        - Time Preference 开关 (All/New)。
        - Language Switcher (语言切换): 简易的文本切换 (如 `EN / 中文`)。
2. **Main (视口居中):**
    - **响应式卡片布局：**
        - **移动端 (Mobile):** 采用 **横向长条卡片 (List View)**。三张卡片垂直堆叠。
            - *布局结构：* 左侧方形封面图 (固定宽度) | 右侧信息区 (自适应)。
            - *信息层级：* 顶部播客名称 (小字灰阶) > 中间单集标题 (白色粗体, 最多2行) > 底部发布日期与时长 (等宽字体)。
        - **桌面端 (Desktop):** 采用 **竖版扑克牌卡片 (Card View)**。三张卡片水平并排。
            - *布局结构：* 顶部大封面图 (1:1 比例) | 下方信息区。
            - *视觉隐喻：* 类似塔罗牌或万智牌，强调“抽取”和“开盲盒”的仪式感。
    - **操作区：** 巨大的 `Reseed Entropy` 按钮位于卡片组下方居中。
3. **Footer (Sticky):**
    - 固定在屏幕底部，`z-index` 最高。

### 3.3 播客单集卡片 (主视图)

- **展示内容：** 封面图、单集标题、播客名称、发布日期、时长。
- **操作交互：** 点击后将该集载入到底部播放器。同时，卡片封面图处显示跳动的音律波形。

---

## 4. 技术架构 (Technical Stack)

- **前端框架：Next.js (App Router) + i18n Routing (或 URL Query 参数区分语言)。**
- **样式库：** Tailwind CSS。
- **图标库：** Lucide React (轻量、风格统一)。
- **部署平台：** Vercel 。
- **数据管理 (i18n & Hybrid)**

文件结构示例：

```
/content
  /en
    feeds.md          (英文 BTC-Only 播客列表)
    singles.json      (英文精选单集补充)
  /zh
    feeds.md          (中文 BTC-Only 播客列表)
    singles.json      (中文精选单集 - 包含非BTC播客的BTC单集)

```

关于 feeds.md：

使用 Markdown 文件 (`feeds.md`) 维护 RSS 源列表。服务端组件在构建时或运行时读取该文件，解析为 JSON 对象数组。

- **数据抓取：**
    - **客户端：** `fetch('/api/proxy?url=...')`
    - **服务端 (API Route):** 处理外部 RSS 请求以避免 CORS 跨域错误。
    - **性能优化：** 采用“先选后抓 (Pick then Fetch)”策略 (只抓取选中的 3 个源，而不是遍历整个数据库)。

---

## 5. 数据结构 (Data Structure)

### 5.1 本地 RSS 白名单 **(`feeds.md`)：**

- 采用标准 Markdown 列表格式，方便维护。
- 格式示例：
    
    ```
    - [The Stephan Livera Podcast](https://anchor.fm/s/...)
    - [What Bitcoin Did](https://feeds.simplecast.com/...)
    - [亿聪哲史](https://bg2.kaopubear.top/...)
    
    ```
    
- **解析逻辑：** 正则表达式提取 `[Name](URL)`，自动过滤掉不符合格式的行。

### **5.2 精选集 (`singles.json`):**

```
[
  {
    "title": "Episode Title",
    "podcastName": "Tech Podcast",
    "audioUrl": "https://.../file.mp3",
    "coverImage": "https://.../img.jpg",
    "pubDate": "2023-01-01T00:00:00Z",
    "duration": "3600"
  }
]

```

---

## 6. 异常处理 (Edge Cases)

1. **RSS 源失效/解析失败：**
    - 如果随机选中的源请求超时或 404，前端应自动从备选池中补一个，确保 UI 始终显示 3 个有效卡片。
2. **音频无法播放 (Dead Link)：**
    - 播放器触发 `onError` 事件。
    - UI 提示：“节点离线 (Node Offline)”。
    - 自动停止 loading 状态。
3. **移动端浏览器自动播放限制：**
    - 现代浏览器禁止自动播放声音。因此，切歌必须由用户点击触发，不能由代码自动触发（除非在播放列表中）。当前逻辑是用户点击播放，符合规范。

---

## 7. 后续迭代计划 (Roadmap V2)

- **Share Function (分享):** 生成带参数的链接 bitcoin`.fm/?play={guid}`，好友打开直接听这一集。
- **Lightning Tip (打赏):** 在播放器旁显示一个闪电网络二维码，支持直接给作者或平台打赏 Sats。

## 8. 文案与微文案

- **主按钮：** "Reseed Entropy" / "Reseeding..."
- **开关：** "Time Preference: All / New"
- **加载状态：** "Calculating Nonce..."

## 9. 开发实施指南 (AI Implementation Guidelines)

*此部分旨在指导 AI 编码工具进行具体的代码生成。*

### 9.1 推荐技术栈与依赖

- **状态管理:** `zustand` (用于全局播放器状态，避免 Context API 的重渲染问题)。
- **RSS 解析:** `rss-parser` (在 Next.js API Route 中使用)。
- **日期处理:** `dayjs` (轻量级，用于处理发布日期)。
- **图标库:** `lucide-react` (Dice5, Play, Pause, FastForward, Rewind)。
- **样式工具:** `clsx` 和 `tailwind-merge` (用于处理条件类名)。
- **动画库:** `framer-motion` (用于骰子转动和卡片切换动画，比纯 CSS 更平滑)。

### 9.2 目录结构建议

```
/app
  /[lang]             // i18n 路由 (zh, en)
    /api/proxy        // RSS 代理接口
    /miner            // 内部工具页面
    page.tsx          // 主页
  /components
    /player           // 播放器组件 (Player.tsx, Controls.tsx)
    /cards            // 卡片组件 (CardStack.tsx, EpisodeCard.tsx)
    /ui               // 基础 UI (Button.tsx, Toggle.tsx)
  /lib
    /store            // Zustand store (usePlayerStore.ts)
    /utils            // 工具函数 (rss-parser, randomness logic)
  /content            // Markdown 和 JSON 数据源

```

### 9.3 关键 Hook 逻辑

- **`useAudio`:** 封装 HTML5 `<audio>` 标签的所有逻辑，不要使用第三方音频库 (如 Howler)，保持原生轻量，但必须通过 `useEffect` 绑定 `navigator.mediaSession`。