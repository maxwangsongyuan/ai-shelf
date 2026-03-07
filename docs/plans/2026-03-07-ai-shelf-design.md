# The AI Shelf — 产品设计文档 (V2)

> Pulse AI × CASTGNY Hackathon 参赛项目
> 日期：2026-03-07 | 团队：Max Wang (Solo)
> V2: 整合双场景逻辑 + 用户意图分析 + 完整闭环

---

## 一、核心问题：品牌在 AI 时代的隐形危机

### 真实场景

iCo Dental Group 是一家 NJ 的 dental lab（牙科技工所），服务 500+ 诊所，做牙冠、种植体冠、义齿。他们的销售每天出去陌拜牙医诊所，留下报价单和公司资料。

**但他们不知道的是：** 在他们的销售离开之后，牙医会做一件事——

```
销售上门拜访，留下报价单
        ↓
牙医拿起手机/电脑
        ↓
问 AI："iCo Dental Group 怎么样？"
        ↓
AI 回答："I don't have specific information about iCo Dental Group..."
        ↓
牙医心想：连 AI 都不认识？算了，还是用现在的 lab 吧
        ↓
报价单进垃圾桶 🗑️
```

**这就是 iCo 不知道的"暗亏"。** 他们花了 5 年做地推、做 SEO、做邮件营销，但从来没有管理过自己在 AI 中的存在感。每一次销售拜访的转化率，都被 AI 的"不认识"悄悄拉低了。

同样的问题还发生在另一个场景：当牙医**主动**寻找新 lab 时（比如对现在的 lab 不满意），他们可能直接问 AI "best dental lab in NJ"——如果 iCo 不在回答里，这个潜在客户从一开始就被丢掉了。

### 行业背景：GEO（Generative Engine Optimization）

- **SEO（过去 10 年）**：让品牌在 Google 搜索结果中排名靠前
- **GEO（现在）**：让品牌在 AI 回答中被提到。这是 SEO 的下一代演进
- 全球已有 24+ 家公司融了 $200M+ 在做 GEO 工具
- Princeton/IIT Delhi 学术研究表明 GEO 优化可提升品牌 AI 可见度 40%
- SparkToro 研究发现：AI 品牌推荐极不稳定（<1% 一致性），因此真正可靠的指标是**品牌被提及的百分比**，而非排名

---

## 二、产品定义：The AI Shelf 做什么

### 一句话

**The AI Shelf 帮品牌回答一个他们从来没想过的问题：当客户问 AI 关于你的时候，AI 说了什么？**

然后告诉他们：为什么 AI 不认识你，竞品做了什么你没做的，以及具体怎么修。

### 比喻：AI 货架

传统零售中，品牌在超市货架上的位置决定了销量。AI 时代也有一个"货架"——只是它是隐形的。当用户问 AI 推荐品牌时，AI 回答中提到的品牌就在"货架上"，没提到的就不存在。

**The AI Shelf 做的事情就是：**
1. **让你看到**这个隐形货架（你在哪个位置？竞品在哪？）
2. **告诉你为什么**你在这个位置（缺了什么？别人多了什么？）
3. **帮你往上挪**（具体做什么能改善位置？）

### 核心功能三步

```
测量  →  你在 AI 货架上的位置是什么？（Share of Model 得分）
诊断  →  为什么你在这个位置？（Gap Analysis）
处方  →  怎么挪到更好的位置？（Action Plan）
```

---

## 三、双场景分析：发现型 + 验证型

这是本产品的核心设计思想。**牙医问 AI 关于 dental lab 的问题分两种类型，我们都要覆盖。**

### 场景 A：发现型搜索（Discovery）

**触发情境**：牙医对现有 lab 不满意，或者想找 backup lab，主动去搜索

**典型 query**：
```
"best dental lab in New Jersey"
"affordable zirconia crown lab near me"
"dental lab with fast turnaround NJ"
```

**背后的意图（Intent）**：
- "best dental lab in NJ" → 意图：**寻找行业领先者**，想知道市场上谁最好
- "affordable zirconia lab" → 意图：**控制成本**，当前 lab 太贵了，想找更便宜的
- "fast turnaround lab" → 意图：**解决交期痛点**，当前 lab 交货太慢，急需替代

