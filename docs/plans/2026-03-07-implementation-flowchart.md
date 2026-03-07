# The AI Shelf — Implementation Flowchart

> 编码实现指南 | 2 小时 Hackathon Build
> 基于 V2 设计文档 + 竞品研究综合

---

## Quick Reference: Low Hanging Fruit (按优先级)

研究了 24+ 家 GEO 工具后，以下功能是"所有工具都有、实现简单、视觉冲击力大"的 must-have：

| # | 功能 | 耗时 | 来源 | 为什么必须有 |
|---|------|------|------|-------------|
| 1 | 品牌名高亮 | 5 min | GenRank, Profound | AI 回答中品牌名黄色高亮，一眼看到是否被提及 |
| 2 | SoM 大数字得分 | 10 min | Jellyfish, HubSpot | Hero metric — 评委第一眼看到的数字 |
| 3 | Leader/Challenger/Niche 徽章 | 5 min | HubSpot AEO Grader | 给分数赋予含义，极度 shareable |
| 4 | Sentiment 色标 | 10 min | 所有工具都有 | 绿/灰/红标签，每条回答一个 |
| 5 | 竞品提及计数 | 10 min | Otterly, Goodie | 品牌 vs 竞品提及次数对比 |
| 6 | 五维雷达图 | 20 min | HubSpot 5-dimension | Demo 的 "wow" 时刻 |
| 7 | Gap 对比表 | 20 min | Otterly Citations Gap | "竞品出现，你没有" = aha moment |
| 8 | Action Plan 卡片 | 15 min | AthenaHQ Action Center | 从分析到行动的闭环 |

**总计追加 ~95 min，已包含在原 2h timeline 中（融入各 Step 的前端渲染）**

---

## 技术栈确认

```
Framework:    Next.js 15 (App Router)
Language:     TypeScript
Styling:      Tailwind CSS + shadcn/ui
Charts:       Recharts (RadarChart, BarChart)
AI:           Claude API (Haiku 4.5) via Vercel AI SDK (ai + @ai-sdk/anthropic)
Structured Output: Zod schema + generateObject
Search:       Tavily API (@tavily/core)
Streaming:    SSE (Server-Sent Events) via ReadableStream
Deploy:       Vercel (one-click)
```

### 安装命令（第 0 步）

```bash
npx create-next-app@latest ai-shelf --typescript --tailwind --app --src-dir --use-npm
cd ai-shelf
npx shadcn@latest init
npx shadcn@latest add card progress badge table tabs input button separator
npm install ai @ai-sdk/anthropic @tavily/core zod recharts
```

---

## 文件结构

```
src/
├── app/
│   ├── page.tsx                    ← 主页面: 输入框 + 结果面板
│   ├── layout.tsx                  ← 全局布局 (深色主题)
│   └── api/
│       └── analyze/
│           └── route.ts            ← 核心 API: 编排 6 步, SSE 流式返回
├── components/
│   ├── brand-input.tsx             ← 品牌名 + 品类 + 地区输入表单
│   ├── progress-stepper.tsx        ← 6 步进度条 (带动画)
│   ├── step-panel.tsx              ← 通用步骤面板 (展开/折叠/loading)
│   ├── score-display.tsx           ← Hero 得分 + Leader/Challenger 徽章
│   ├── radar-chart.tsx             ← 五维雷达图
│   ├── competitor-bar.tsx          ← 竞品对比条形图
│   ├── evidence-card.tsx           ← AI 回答卡片 (含品牌高亮)
│   ├── source-link.tsx             ← 可点击来源链接
│   ├── intent-badge.tsx            ← Query 意图标签
│   ├── sentiment-badge.tsx         ← Sentiment 色标 (正面/中性/负面)
│   └── gap-table.tsx               ← Gap Analysis 对比表
├── lib/
│   ├── prompts.ts                  ← 所有 Claude system prompts
│   ├── analyze.ts                  ← 核心分析逻辑 (6 步编排)
│   ├── scoring.ts                  ← 评分计算公式
│   ├── tavily.ts                   ← Tavily API wrapper
│   └── types.ts                    ← TypeScript 类型定义
└── .env.local                      ← API keys
```

