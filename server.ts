import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client setup
let genAI: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY' && process.env.GEMINI_API_KEY.trim() !== '') {
  genAI = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Built-in expert rule engine for instant offline fallback or supplementary checks
function runLocalMCDMRules(data: {
  matrix?: number[][];
  criteria?: { name: string; type: 'benefit' | 'cost' }[];
  alternatives?: string[];
  ahpMatrix?: number[][];
  weights?: Record<string, number[]>;
}) {
  const issues: { type: 'danger' | 'warning' | 'info' | 'success'; title: string; message: string; suggestion: string }[] = [];

  // 1. Check AHP Consistency
  if (data.ahpMatrix && data.ahpMatrix.length > 2) {
    const n = data.ahpMatrix.length;
    // Calculate lambda max approximation
    const colSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += data.ahpMatrix[i][j];
      }
    }
    const normMatrix = data.ahpMatrix.map(row => row.map((val, j) => val / (colSums[j] || 1)));
    const weights = normMatrix.map(row => row.reduce((a, b) => a + b, 0) / n);
    
    // Aw
    const Aw = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        Aw[i] += data.ahpMatrix[i][j] * weights[j];
      }
    }
    const lambdaMax = Aw.reduce((acc, val, i) => acc + val / (weights[i] || 1e-6), 0) / n;
    const CI = (lambdaMax - n) / (n - 1);
    const RI_TABLE = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
    const RI = RI_TABLE[n - 1] || 1.49;
    const CR = CI / (RI || 1);

    if (CR >= 0.1) {
      issues.push({
        type: 'danger',
        title: 'AHP 判断矩阵逻辑一致性未通过 (CR ≥ 0.1)',
        message: `当前阶数 n=${n}，λmax=${lambdaMax.toFixed(4)}，CI=${CI.toFixed(4)}，一致性比率 CR=${CR.toFixed(4)} (阈值 0.10)。存在专家主观传递性矛盾（如 A > B 且 B > C 但 C > A，或标度放大失真）。`,
        suggestion: '建议使用诱导矩阵或和积法核查互反标度，对偏离度最大的指标成对打分重新调优修正。',
      });
    } else {
      issues.push({
        type: 'success',
        title: 'AHP 判断矩阵一致性良好',
        message: `计算得出 CR=${CR.toFixed(4)} < 0.10，判断矩阵满足满意一致性检验。`,
        suggestion: '主观偏好传递逻辑严密，可安全作为主观权重向量参与博弈组合。',
      });
    }
  }

  // 2. Check Decision Matrix for zero-values & negative-values under entropy weighting
  if (data.matrix && data.matrix.length > 0) {
    const m = data.matrix.length;
    const n = data.matrix[0].length;
    let hasZero = false;
    let hasIdenticalCol = false;

    for (let j = 0; j < n; j++) {
      const colVals = data.matrix.map(row => row[j]);
      const minVal = Math.min(...colVals);
      const maxVal = Math.max(...colVals);
      if (minVal <= 0) hasZero = true;
      if (Math.abs(maxVal - minVal) < 1e-9) hasIdenticalCol = true;
    }

    if (hasZero) {
      issues.push({
        type: 'warning',
        title: '检测到非正数/零值 (熵权 ln(p) 奇点防线)',
        message: '原始矩阵或归一化矩阵存在 0 或负数元素。在执行信息熵计算 -k∑ p_ij ln(p_ij) 时，ln(0) 会触发 NaN / 溢出异常。',
        suggestion: '实验室已采用非负平移修正（如 y_ij = z_ij + 1e-6 或 +0.0001 平滑化），建议保留平移以确保数学稳定性。',
      });
    }

    if (hasIdenticalCol) {
      issues.push({
        type: 'warning',
        title: '存在零方差/无辨识度指标',
        message: '某一指标在所有备选方案中的取值完全一致（极差为 0）。',
        suggestion: '该指标客观差异系数为 0，熵权与变异系数将退化为 0。建议剔除该冗余指标或转为主观必要性门槛过滤。',
      });
    }

    // Multicollinearity check (CRITIC conflict)
    if (n >= 3 && m >= 3) {
      let highCorrCount = 0;
      for (let j1 = 0; j1 < n; j1++) {
        for (let j2 = j1 + 1; j2 < n; j2++) {
          const col1 = data.matrix.map(r => r[j1]);
          const col2 = data.matrix.map(r => r[j2]);
          const mean1 = col1.reduce((a, b) => a + b, 0) / m;
          const mean2 = col2.reduce((a, b) => a + b, 0) / m;
          let cov = 0, var1 = 0, var2 = 0;
          for (let i = 0; i < m; i++) {
            cov += (col1[i] - mean1) * (col2[i] - mean2);
            var1 += (col1[i] - mean1) ** 2;
            var2 += (col2[i] - mean2) ** 2;
          }
          const r = cov / (Math.sqrt(var1 * var2) || 1e-9);
          if (Math.abs(r) > 0.85) {
            highCorrCount++;
          }
        }
      }
      if (highCorrCount > 0) {
        issues.push({
          type: 'info',
          title: '指标间存在强相关性/多重共线性',
          message: `检测到 ${highCorrCount} 对指标 Pearson 相关系数绝对值超过 0.85，信息存在重复计量。`,
          suggestion: '此时 CRITIC 法能够通过冲突性指标 ∑(1-r_jk) 自动惩罚强相关冗余；而单纯熵权法则可能赋予冗余指标双重权重，建议选用 CRITIC 或博弈论组合赋权。',
        });
      }
    }
  }

  return issues;
}