**对 iCo 的含义**：如果 iCo 不出现在这些回答里，就永远不会被这些主动寻找的牙医发现。

### 场景 B：验证型搜索（Verification）

**触发情境**：iCo 销售刚上门拜访留了报价单，牙医去核实这家公司

**典型 query**：
```
"iCo Dental Group reviews"
"Is iCo Dental Lab reliable?"
"iCo Dental Group vs Glidewell"
```

**背后的意图（Intent）**：
- "iCo Dental Group reviews" → 意图：**信任验证**，这家公司靠谱吗？别人怎么说？
- "Is iCo Dental Lab reliable?" → 意图：**风险评估**，换 lab 有风险，我需要确认
- "iCo vs Glidewell" → 意图：**比较决策**，和我现有的 lab 比，到底谁好？

**对 iCo 的含义**：销售花了 1 小时上门拜访建立的信任，可能在牙医问 AI 的 10 秒钟内被摧毁——因为 AI 说"我不了解这家公司"。

### 为什么两种都要做

| | 发现型 | 验证型 |
|---|---|---|
| Hackathon 评判需要 | ✅ 是 SoM 的核心定义 | 加分项 |
| 真实商业价值 | 中（牙医不常主动搜 lab） | 极高（直接影响销售转化） |
| 产品差异化 | 其他团队也会做 | 我们独有的洞察 |
| 技术实现 | 同样的 pipeline | 同样的 pipeline |

**结论：6 条 query 中，3 条发现型 + 3 条验证型，两手都抓。**

---

## 四、产品功能设计（6 个 Step）

产品是一个**单页面 Web 应用**。用户输入品牌名、品类、地区，系统自动执行 6 步分析。每一步的过程、中间数据、来源链接全部展示，用户可以自己验证每个结论是否属实。

### Step 1: Query Generation — 模拟客户会问什么

**目的**：自动生成潜在客户（牙医）在 AI 中可能会搜索的真实问题。不是随机生成，而是根据行业知识推断每条 query 背后的意图。

**实现**：Claude API 根据品牌名 + 品类 + 地区 + 行业特征，生成 6 条 query。

**展示内容**：
- 6 条 query，分为"发现型"和"验证型"两组
- 每条 query 旁标注**搜索意图**（Intent）——这是我们的差异化特征，让评委看到我们理解用户行为，而不只是机械地生成关键词

**示例**：
```
┌─ 发现型搜索 (Discovery) ──────────────────────────────────────┐
│                                                                │
│  Q1: "best dental lab in New Jersey"                           │
│      Intent: 寻找行业领先者 — 牙医想知道市场上谁最好           │
│                                                                │
│  Q2: "affordable zirconia crown lab near me"                   │
│      Intent: 控制成本 — 当前 lab 太贵，寻找性价比替代          │
│                                                                │
│  Q3: "dental lab with fast turnaround NJ"                      │
│      Intent: 解决交期痛点 — 当前 lab 交货慢，需要加急方案      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

┌─ 验证型搜索 (Verification) ───────────────────────────────────┐
│                                                                │
│  Q4: "iCo Dental Group reviews"                                │
│      Intent: 信任验证 — 销售来过，牙医想确认公司是否靠谱       │
│                                                                │
│  Q5: "iCo Dental Lab vs Glidewell"                             │
│      Intent: 比较决策 — 和现有 lab 比较，决定是否切换          │
│                                                                │
│  Q6: "iCo Dental Group quality and turnaround time"            │
│      Intent: 具体验证 — 销售说 7 天交付，AI 能否确认？         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Step 2: AI Responses — AI 到底说了什么

**目的**：对每条 query，记录 AI 的完整原始回答。让品牌方第一次看到 AI 是怎么描述（或忽略）他们的。

**实现**：对每条 query 调用 Claude API。发现型 query 让 Claude 扮演正在选 lab 的牙医；验证型 query 直接问 Claude 对品牌的了解。

**展示内容**：
- 每条 query 的 AI **完整原始回答**（可展开/折叠）
- 品牌提及状态：✅ 被提及 / ❌ 未被提及 / ⚠️ 信息不完整
- 如果被提及：出现在第几位？语境是正面、中性还是负面？
- 被提到的所有竞品名单
- 发现型和验证型的结果分开展示，让对比更清晰

**示例**：
```
── 发现型结果 ──────────────────────────────────────────────