---

## 核心类型定义 (lib/types.ts)

```typescript
// === 输入 ===
interface AnalyzeRequest {
  brandName: string;       // "iCo Dental Group"
  category: string;        // "dental lab"
  region: string;          // "New Jersey"
}

// === Step 1: Query Generation ===
interface GeneratedQuery {
  query: string;           // "best dental lab in New Jersey"
  type: 'discovery' | 'verification';
  intent: string;          // "寻找行业领先者"
  intentEn: string;        // "Finding industry leaders"
}

// === Step 2: AI Response ===
interface AIResponse {
  query: string;
  type: 'discovery' | 'verification';  // ADD THIS LINE
  response: string;        // Claude 的完整回答
  brandMentioned: boolean;
  mentionPosition: number | null;  // 第几位提到 (null = 未提及)
  sentiment: 'positive' | 'neutral' | 'negative' | null;
  competitorsFound: string[];
}

// === Step 3: Web Reality ===
interface WebResult {
  query: string;
  sources: Array<{
    title: string;
    url: string;
    brandMentioned: boolean;
  }>;
  brandWebMentions: number;
  competitorWebMentions: Record<string, number>;
}

// === Step 4: Scores ===
interface Scores {
  discoveryScore: number;   // 0-100
  trustScore: number;       // 0-100
  overallScore: number;     // 0-100
  archetype: 'Leader' | 'Challenger' | 'Niche Player' | 'Invisible';
  radarScores: {
    recognition: number;    // 识别度
    sentiment: number;      // 情感倾向
    relevance: number;      // 相关性
    citation: number;       // 引用可能
    competitive: number;    // 竞争力
  };
  promptSensitivity: Array<{
    query: string;
    winner: string;
    opportunity: boolean;
  }>;
}

// === Step 5: Gap Analysis ===
interface GapItem {
  factor: string;          // "Wikipedia 页面"
  brandStatus: boolean;    // false
  competitorStatus: boolean; // true
  importance: string;      // "Wikipedia 占 LLM 训练数据 22%"
  sourceUrl: string;       // 证据链接
}

// === Step 6: Action Plan ===
interface ActionItem {
  priority: 1 | 2 | 3;
  title: string;
  description: string;
  gapReference: string;    // 对应 Step 5 中的哪个缺口
  expectedImpact: string;
  generatedContent?: string; // 自动生成的内容 (Wiki 草稿等)
}

// === SSE 事件 ===
type SSEEvent =
  | { step: 1; status: 'running' | 'done'; data?: GeneratedQuery[] }
  | { step: 2; status: 'running' | 'done'; data?: AIResponse[]; progress?: number }
  | { step: 3; status: 'running' | 'done'; data?: WebResult[]; progress?: number }
  | { step: 4; status: 'running' | 'done'; data?: Scores }
  | { step: 5; status: 'running' | 'done'; data?: GapItem[] }
  | { step: 6; status: 'running' | 'done'; data?: ActionItem[] }
  | { step: 'error'; message: string };
```

---

## 完整编码流程图

### Phase 1: 项目脚手架 (0:00 - 0:10)

```
[开始]
  │
  ├─ 1.1 create-next-app + 安装依赖
  │     npx create-next-app → shadcn init → npm install
  │
  ├─ 1.2 创建 .env.local
  │     ANTHROPIC_API_KEY=sk-ant-...
  │     TAVILY_API_KEY=tvly-...
  │
  ├─ 1.3 创建 lib/types.ts (上面的类型定义)
  │
  ├─ 1.4 创建 lib/prompts.ts (所有 prompt 模板)
  │
  └─ 1.5 验证: npm run dev 能跑起来
```

