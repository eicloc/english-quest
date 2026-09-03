# English Quest / 英语闯关岛

English Quest 是一款面向中国小学二年级、一对一远程英语教学的趣味学习工具。首页包含独立的“英语能力摸底”和“语法星球”两个板块：前者把听力、词汇、口语、场景理解、单词认读、自然拼读和句子理解包装成温和的七关冒险；后者用十关自动互动题系统练习人称、单复数和基础句型。两个板块的记录分别保存在当前浏览器中。

## 主要功能

- 老师带领与学生自主两种模式
- 7个主题关卡、稳定题序、关卡地图和参与徽章
- 独立语法星球：10关、140题题库、每次分层抽取80题与错题复习
- 听音选图、场景热点、选择题、口语/认读/拼读人工评分
- 词库优先使用 Wikimedia Commons 真人英美录音，闯关使用严格匹配口音的系统语音，Kokoro q8 仅作最终回退
- 独立 NGSL 1.2 词汇宝库：七阶段、搜索、分页、双 IPA、双语释义/例句/短语
- 星星、连对反馈、减少动画和无负面评价的儿童体验
- localStorage 自动保存、刷新恢复、暂停、重开和最近20次历史
- 儿童奖励页、七维教师报告、自动训练建议、打印和JSON导出
- 正式图片缺失时自动使用 CSS 场景和 Emoji，不依赖联网素材

## 技术栈

- Next.js 16 App Router、React 19、严格 TypeScript
- Tailwind CSS 4、Framer Motion、Lucide React
- Vitest、React Testing Library、jsdom
- pnpm 11

## 本地运行

需要 Node.js 20.9 或更高版本，以及 pnpm。

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:3000`。

词汇宝库位于 `/words/`。选中词条后只会按需预加载该词最多两条 Wikimedia
真人录音；没有对应口音录音时改用设备系统语音。只有系统语音也不可用时，浏览器
才会从 Hugging Face 下载约 92.4 MB 的 Kokoro q8 回退模型并写入浏览器缓存。

## 质量命令

```bash
pnpm typecheck
pnpm lint
pnpm test -- --run
PAGES_BASE_PATH=/english-quest pnpm build
pnpm start -- --base-path /english-quest
```

## 目录说明

```text
src/app                         页面路由与全局样式
src/components/assessment       通用题目、地图、反馈与进度组件
src/components/teacher          老师控制台
src/components/report           奖励页与能力报告
src/content                     词汇、题库、关卡和场景热点数据
src/features/assessment         类型、会话、计分、建议、存储与 reducer
src/features/speech             全局语音状态、Worker 协议与回退
src/features/dictionary         词库类型、分片加载器与 hooks
src/workers                     Kokoro q8/WASM 单例 Worker
scripts                         词库导入、Wiktextract 抓取与静态预览
public/content/dictionary       生成后的词库索引、字母分片、真人发音与来源清单
```

## 替换图片素材

### 单词图片

1. 将 PNG、WebP 或 SVG 放入 `public/content/vocabulary`。
2. 在 `src/content/vocabulary.ts` 对应词条增加：

```ts
imageSrc: "/content/vocabulary/apple.webp"
```

界面优先加载 `imageSrc`；文件缺失或加载失败时自动回退到词条的 `emoji`。

### 教室和公园场景

将场景文件保存为：

```text
public/content/scenes/classroom.webp
public/content/scenes/park.webp
```

场景热点在 `src/content/scenes.ts` 中使用0～100百分比坐标。正式图构图发生变化时，打开老师控制台的“热点边框”，再调整对应热点的 `x`、`y`、`width` 和 `height`。

### 头像和音效

头像可以放入 `public/content/avatars` 并扩展 `avatars` 数据。音效可以放入 `public/content/sounds`；当前版本默认通过 Web Audio API 生成短提示音，因此没有第三方版权依赖。

## 扩展内容

### 添加词汇

在 `src/content/vocabulary.ts` 添加唯一 `id`、中英文、Emoji、朗读文本和类别，再在 `src/content/questions.ts` 的题目选项中引用该 ID。

### 添加题型

1. 在 `src/features/assessment/types.ts` 扩展 `QuestionType` 和判别联合。
2. 在 `QuestionRenderer.tsx` 注册独立渲染组件。
3. 在 reducer 中补充该题型的记录动作，在 `scoring.ts` 中定义最高分与得分。
4. 为渲染、记录和计分增加测试。

### 修改评分规则

自动题与人工题的纯函数集中在 `src/features/assessment/scoring.ts`。修改后同时更新对应单元测试；UI 的星星和报告都从答题记录重新推导，不需要维护第二套分数状态。

## 数据与隐私

- 数据键为 `english-quest:v1`，只写入当前浏览器 localStorage。
- 默认保留最近20个会话，可在欢迎页清除已完成历史。
- JSON 导出只在用户点击时生成，不会上传到网络。
- 不收集账号、摄像头、麦克风或其他敏感信息。

## 重新生成词库

导入器接收本地原始文件并生成确定性 JSON；原始大文件不要放入仓库。最小导入只
需要 NGSL，完整导入可附加 ECDICT、Wiktextract 和 Tatoeba：

```bash
node scripts/fetch-wiktextract.mjs \
  --ngsl /path/to/NGSL_1.2_stats.csv \
  --supplemental data/dictionary-supplemental.txt \
  --supplemental-pronunciations data/dictionary-supplemental-pronunciations.json \
  --out /tmp/wiktextract-ngsl.jsonl