Q1: "best dental lab in New Jersey"
┌────────────────────────────────────────────────────────┐
│ Claude's Response:                                     │
│ "Some well-regarded dental labs in NJ include:         │
│  1. Marotta Dental Studio - known for...               │
│  2. Dental Arts Laboratory - specializes in...         │
│  3. Nobilium - offers..."                              │
│                                                        │
│ iCo Dental Group: ❌ NOT MENTIONED                     │
│ Competitors found: Marotta, Dental Arts, Nobilium      │
└────────────────────────────────────────────────────────┘

── 验证型结果 ──────────────────────────────────────────────

Q4: "iCo Dental Group reviews"
┌────────────────────────────────────────────────────────┐
│ Claude's Response:                                     │
│ "I don't have specific detailed information about      │
│  iCo Dental Group's reviews. They appear to be a       │
│  dental services company based in Princeton, NJ,       │
│  but I'd recommend checking Google Reviews or          │
│  DentalTown for firsthand feedback from dentists."     │
│                                                        │
│ iCo Dental Group: ⚠️ MENTIONED BUT NO USEFUL INFO     │
│ AI 承认知道这个名字，但无法提供任何实质内容             │
│ → 这就是牙医看到后会失去信心的回答                     │
└────────────────────────────────────────────────────────┘

Q5: "iCo Dental Lab vs Glidewell"
┌────────────────────────────────────────────────────────┐
│ Claude's Response:                                     │
│ "Glidewell is one of the largest dental labs in the    │
│  US, known for their BruxZir zirconia crowns...        │
│  [详细描述 Glidewell]                                  │
│                                                        │
│  Regarding iCo Dental, I have limited information...   │
│  [几乎无法描述 iCo]"                                   │
│                                                        │
│ 结论：AI 能详细介绍 Glidewell 但无法介绍 iCo           │
│ → 在比较中，iCo 自动输了                               │
└────────────────────────────────────────────────────────┘
```

### Step 3: Web Reality Check — 真实网络上能找到什么

**目的**：用 Tavily Search 搜索同样的 query，看真实网络上关于这些品牌有什么内容。这提供了"AI 世界" vs "真实世界"的对比——也许 iCo 在 Google 上有存在感，但 AI 不知道？或者两边都没有？

**实现**：对每条 query 调用 Tavily `/search` API，获取真实搜索结果。

**展示内容**：
- 每条 query 的 Tavily 搜索结果（前 5 条来源的标题 + URL）
- 各品牌在真实网页中的提及次数统计
- 所有来源 URL（**可点击验证** — 这是我们 Reliability 的关键体现）
- "AI 知道" vs "网上有" 的差距对比

**示例**：
```
Q1: "best dental lab in New Jersey"

  Source 1: yelp.com/nj-dental-labs
            → mentions: Glidewell, Marotta
  Source 2: dentaltown.com/forum/best-lab-nj
            → mentions: Glidewell, Nobilium, Bay Dental
  Source 3: reddit.com/r/dentistry/nj_lab_recs
            → mentions: Glidewell
  Source 4: healthgrades.com/dental-labs
            → mentions: Dental Arts
  Source 5: google.com/maps/dental+lab+nj
            → mentions: iCo Dental Group ✅ (Google Maps 有)

Q4: "iCo Dental Group reviews"

  Source 1: icodentalgroup.com (官网)
            → 公司介绍，但无客户评价
  Source 2: google.com/maps/iCo+Dental+Group
            → 少量 Google Reviews
  Source 3: bbb.org (Better Business Bureau)
            → 未找到 iCo 页面
  Source 4: dentaltown.com
            → ❌ 无相关帖子
  Source 5: yelp.com
            → ❌ 未找到 iCo 页面

综合统计 (across all 6 queries):
  Glidewell ·········· 28 mentions  ████████████████
  Marotta ············ 10 mentions  ██████
  Nobilium ··········· 6 mentions   ████
  iCo Dental Group ·· 3 mentions   ██