### Phase 2: 后端 API — Step 1-3 (0:10 - 0:30)

```
[api/analyze/route.ts]
  │
  ├─ 2.1 SSE 框架搭建
  │     export async function POST(req: Request) {
  │       const { brandName, category, region } = await req.json();
  │       const stream = new ReadableStream({ ... });
  │       return new Response(stream, {
  │         headers: { 'Content-Type': 'text/event-stream' }
  │       });
  │     }
  │
  ├─ 2.2 Step 1: Query Generation
  │     │
  │     ├─ 调用 Claude (Haiku 4.5)
  │     │   System: "你是 GEO 分析师..."
  │     │   User: "为 {brandName} ({category}, {region}) 生成 6 条搜索 query"
  │     │   Response format: JSON array of GeneratedQuery
  │     │
  │     ├─ 解析 JSON 响应
  │     │
  │     └─ SSE 发送: { step: 1, status: 'done', data: queries }
  │
  ├─ 2.3 Step 2: AI Responses (并行 ×6)
  │     │
  │     ├─ 对每条 query, 并行调用 Claude:
  │     │   发现型 prompt: "你是一位正在寻找 {category} 的专业人士..."
  │     │   验证型 prompt: "请告诉我关于 {brandName} 的信息..."
  │     │
  │     ├─ Promise.all(queries.map(q => callClaude(q)))
  │     │
  │     ├─ 对每个响应: 用 JS string matching 解析品牌提及、位置、情感、竞品
  │     │   (本地计算, 不需要额外 Claude 调用)
  │     │
  │     └─ SSE 发送: { step: 2, status: 'done', data: aiResponses }
  │
  └─ 2.4 Step 3: Web Reality Check (并行 ×6)
        │
        ├─ 对每条 query, 并行调用 Tavily /search:
        │   tvly.search(query, { maxResults: 5, searchDepth: 'basic' })
        │
        ├─ Promise.all(queries.map(q => tavily.search(q)))
        │
        ├─ 统计每个来源中品牌 + 竞品被提及次数
        │
        └─ SSE 发送: { step: 3, status: 'done', data: webResults }
```

### Phase 3: 后端 API — Step 4-6 (0:30 - 0:50)

```
[api/analyze/route.ts 续]
  │
  ├─ 3.1 Step 4: Score 计算 (纯本地计算, 不调 API)
  │     │
  │     ├─ discoveryScore = (发现型 query 中被提及数 / 3) × 100
  │     │
  │     ├─ trustScore = 验证型综合评估:
  │     │   - AI 知道品牌名? +20
  │     │   - AI 能描述业务? +20
  │     │   - AI 能引用评价? +20
  │     │   - AI 在对比中不输? +20
  │     │   - AI 推荐该品牌? +20
  │     │
  │     ├─ overallScore = discoveryScore × 0.5 + trustScore × 0.5
  │     │
  │     ├─ archetype:
  │     │   overall >= 70 → "Leader"
  │     │   overall >= 40 → "Challenger"
  │     │   overall >= 15 → "Niche Player"
  │     │   overall < 15  → "Invisible"
  │     │
  │     ├─ radarScores (Optional): 时间够再做。用 Claude 一次调用打 5 维分 (0-100)
  │     │   {recognition, sentiment, relevance, citation, competitive}
  │     │
  │     └─ SSE 发送: { step: 4, status: 'done', data: scores }
  │
  ├─ 3.2 Step 5: Gap Analysis
  │     │
  │     ├─ 调用 Tavily 搜索品牌 + 头部竞品的网络存在:
  │     │   - "{brand} wikipedia"
  │     │   - "{brand} schema.org"
  │     │   - "{brand} dentaltown / reddit / reviews"
  │     │   - 对竞品做同样搜索
  │     │
  │     ├─ 调用 Claude 综合分析:
  │     │   输入: AI 回答 + Web 搜索 + 品牌 vs 竞品对比
  │     │   输出: GapItem[] (结构化 JSON)
  │     │
  │     └─ SSE 发送: { step: 5, status: 'done', data: gaps }
  │
  └─ 3.3 Step 6: Action Plan
        │
        ├─ 调用 Claude:
        │   输入: 所有 gaps + 行业 + GEO 最佳实践
        │   输出: ActionItem[] (含自动生成的内容样本)
        │
        └─ SSE 发送: { step: 6, status: 'done', data: actions }
```