pnpm dictionary:import -- \
  --ngsl /path/to/NGSL_1.2_stats.csv \
  --ecdict /path/to/ecdict.csv \
  --wiktextract /tmp/wiktextract-ngsl.jsonl \
  --tatoeba-english /path/to/eng_sentences.tsv \
  --tatoeba-chinese /path/to/cmn_sentences.tsv \
  --tatoeba-links /path/to/eng-cmn_links.tsv \
  --source-date 2026-08-15 \
  --out public/content/dictionary

pnpm dictionary:audio -- \
  --index public/content/dictionary/index.json \
  --out public/content/dictionary/pronunciation-audio.json \
  --source-date 2026-08-22
```

生成器会校验 2,809 个 NGSL 排名词、唯一性、七阶段和 JSON 分片，并在
`sources.json` 记录词典版本、日期、SHA-256 与许可证。独立的
`pronunciation-audio.json` 只保留明确标记为 US/General American 或 UK/Received
Pronunciation 且具有自由许可证的 Commons 录音，并逐条保存作者、来源页与许可链接。
完整归属说明见 `THIRD_PARTY_NOTICES.md`。

## GitHub Pages

仓库包含 `.github/workflows/deploy-pages.yml`。在 GitHub 仓库设置中把 Pages
来源设为 **GitHub Actions**；推送到 `main` 后会依次安装、测试、类型检查、注入
仓库 `basePath`、静态导出并部署。闯关与报告使用查询参数路由，刷新不会依赖服务端。

## 当前 MVP 限制

- 没有后端、登录、跨设备同步、在线房间或多人实时控制。
- 不使用语音识别；口语、认读和拼读由老师人工判断。
- 自主模式只包含可自动判定关卡。
- Wikimedia 真人录音首次播放需要联网；缺失或加载失败时自动改用对应口音的设备系统语音。
- Kokoro 只在真人录音和系统语音都不可用时加载；首次回退需要联网。
- 本版本不是可安装 PWA；词库与闯关内容可静态加载，模型缓存由浏览器管理。

## 后续方向

最值得优先扩展的是老师端与学生端的实时同步和房间码。其后可考虑 NestJS/PostgreSQL、多学生档案、长期学习曲线、家长报告、内容编辑器、AI出题和合规的语音识别。