```

### Step 4: Score — 你在 AI 货架上的位置

**目的**：用清晰的数字告诉品牌方——你的 AI 可见度到底是多少。分两个维度打分。

**实现**：综合 Step 2 和 Step 3 的数据，计算两个核心指标。

**展示内容**：

**指标一 — Discovery Score（发现型得分）**：
当牙医主动搜索 "best dental lab" 时，AI 提到你的概率

```
Discovery Score — "牙医找你的概率":
  iCo Dental Group:  0%  (0/3 发现型 query 被提到)  🔴
  Glidewell:        100% (3/3)                       🟢
  Marotta:          67%  (2/3)                       🟡
```

**指标二 — Trust Score（信任验证得分）**：
当牙医拿着你的报价单问 AI 验证时，AI 能给出多少有价值的信息

```
Trust Score — "AI 能为你背书的程度":
  iCo Dental Group:  15%  🔴
    → AI 知道名字但无法描述业务细节
    → 无法提供评价信息
    → 在对比中完全输给竞品

  Glidewell:         92%  🟢
    → AI 能详细描述产品线、历史、优势
    → 能引用具体评价和行业地位
    → 在对比中占绝对优势
```

**指标三 — Prompt Sensitivity（提示词敏感度）**：
不同的问法如何改变结果——这揭示了 **机会窗口**

```
Prompt Sensitivity Map:
  "best dental lab"         → Glidewell 主导 (无机会)
  "affordable crown lab"    → Glidewell 主导 (无机会)
  "fast turnaround lab NJ"  → 无明确赢家 ← 🎯 机会！
  "digital impression lab"  → 设备品牌主导 ← 🎯 机会！
  "iCo Dental reviews"     → AI 无法回答 ← 🔴 必须修复
  "iCo vs Glidewell"       → Glidewell 碾压 ← 🔴 必须修复