### Phase 4: 前端 — 骨架 + 输入 (0:50 - 1:05)

```
[page.tsx]
  │
  ├─ 4.1 布局: 深色主题, 居中容器
  │     layout.tsx: dark mode, font, metadata
  │     page.tsx: 标题 + 副标题 + 输入区 + 结果区
  │
  ├─ 4.2 BrandInput 组件
  │     │
  │     ├─ 3 个输入框: Brand Name / Category / Region
  │     ├─ "Analyze" 按钮 (大, 醒目)
  │     ├─ "Try: iCo Dental Group" 快捷按钮 (预填)
  │     │
  │     └─ 提交 → fetch('/api/analyze', { method: 'POST', body })
  │           → 开始消费 SSE 流
  │
  ├─ 4.3 SSE 消费逻辑 (page.tsx 内)
  │     │
  │     ├─ const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  │     ├─ while (!done) { read() → parse SSE → setState }
  │     │
  │     └─ State 结构:
  │         currentStep: number (1-6)
  │         step1Data: GeneratedQuery[] | null
  │         step2Data: AIResponse[] | null
  │         step3Data: WebResult[] | null
  │         step4Data: Scores | null
  │         step5Data: GapItem[] | null
  │         step6Data: ActionItem[] | null
  │
  └─ 4.4 ProgressStepper 组件
        │
        ├─ 6 个圆点/图标, 水平排列
        ├─ 当前步骤: 旋转动画 + "正在分析..."
        ├─ 已完成: 绿色勾 ✓
        ├─ 未开始: 灰色
        │
        └─ 每步标签:
            1: "生成搜索问题" / "Generating Queries"
            2: "获取 AI 回答" / "Querying AI"
            3: "搜索网页验证" / "Web Reality Check"
            4: "计算得分" / "Scoring"
            5: "差距分析" / "Gap Analysis"
            6: "行动方案" / "Action Plan"
```

### Phase 5: 前端 — 结果渲染 (1:05 - 1:30)