// Diagnostic API route
app.post('/api/diagnose', async (req, res) => {
  const { matrix, criteria, alternatives, ahpMatrix, weights, scenarioTitle } = req.body;
  const localIssues = runLocalMCDMRules({ matrix, criteria, alternatives, ahpMatrix, weights });

  if (!genAI) {
    return res.json({
      success: true,
      mode: 'heuristic_rules',
      analysis: '当前采用内置数学与决策理论专家推导诊断引擎。',
      issues: localIssues,
      recommendations: [
        '核查判断矩阵 CR 指标是否小于 0.1；',
        '确保极值正规化时负向指标采用 (max - x) / (max - min) 转换；',
        '在博弈论赋权求解 α, β 线性方程组后，务必进行 α* = α / (α + β) 严格归一化。',
      ],
    });
  }

  try {
    const prompt = `你是一位严谨的运筹学、数理统计与多属性决策分析（MCDM）专家顾问。
请根据以下多属性决策实验室的输入状态进行深度学术诊断：
- 决策场景: ${scenarioTitle || '自定义多方案评估'}
- 指标数量: ${criteria?.length || 0} 个（包含效益型/成本型）
- 备选方案: ${alternatives?.join(', ') || '多方案'}
- 规则引擎初诊发现:
${localIssues.map(iss => `  * [${iss.type}] ${iss.title}: ${iss.message}`).join('\n')}

请输出结构化的专家诊断结论，重点剖析：
1. 判断矩阵一致性或定性赋权逻辑风险；
2. 客观指标的离散度（熵权与变异系数）是否存在噪声驱动的假性高权陷阱；
3. 指标多重共线性对 TOPSIS 欧氏距离空间变形的影响；
4. 针对本案例推荐的主客观博弈组合策略（α与β的合理区间）。
请语言专业、精炼、客观，避免泛泛空话，分要点回答。`;

    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: '你是一个世界顶级的决策科学学术导师，精通AHP、G1、Delphi-Fuzzy、熵权法、CRITIC、变异系数法、博弈论组合赋权及TOPSIS。回复风格典雅、数学准确、结构清晰。',
        temperature: 0.3,
      },
    });

    res.json({
      success: true,
      mode: 'gemini_enhanced',
      aiText: response.text || '',
      issues: localIssues,
    });
  } catch (error: any) {
    console.error('Gemini diagnose error:', error);
    res.json({
      success: true,
      mode: 'heuristic_fallback',
      aiText: 'AI 诊断暂时切换为本地运筹分析引擎。',
      issues: localIssues,
    });
  }
});