```

**Overall Score + Archetype 徽章**：综合 Discovery Score 和 Trust Score 计算总分（各 50% 权重），并分类为 Leader (≥70) / Challenger (≥40) / Niche Player (≥15) / Invisible (<15)。

**五维雷达图（Optional）**：如果时间允许，用 Claude 对品牌打 5 维分（识别度、情感倾向、相关性、引用可能、竞争力），展示为 Recharts RadarChart。

### Step 5: Gap Analysis — 为什么你在这个位置

**目的**：这是产品的灵魂——不只是告诉你分数低，而是告诉你**为什么低**。通过对比你和竞品在网络上的存在，找出具体的差距。

**实现**：Tavily `/search` 分别搜索品牌和竞品的网络存在（Wikipedia、Schema.org、Reddit、行业论坛、Google Reviews 等）。Claude 综合分析差距原因。

**展示内容**：
- 逐项对比清单（✅/❌）
- 每项结论附带证据来源链接
- AI 推荐品牌的已知关键因素说明

**示例**：
```
┌─ 为什么 AI 不认识 iCo ─────────────────────────────────────┐
│                                                             │
│  ❌ Wikipedia 页面                                          │
│     iCo: 不存在                                             │
│     重要性: Wikipedia 占 LLM 训练数据的 22%                  │
│     📎 搜索结果: wikipedia.org 中无 "iCo Dental" 页面       │
│                                                             │
│  ❌ 网站标题和描述                                          │
│     iCo 官网标题: "iCo Dental Group"                        │
│     问题: 没有 "lab" 一词，AI 不知道你是做什么的            │
│     📎 来源: icodentalgroup.com title tag                   │
│                                                             │
│  ❌ 结构化数据 (Schema.org)                                 │
│     iCo: 无 Schema.org 标记                                 │
│     影响: AI 无法从结构化数据中读取你的业务信息              │
│     📎 来源: schema.org validator 检测结果                   │
│                                                             │
│  ❌ 行业论坛活跃度                                          │
│     iCo 在 DentalTown: 0 帖子                               │
│     影响: 行业论坛是 AI 训练数据的重要来源                   │
│     📎 来源: dentaltown.com 搜索 "iCo Dental" = 0 results  │
│                                                             │
│  ❌ 第三方评价量                                            │
│     iCo Google Reviews: 少于 10 条                          │
│     影响: AI 无法引用用户评价来背书你的品牌                  │
│     📎 来源: Google Maps iCo Dental Group                   │
│                                                             │
│  ⚠️ 官网内容深度                                           │
│     iCo 官网: 有基本服务介绍，但无教育内容、无案例展示      │
│     影响: AI 训练时几乎没有从你的网站上学到有用信息          │
│     📎 来源: icodentalgroup.com 各页面                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ 为什么 AI 认识 Glidewell ─────────────────────────────────┐
│                                                             │
│  ✅ Wikipedia: 2,400 字详细页面，含历史、产品线、规模       │
│     📎 wikipedia.org/wiki/Glidewell_Laboratories            │
│                                                             │
│  ✅ DentalTown: 800+ 帖子，10 年持续活跃                   │
│     📎 dentaltown.com 搜索 "Glidewell" = 800+ results      │
│                                                             │
│  ✅ Schema.org: 完整的 LocalBusiness 标记                   │
│     📎 schema.org validator: glidewell.com                  │
│                                                             │
│  ✅ 内容丰富: 材料对比文章、教育博客、案例画廊              │
│     📎 glidewell.com/education, glidewell.com/case-gallery  │
│                                                             │
│  ✅ Google Reviews: 数千条，评分 4.2+                       │
│     📎 Google Maps: Glidewell Dental Lab                    │
│                                                             │
│  ✅ Reddit: r/dentistry 中被频繁讨论                        │
│     📎 reddit.com/r/dentistry 搜索 "Glidewell"             │
│                                                             │
│  → 结论: Glidewell 在 AI 训练数据来源中全面覆盖，          │
│    所以 AI "天然"就认识他们                                 │
└─────────────────────────────────────────────────────────────┘
```

### Step 6: Action Plan — 怎么修

**目的**：给出具体的、按优先级排列的改进方案。每个建议都直接对应 Step 5 中发现的一个缺口。最终目标：让牙医下次问 AI "iCo 怎么样" 时，AI 能给出有价值、有信任感的回答。

**实现**：Claude 基于 Step 5 的差距分析，结合 GEO 学术研究最佳实践（添加 citations +30-40%、统计数据 +22%），生成分级方案。对于优先级最高的项目，直接自动生成可执行的内容样本。

**展示内容**：
- 按 Priority 分三级，每级对应 Step 5 中的具体缺口
- 每个建议包含：做什么、为什么、怎么做、预期效果
- 自动生成的内容样本（Wikipedia 草稿、Schema.org JSON-LD、对比页大纲）

**示例**：
```
┌─ Priority 1: This Week — 修复最基础的 AI 可发现性 ─────────┐
│                                                             │
│  1.1 修改网站标题 (对应缺口: 网站标题无 "lab")              │
│      现在: "iCo Dental Group - You Take Care of the Smiles" │
│      改为: "iCo Dental Lab — Crowns, Implants & Dentures    │
│             | Princeton NJ"                                 │
│      为什么: AI 根据网页标题理解你的业务。                   │
│             现在 AI 都不知道你是一家 dental lab。            │
│      预期: AI 将能正确识别你的业务类型                       │
│                                                             │
│  1.2 添加 Schema.org 结构化数据 (对应缺口: 无结构化数据)    │
│      [自动生成的 JSON-LD 代码]:                              │
│      {                                                      │
│        "@context": "https://schema.org",                    │
│        "@type": "DentalLaboratory",                         │
│        "name": "iCo Dental Lab",                            │
│        "address": { "Princeton, NJ" },                      │
│        "areaServed": ["NJ", "PA", "NY", "CA"],              │
│        "services": ["Zirconia Crowns", "Implant Crowns",    │
│                     "Dentures"]                              │
│      }                                                      │
│      预期: AI 将能从结构化数据中直接读取你的服务信息         │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ Priority 2: This Month — 建立 AI 可信任的信息源 ──────────┐
│                                                             │
│  2.1 创建 Wikipedia 草稿 (对应缺口: 无 Wikipedia 页面)      │
│      [自动生成的草稿]:                                      │
│      "iCo Dental Group (also known as iCo Dental Lab)       │
│       is a dental laboratory company headquartered in        │
│       Princeton, New Jersey. Founded in 2021, the company   │
│       serves over 500 dental practices across New Jersey,    │
│       Pennsylvania, New York, and California, providing      │
│       zirconia crowns, implant restorations, and dentures    │
│       with standard 7-10 day turnaround..."                  │
│      预期: Wikipedia 是 LLM 训练数据的 22%。有了页面后，    │
│            AI 下一轮训练将能认识 iCo                         │
│                                                             │
│  2.2 创建 "iCo vs Glidewell" 对比页                         │
│      (对应缺口: 在对比搜索中完全输给竞品)                   │
│      预期: 当牙医搜 "iCo vs Glidewell" 时，有内容可供       │
│            AI 引用来做公平对比                               │
│                                                             │
│  2.3 在 DentalTown 建立存在感                               │
│      (对应缺口: 行业论坛 0 帖子)                            │
│      预期: 行业论坛是 AI 训练数据的重要来源                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ Priority 3: Ongoing — 持续积累 AI 知识深度 ───────────────┐
│                                                             │
│  3.1 发布 zirconia/e.max 材料教育内容                       │
│  3.2 鼓励合作诊所在 Google 留评价                           │
│  3.3 在 Reddit r/dentistry 参与专业讨论                     │
│  3.4 创建案例画廊页面（Before/After）                       │
│                                                             │
│  预期: 长期积累使 AI 对 iCo 的了解从"名字"提升到            │
│        "能详细描述产品、质量、服务的可信品牌"               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、完整产品逻辑闭环