```
[各 Step 面板的渲染]
  │
  ├─ 5.1 Step 1 面板: Query 列表
  │     ├─ 分两组: "发现型" / "验证型"
  │     ├─ 每条 query 旁边: IntentBadge (意图标签)
  │     └─ 颜色: 发现型=蓝色, 验证型=紫色
  │
  ├─ 5.2 Step 2 面板: AI 回答卡片
  │     ├─ 每条 query 一张 EvidenceCard:
  │     │   - Query 文本 + IntentBadge
  │     │   - AI 完整回答 (可折叠, 默认折叠)
  │     │   - 品牌名高亮 (regex replace → <mark>)   ← LOW HANGING FRUIT #1
  │     │   - 状态: ✅ 被提及 / ❌ 未提及 / ⚠️ 信息不全
  │     │   - SentimentBadge: 🟢正面 / ⚪中性 / 🔴负面  ← LOW HANGING FRUIT #4
  │     │   - 竞品列表: "Also mentioned: Glidewell, Marotta"
  │     │
  │     └─ 小结: "iCo 在 6 条问题中被提及 1 次"
  │
  ├─ 5.3 Step 3 面板: Web 搜索结果
  │     ├─ 每条 query 的 Top 5 来源 (SourceLink 组件)
  │     ├─ 品牌在网页中被提及次数统计
  │     ├─ "AI 知道 vs 网上有" 差距指示器
  │     │
  │     └─ 综合统计条形图 (CompetitorBar):          ← LOW HANGING FRUIT #5
  │         Glidewell ████████████ 28
  │         Marotta   ██████ 10
  │         iCo       ██ 3
  │
  ├─ 5.4 Step 4 面板: 得分展示 (最重要的视觉区域)
  │     │
  │     ├─ ScoreDisplay 组件:
  │     │   ┌─────────────────────────────────┐
  │     │   │  Overall: 12/100    [Invisible] │  ← Hero 数字 + 徽章
  │     │   │                                 │     LOW HANGING FRUIT #2 #3
  │     │   │  Discovery: 0%   Trust: 15%     │
  │     │   └─────────────────────────────────┘
  │     │
  │     ├─ RadarChart 组件 (recharts):               ← LOW HANGING FRUIT #6
  │     │   5 维: Recognition / Sentiment / Relevance / Citation / Competitive
  │     │   品牌 vs 竞品两条线叠加
  │     │
  │     └─ Prompt Sensitivity 表:
  │         每条 query → 谁赢了 → 有无机会窗口
  │
  ├─ 5.5 Step 5 面板: Gap Analysis
  │     │
  │     └─ GapTable 组件:                            ← LOW HANGING FRUIT #7
  │         | 因素 | iCo | Glidewell | 重要性 | 来源 |
  │         |------|-----|-----------|--------|------|
  │         | Wikipedia | ❌ | ✅ | LLM 训练数据 22% | 🔗 |
  │         | Schema.org | ❌ | ✅ | AI 读取结构化数据 | 🔗 |
  │         | DentalTown | ❌ | ✅ | 行业论坛权重高 | 🔗 |
  │         | Google Reviews | ⚠️ <10 | ✅ 3000+ | 用户口碑来源 | 🔗 |
  │
  └─ 5.6 Step 6 面板: Action Plan
        │
        └─ Action Plan 卡片:                         ← LOW HANGING FRUIT #8
            3 张卡片 (Priority 1/2/3)
            每张: 标题 + 描述 + 对应缺口 + 预期效果
            Priority 1 卡片含自动生成内容 (Wiki 草稿, Schema JSON-LD)
            红/黄/绿边框表示优先级
```

### Phase 6: 集成 + 部署 (1:30 - 1:45)

```
[集成测试 + 部署]
  │
  ├─ 6.1 End-to-end 测试
  │     └─ 用 "iCo Dental Group" / "dental lab" / "New Jersey" 跑完整流程
  │        确认 6 步全部渲染, 无报错
  │
  ├─ 6.2 Error handling
  │     ├─ API key 缺失 → 友好提示
  │     ├─ Claude/Tavily 超时 → retry 1 次, 然后显示 "部分结果"
  │     └─ JSON 解析失败 → fallback 显示原始文本
  │
  ├─ 6.3 "Try Example" 按钮
  │     └─ 一键填入 iCo 信息, 方便评委体验
  │
  ├─ 6.4 预热缓存 (可选)
  │     └─ Demo 前先跑一次 iCo, 确保第二次更快
  │
  └─ 6.5 Vercel 部署
        ├─ vercel login
        ├─ vercel env add ANTHROPIC_API_KEY
        ├─ vercel env add TAVILY_API_KEY
        └─ vercel --prod
```

### Phase 7: Polish + Demo 准备 (1:45 - 2:00)

```
[最后收尾]
  │
  ├─ 7.1 视觉 polish
  │     ├─ 加载动画 (skeleton/pulse)
  │     ├─ 步骤切换过渡动画
  │     └─ 响应式 (确保手机能看)
  │
  ├─ 7.2 录屏备份
  │     └─ 用 iCo 跑一遍完整 demo, 录屏保存
  │        (防止 live demo 时 API 挂了)
  │
  └─ 7.3 练习 Pitch (3 分钟)
        ├─ Hook: "iCo 的销售上门后, 牙医问 AI..."
        ├─ Demo: 输入 → 6 步 → 重点讲 Step 2 + Step 4
        ├─ So What: "30 秒发现盲区, 诊断原因, 开处方"
        └─ Close: "Try it yourself"
```