// MCDM Q&A Consultation API route
app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;

  if (!genAI) {
    // Intelligent local fallback responder for MCDM questions
    const msg = (message || '').toLowerCase();
    let reply = '【MCDM实验室知识库】';
    if (msg.includes('cr') || msg.includes('ahp') || msg.includes('一致性')) {
      reply = `**AHP 一致性检验 (CR < 0.1) 核心推导：**
1. 计算一致性指标 $CI = (\\lambda_{max} - n) / (n - 1)$。
2. 查找随机一致性指标 $RI$（如 $n=3$ 为 0.58，$n=4$ 为 0.90，$n=5$ 为 1.12）。
3. 得到 $CR = CI / RI$。若 $CR \\ge 0.1$，说明存在逻辑矛盾（如 A 优于 B，B 优于 C，但 C 优于 A，或标度差比失调）。
**修正对策：** 检查偏离特征向量方向最大的元素对 $a_{ij}$，利用 $a_{ij} \\approx w_i / w_j$ 进行引导修正。`;
    } else if (msg.includes('熵') || msg.includes('entropy') || msg.includes('ln')) {
      reply = `**熵权法核心避坑指南：**
1. **零值崩溃**：当归一化矩阵出现 $p_{ij}=0$ 时，$ln(0)$ 无定义，必须做极小扰动平移 $y_{ij} = z_{ij} + \\epsilon$（实验室自动加 $10^{-6}$）。
2. **离散度假象**：熵权法纯粹根据数据离散度赋权。若某无足轻重的指标因实验误差或离群点波动很大，熵权会赋予其极高权重，导致“噪声绑架决策”。因此必须与 AHP/G1 等主观经验法进行博弈组合！`;
    } else if (msg.includes('critic')) {
      reply = `**CRITIC 法的核心优势：**
CRITIC 同时考量了两个维度：
1. **对比强度（Contrast Intensity）**：用标准差 $\\sigma_j$ 刻画指标内部方案的分辨能力；
2. **冲突性（Conflict）**：用指标间相关系数 $\\sum_{k=1}^n (1 - r_{jk})$ 刻画。若某指标与其他指标高度正相关，冲突性低，说明信息冗余，权重会被削减；反之独立性高的指标会获得高权。`;
    } else if (msg.includes('topsis') || msg.includes('逆序') || msg.includes('rank')) {
      reply = `**TOPSIS 逆序现象 (Rank Reversal)：**
在 TOPSIS 评价中，当新增或剔除一个非最优方案时，各备选方案的正负理想解坐标 $(Z^+, Z^-)$ 可能发生位移，导致原有方案的相对贴近度 $C_i$ 大小发生翻转。
**应对策略：** 建立全局固定理想解（如行业绝对基准），或采用理想解冻结机制。`;
    } else {
      reply = `**多属性决策（MCDM）赋权黄金法则：**
- **主观赋权（AHP、G1、Delphi）**：体现战略导向与行业定性经验，避免关键安全/政策指标被数据波动抹杀；
- **客观赋权（熵权、CRITIC、变异系数）**：体现多方案客观实测数据的差异与信息量，消除专家个人偏见；
- **博弈论组合（Game Theory）**：基于向量投影极小化主客观偏差，是兼顾战略意志与数据实证的最优解。`;
    }
    return res.json({ success: true, reply });
  }

  try {
    const systemPrompt = `你是指标权重计算与多属性决策实验室（MCDM Lab）的学术智能随诊助手。
精通：
1. 主观赋权（AHP层次分析法、G1序关系分析法、德尔菲-三角模糊数法Delphi-Fuzzy）；
2. 客观赋权（熵权法、CRITIC法、变异系数法）；
3. 博弈论/最小二乘法主客观组合赋权（W* = α W_sub + β W_obj）；
4. TOPSIS多属性决策（正负理想解、欧氏空间距离、相对贴近度、逆序现象防范）；
5. 矩阵极值正规化与向量标准化数学代数。

请对用户的咨询给出严谨、学术、条理分明且富于工程落地指导的解答。使用 Markdown 语法排版，支持清晰的数学公式。`;

    const chatContext = context ? `\n当前用户决策上下文：\n${JSON.stringify(context, null, 2)}\n` : '';
    const response = await genAI.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${chatContext}\n用户提问：${message}`,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.4,
      },
    });

    res.json({
      success: true,
      reply: response.text || '回答生成完毕。',
    });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.json({
      success: false,
      reply: '服务处理异常，请稍后重试。本地专家规则引擎已待命。',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`MCDM Lab Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