```
┌─────────────────────────────────────────────────────────┐
│                    真实世界                               │
│                                                         │
│  iCo 销售上门 → 留报价单 → 牙医拿到报价单               │
│                                                         │
│  牙医可能做两件事:                                       │
│  A) 主动搜索: "best dental lab in NJ"      (发现型)     │
│  B) 验证公司: "iCo Dental Group reviews"   (验证型)     │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│          The AI Shelf 分析引擎                            │
│                                                         │
│  Step 1: 智能生成两种类型的 query + 标注意图             │
│          ↓                                               │
│  Step 2: 问 AI → 记录完整回答 → 标记品牌提及             │
│  Step 3: 搜网页 → 记录真实来源 → 对比 AI vs 现实        │
│          ↓                                               │
│  Step 4: 计算 Discovery Score + Trust Score              │
│          ↓                                               │
│  Step 5: 逐项对比品牌 vs 竞品的网络存在                  │
│          找出具体差距 + 附带证据链接                      │
│          ↓                                               │
│  Step 6: 按优先级生成改进方案                            │
│          直接输出可执行内容（Wiki 草稿、Schema 代码）     │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│          执行改进后的效果                                 │
│                                                         │
│  修复前:                                                 │
│  牙医问 AI "iCo 怎么样？"                               │
│  → "I don't have specific information about iCo..."     │
│  → 信任归零 → 报价单进垃圾桶                            │
│                                                         │
│  修复后:                                                 │
│  牙医问 AI "iCo 怎么样？"                               │
│  → "iCo Dental Lab is a dental laboratory based in      │
│     Princeton NJ, serving 500+ practices, known for     │
│     quality zirconia crowns with 7-10 day turnaround..."│
│  → 信任建立 → 试单 → 长期合作                           │
└─────────────────────────────────────────────────────────┘
```

---

## 六、技术架构

### 技术栈

| 组件 | 技术选型 | 原因 |
|------|---------|------|
| 前端 | Next.js (App Router) | 快速搭建、Vercel 一键部署 |
| 后端 | Next.js API Routes (Node.js runtime) | 无需独立后端 |
| AI 引擎 | Claude API (Haiku 4.5) via Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) | 快速响应、成本低 |
| 搜索引擎 | Tavily API (/search) | Hackathon 赞助商，LLM 原生搜索 |
| 部署 | Vercel | 免费 tier，自动 HTTPS |
| 样式 | Tailwind CSS + shadcn/ui | 零配置，快速出活 |
| 结构化输出 | Zod schema + `generateObject` | 类型安全，无需手动 JSON.parse |

### 数据流