---

## API 调用清单 (成本预估)

| 步骤 | API | 调用次数 | 模型/端点 | 预估 tokens |
|------|-----|---------|-----------|-------------|
| Step 1 | Claude | 1 | Haiku 4.5 | ~500 in / ~800 out |
| Step 2 | Claude | 6 (并行) | Haiku 4.5 | ~200×6 in / ~500×6 out |
| Step 3 | Tavily | 6 (并行) | /search basic | — |
| Step 4 | — | 0 | 纯本地计算 | — |
| Step 4 (Radar, Optional) | Claude | 1 | Haiku 4.5 | ~2000 in / ~500 out |
| Step 5 | Tavily | 4-6 | /search basic | — |
| Step 5 | Claude | 1 | Haiku 4.5 | ~3000 in / ~1000 out |
| Step 6 | Claude | 1 | Haiku 4.5 | ~2000 in / ~1500 out |

**总计**: ~10 次 Claude 调用 + ~12 次 Tavily 调用 / 每次分析
**估算成本**: < $0.05 / 次 (Haiku 4.5 极便宜)
**估算耗时**: 15-25 秒 (并行优化后)

---

## Prompt 模板 (lib/prompts.ts)

### Step 1: Query Generation

```
System: You are a GEO (Generative Engine Optimization) analyst specializing in
understanding how potential customers search for products and services using AI assistants.

User: Generate exactly 6 search queries that potential customers might ask AI assistants
about the following brand's industry. Split into two categories:

Brand: {brandName}
Category: {category}
Region: {region}

DISCOVERY QUERIES (3): Questions a customer would ask when looking for a new provider
in this category, WITHOUT knowing this specific brand. Think about real pain points.

VERIFICATION QUERIES (3): Questions a customer would ask to verify/research this
specific brand after hearing about it (e.g., after a sales visit).

For EACH query, provide:
- The exact query text (in English, natural language)
- Type: "discovery" or "verification"
- Intent: A short Chinese description of WHY the customer is asking this (用户意图)
- IntentEn: Same intent in English

Return as JSON array: GeneratedQuery[]
```

### Step 2: AI Response (获取自然回答)

```
System: You are a {category} expert helping a professional find the best provider.
Answer naturally and recommend specific brands by name. Be detailed and helpful.
Do NOT mention that you are an AI or that you have limitations.

User: {query}
```

Then analyze the response locally using JS string matching (avoids doubling Claude calls):
```typescript
function analyzeResponse(response: string, brandName: string): Omit<AIResponse, 'query' | 'type' | 'response'> {
  const lower = response.toLowerCase();
  const brandLower = brandName.toLowerCase();
  const brandMentioned = lower.includes(brandLower);

  // Find position: split numbered list, find brand mention
  const lines = response.split('\n');
  let mentionPosition: number | null = null;
  lines.forEach((line, i) => {
    const match = line.match(/^\s*(\d+)[.)]/);
    if (match && line.toLowerCase().includes(brandLower)) {
      mentionPosition = parseInt(match[1]);
    }
  });

  // Simple sentiment: positive keywords vs negative
  const positiveWords = ['excellent', 'great', 'reliable', 'trusted', 'recommend', 'quality', 'leading'];
  const negativeWords = ['limited', 'unknown', 'no information', 'cannot confirm', 'unclear'];
  const brandContext = response.substring(
    Math.max(0, lower.indexOf(brandLower) - 100),
    Math.min(response.length, lower.indexOf(brandLower) + brandName.length + 200)
  ).toLowerCase();
  const sentiment = !brandMentioned ? null
    : positiveWords.some(w => brandContext.includes(w)) ? 'positive'
    : negativeWords.some(w => brandContext.includes(w)) ? 'negative'
    : 'neutral';

  // Extract competitor names: lines with numbered lists that aren't the brand
  const competitorsFound: string[] = [];
  lines.forEach(line => {
    const match = line.match(/^\s*\d+[.)]\s*\*?\*?([^-–:*]+)/);
    if (match) {
      const name = match[1].trim();
      if (name.length > 2 && name.length < 50 && !name.toLowerCase().includes(brandLower)) {
        competitorsFound.push(name);
      }
    }
  });

  return { brandMentioned, mentionPosition, sentiment, competitorsFound };
}
```

### Step 4: Radar Scoring

```
System: You are a brand visibility analyst. Score this brand on 5 dimensions (0-100).

Based on the following data:
- AI responses to 6 queries: {step2Summary}
- Web search results: {step3Summary}

Score {brandName} on:
1. Recognition (识别度): How well does AI know this brand?
2. Sentiment (情感倾向): How positively does AI describe this brand?
3. Relevance (相关性): How relevant are AI mentions to the brand's actual services?
4. Citation (引用可能): How likely is AI to cite/recommend this brand?
5. Competitive (竞争力): How does this brand compare to competitors in AI responses?

Return JSON: { recognition, sentiment, relevance, citation, competitive }
```

### Step 5: Gap Analysis

```
System: You are a GEO gap analyst. Compare {brandName} vs its top competitor based on
web presence data. Identify specific factors that explain WHY AI knows the competitor
but not this brand.

Web search data for {brandName}: {brandWebData}
Web search data for competitor: {competitorWebData}
AI responses: {step2Data}

Return JSON array of GapItem[]:
{
  "factor": "name of the gap factor",
  "brandStatus": boolean,
  "competitorStatus": boolean,
  "importance": "why this matters for AI visibility",
  "sourceUrl": "evidence URL"
}

Focus on: Wikipedia, Schema.org, industry forums, review sites, content depth,
structured data, social media presence.
```

### Step 6: Action Plan

```
System: You are a GEO strategy consultant. Based on the gap analysis, create a
prioritized action plan to improve {brandName}'s AI visibility.

Gaps identified: {step5Data}
Brand info: {brandName}, {category}, {region}

For Priority 1 items, generate ACTUAL CONTENT the brand can use immediately:
- Wikipedia draft paragraph
- Schema.org JSON-LD code
- Comparison page outline

Return JSON array of ActionItem[]:
{
  "priority": 1|2|3,
  "title": "action title",
  "description": "what to do and why",
  "gapReference": "which gap this addresses",
  "expectedImpact": "expected improvement",
  "generatedContent": "actual usable content (for P1 only)"
}
```

---

## 评分公式 (lib/scoring.ts)

```typescript
function calculateScores(
  aiResponses: AIResponse[],
  webResults: WebResult[],
  radarScores: RadarScores  // Optional: only if time permits
): Scores {
  const discoveryResponses = aiResponses.filter(r => r.type === 'discovery');
  const verificationResponses = aiResponses.filter(r => r.type === 'verification');

  // Discovery Score: 发现型 query 中被提及的比例
  const discoveryScore = Math.round(
    (discoveryResponses.filter(r => r.brandMentioned).length / discoveryResponses.length) * 100
  );

  // Trust Score: 验证型综合评估
  const trustFactors = verificationResponses.map(r => {
    let score = 0;
    if (r.brandMentioned) score += 20;           // AI 知道你
    if (r.response.length > 200) score += 20;     // AI 能详细描述
    if (r.sentiment === 'positive') score += 20;  // 正面评价
    if (r.mentionPosition === 1) score += 20;     // 排在第一
    if (r.competitorsFound.length === 0 ||
        r.brandMentioned) score += 20;            // 不输给竞品
    return score;
  });
  const trustScore = Math.round(
    trustFactors.reduce((a, b) => a + b, 0) / trustFactors.length
  );

  // Overall Score
  const overallScore = Math.round(discoveryScore * 0.5 + trustScore * 0.5);

  // Archetype
  const archetype =
    overallScore >= 70 ? 'Leader' :
    overallScore >= 40 ? 'Challenger' :
    overallScore >= 15 ? 'Niche Player' : 'Invisible';

  return { discoveryScore, trustScore, overallScore, archetype, radarScores };
}
```