```
[用户输入: 品牌名 + 品类 + 地区]
    ↓
[POST /api/analyze]
    ├── Step 1: Claude 生成 6 条 query (3 发现型 + 3 验证型)
    │       ↓
    ├── Step 2: Claude × 6 (并行) — 对每条 query 获取 AI 回答
    ├── Step 3: Tavily × 6 (并行) — 搜索每条 query 的网页结果
    │       ↓
    ├── Step 4: 计算 Discovery Score + Trust Score (纯计算)
    │       ↓
    ├── Step 5: Tavily 搜索品牌 + 竞品网络存在 + Claude 分析差距
    │       ↓
    └── Step 6: Claude 生成 Action Plan + 内容样本
            ↓
[前端逐步渲染 6 个 Step 面板 (SSE 流式)]
```

### 前端结构

```
app/
  page.tsx              ← 主页面：输入框 + 6 个 Step 面板
  layout.tsx            ← 深色主题布局
  api/analyze/route.ts  ← 核心 API：编排所有步骤，流式返回
  components/
    BrandInput.tsx      ← 品牌名 + 品类 + 地区输入
    StepPanel.tsx       ← 通用步骤面板（展开/折叠、loading）
    ScoreChart.tsx      ← Discovery Score + Trust Score 条形图
    SourceLink.tsx      ← 可点击的证据来源链接
    IntentBadge.tsx     ← Query 意图标签（发现型/验证型）
    SentimentBadge.tsx  ← Sentiment 色标
    ScoreDisplay.tsx    ← Hero 得分 + Archetype 徽章
    GapTable.tsx        ← Gap Analysis 对比表
    CompetitorBar.tsx   ← 竞品对比条形图
    ProgressStepper.tsx ← 6 步进度条
```

---

## 七、Demo 品牌：iCo Dental Group

### 为什么选 iCo

| 原因 | 说明 |
|------|------|
| 真实客户 | 我们有 iCo 详细的销售策略和营销方案，深度了解他们的痛点 |
| 反差冲击力 | 500+ 诊所但 AI 完全不认识——"从 0 到有"的差距比大品牌更震撼 |
| 双场景都强 | 发现型：不在 "best dental lab" 回答中。验证型：AI 说"不了解"。两种场景都能产生有冲击力的结果 |
| 直接落地 | 分析结果可以直接用于 iCo 的实际营销改进，不是纸上谈兵 |
| 评委共鸣 | 真实公司 + 真实问题 > 假设性的 Nike/HubSpot 分析 |

### iCo 简介

- **业务**：Dental Lab，制作牙冠（Zirconia/E.max/PFM）、种植体冠、义齿
- **总部**：Princeton, NJ | 第二办公室：Austin, TX
- **覆盖**：NJ, PA, NY, CA | 500+ 合作诊所 | 5 年历史
- **卖点**：高质量 + 有竞争力的价格 + 7-10 天交期 / 5 天加急
- **获客方式**：地推销售（陌拜诊所）+ 邮件营销 + 官网
- **GEO 现状**：无 Wikipedia、无 Schema.org、无 DentalTown 活跃度、无对比内容

---

## 八、Demo 演示方案（3 分钟）

### 0:00-0:20 — Hook

> "iCo Dental Lab 是一家真实的 NJ dental lab。他们的销售每天上门拜访牙医诊所，留下报价单。但他们不知道的是——牙医拿到报价单后做的第一件事，是问 AI：'iCo 怎么样？' 而 AI 的回答是：'我不了解这家公司。' 信任瞬间归零。"

### 0:20-0:30 — 产品介绍

> "The AI Shelf 帮品牌发现这个隐形危机，并给出修复方案。让我 live 演示。"

### 0:30-2:00 — Live Demo

- 输入 "iCo Dental Group" + "dental lab" + "New Jersey"
- 点击 Analyze
- 展示 6 个 Step（预热缓存确保速度）
- 重点讲：
  - Step 1 的意图分析（"我们不只生成关键词，我们理解牙医为什么这么搜"）
  - Step 2 中 AI 对验证型 query 说 "I don't have information"
  - Step 4 的 Trust Score 15% vs Glidewell 92%
  - Step 6 中自动生成的 Wikipedia 草稿

### 2:00-2:20 — So What

> "iCo 花了 5 年做地推，但每次销售拜访的转化率都被 AI 的'不认识'悄悄拉低。30 秒内，我们发现了这个盲区，诊断了原因，开出了处方。任何行业的任何品牌都可以做同样的检查。"