---

## 关键实现细节

### SSE 流式推送 (api/analyze/route.ts)

```typescript
export async function POST(req: Request) {
  const body = await req.json() as AnalyzeRequest;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (event: SSEEvent) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
      };

      try {
        // 每次 Claude 调用使用 Vercel AI SDK:
        // import { generateText, generateObject } from 'ai';
        // import { anthropic } from '@ai-sdk/anthropic';
        // const model = anthropic('claude-haiku-4-5-20251001');

        // Step 1
        send({ step: 1, status: 'running' });
        const queries = await generateQueries(body);
        send({ step: 1, status: 'done', data: queries });

        // Step 2 + 3 (可以并行!)
        send({ step: 2, status: 'running' });
        send({ step: 3, status: 'running' });
        const [aiResponses, webResults] = await Promise.all([
          getAIResponses(queries),
          getWebResults(queries),
        ]);
        send({ step: 2, status: 'done', data: aiResponses });
        send({ step: 3, status: 'done', data: webResults });

        // Step 4
        send({ step: 4, status: 'running' });
        const scores = await calculateScores(aiResponses, webResults);
        send({ step: 4, status: 'done', data: scores });

        // Step 5
        send({ step: 5, status: 'running' });
        const gaps = await analyzeGaps(body, aiResponses, webResults);
        send({ step: 5, status: 'done', data: gaps });

        // Step 6
        send({ step: 6, status: 'running' });
        const actions = await generateActionPlan(body, gaps);
        send({ step: 6, status: 'done', data: actions });

      } catch (error) {
        send({ step: 'error', message: String(error) });
      }

      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    }
  });
}
```

### 前端 SSE 消费 (page.tsx)

```typescript
const analyzeref = async (input: AnalyzeRequest) => {
  setIsAnalyzing(true);
  setCurrentStep(1);

  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const reader = res.body!
    .pipeThrough(new TextDecoderStream())
    .getReader();

  let buffer = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += value;
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const event: SSEEvent = JSON.parse(line.slice(6));

      if (event.status === 'running') setCurrentStep(event.step);
      if (event.step === 1 && event.data) setStep1Data(event.data);
      if (event.step === 2 && event.data) setStep2Data(event.data);
      // ... etc
    }
  }

  setIsAnalyzing(false);
};
```

### 品牌名高亮 (components/evidence-card.tsx)

```typescript
function highlightBrand(text: string, brand: string): React.ReactNode {
  const parts = text.split(new RegExp(`(${brand})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === brand.toLowerCase()
      ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-semibold">{part}</mark>
      : part
  );
}
```

---

## Hackathon 评分对照

| 评判维度 (权重) | 我们如何满足 | 哪个 Step |
|---|---|---|
| **Reliability (30%)** | Vercel 部署 + 每个结论有可点击来源链接 + SSE 流式 (不卡顿) + error handling | 全部 |
| **Insight Quality (25%)** | 双场景 + 意图分析 + Trust Score + Radar 五维图 + Gap Analysis + 真实品牌数据 | 1,4,5 |
| **Technical Robustness (25%)** | Tavily 深度使用 (12 次调用) + Claude 结构化输出 + 并行 API + SSE 流式 | 2,3 |
| **Clarity to CEO (20%)** | "AI 说不认识你" Hook + 12/100 Invisible 徽章 + 对比表 + 自动生成内容 | 4,5,6 |