### 2:20-2:40 — 技术简述

> "Claude API + Tavily Search, deployed on Vercel. 每个结论都有可点击的来源链接。"

### 2:40-3:00 — Close

> "Try it yourself: [URL]"

---

## 九、执行时间表（2 小时）

| 时间段 | 任务 | 交付物 |
|--------|------|--------|
| 0-10 min | `npx create-next-app`，安装依赖，确认 API key | 可运行的空项目 |
| 10-25 min | 后端 Step 1-3：query 生成 + Claude 回答 + Tavily 搜索 | API 返回前 3 步 JSON |
| 25-40 min | 后端 Step 4-6：评分计算 + Gap 分析 + Action Plan | 完整 6 步 JSON |
| 40-55 min | 前端框架：输入组件 + 6 个 Step 面板骨架 | 可交互页面 |
| 55-70 min | 前端细节：条形图、意图标签、来源链接、展开/折叠 | 完整渲染 |
| 70-85 min | 集成 + `vercel deploy` + iCo end-to-end 测试 | 公开 URL |
| 85-100 min | Polish：error handling、"Try Example" 按钮、预热缓存 | 稳定 demo |
| 100-110 min | 练习 pitch 3 遍 + 准备备用录屏 | 流畅演示 |
| 110-120 min | Buffer | — |

---

## 十、Hackathon 要求对照表

| Hackathon 要求 | 怎么满足 | Step |
|---|---|---|
| ≥5 条 high-intent query | 6 条（3 发现型 + 3 验证型）+ 意图标注 | 1 |
| ≥2 个 AI 系统/搜索工具 | Claude (AI 回答) + Tavily (网页搜索) | 2+3 |
| 提取品牌提及、竞品、位置、情感 | 对 AI 回答做结构化解析 | 2 |
| 计算 Share of Model | Discovery Score + Trust Score | 4 |
| 展示证据 | 每个 Step 有可展开的原始数据 + 来源 URL | 全部 |
| 竞品分析 | 逐项对比品牌 vs 竞品的网络存在 | 5 |
| 自动生成改进内容 | Wikipedia 草稿 + Schema.org 代码 + 对比页大纲 | 6 |
| 按优先级排列行动方案 | 3 级 Priority | 6 |
| 公开部署 | Vercel | — |
| 实时 API 调用 | 每次分析都 live 调用 Tavily + Claude | — |

---

## 十一、为什么我们能赢

| 评判维度 (权重) | 我们的优势 |
|---|---|
| **Reliability (30%)** | Vercel 部署 + 每个结论有可点击来源 + error handling + 预热缓存 |
| **Insight Quality (25%)** | 双场景分析（发现+验证）+ 意图分析 + Trust Score 是独有指标 + 真实品牌的震撼数据 |
| **Technical Robustness (25%)** | Tavily 深度使用 + Claude 结构化输出 + 并行 API + 流式渲染 |
| **Clarity to CEO (20%)** | "AI 说不认识你"一句话说清问题 + 15% vs 92% 的对比 + 自动生成可用内容 |

### 差异化

| 其他团队可能做的 | 我们做的不同 |
|---|---|
| 只做发现型分析 | **发现型 + 验证型双场景**，覆盖完整客户旅程 |
| Query 只是关键词 | **每条 Query 附带意图分析**，展示我们理解用户行为 |
| 只有一个 SoM 分数 | **Discovery Score + Trust Score** 两个维度，更精准 |
| 用 Nike/HubSpot | **真实的 dental lab**，真实的痛点，真实的价值 |
| 只给最终结果 | **6 步完整过程 + 所有中间数据 + 来源验证** |

---

## 十二、后续扩展

1. **多 LLM 对比**：加入 OpenAI、Gemini、Perplexity（Cross-Model Disagreement Map）
2. **时间序列追踪**：每周跑一次，看改进后分数是否上升
3. **自动化执行**：不只给建议，直接帮你生成/发布内容
4. **行业模板**：为 dental lab、律所、SaaS 等预设 query 模板
5. **整合 iCo 营销体系**：与现有 SEO、邮件、地推策略形成闭环
