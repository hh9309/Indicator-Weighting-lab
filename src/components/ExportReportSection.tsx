import React, { useState } from 'react';
import { Criterion, NormalizedData, GameTheoryResult, TopsisResult, CaseStudy } from '../types/mcdm';
import { CASE_STUDIES } from '../data/caseStudies';
import { SliceCard } from './SliceCard';
import { TopsisPerformanceChart } from './TopsisPerformanceChart';
import {
  Download,
  Copy,
  Printer,
  Check,
  FileText,
  Table as TableIcon,
  FolderDown,
  Eye,
  Code,
  CheckCircle2,
  Trophy,
  Scale,
  Sparkles,
} from 'lucide-react';

interface ExportReportSectionProps {
  scenarioTitle: string;
  matrix: number[][];
  criteria: Criterion[];
  alternatives: string[];
  normalizedData: NormalizedData;
  weightsMap: {
    ahp: number[];
    g1: number[];
    delphi: number[];
    entropy: number[];
    critic: number[];
    cv: number[];
    combined: number[];
  };
  gameResult: GameTheoryResult;
  topsisResult: TopsisResult;
}

export const ExportReportSection: React.FC<ExportReportSectionProps> = ({
  scenarioTitle,
  matrix,
  criteria,
  alternatives,
  normalizedData,
  weightsMap,
  gameResult,
  topsisResult,
}) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [previewMode, setPreviewMode] = useState<'rendered' | 'markdown'>('rendered');
  const [downloadedCaseId, setDownloadedCaseId] = useState<string | null>(null);

  // Download raw CSV for any specific case
  const handleDownloadCaseCsv = (cs: CaseStudy) => {
    const header = [
      '方案名称',
      ...cs.criteria.map(
        (c) =>
          `"${c.name}(${c.type === 'benefit' ? '效益型+' : '成本型-'}${
            c.unit ? `_${c.unit}` : ''
          })"`
      ),
    ].join(',');
    const rows = cs.alternatives.map((alt, i) =>
      [`"${alt}"`, ...cs.matrix[i].map((v) => v.toFixed(2))].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${cs.id}_raw_matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloadedCaseId(cs.id);
    setTimeout(() => setDownloadedCaseId(null), 2000);
  };

  // Download current active matrix CSV
  const handleDownloadActiveCsv = () => {
    const header = [
      '方案名称',
      ...criteria.map(
        (c) =>
          `"${c.name}(${c.type === 'benefit' ? '效益型+' : '成本型-'}${
            c.unit ? `_${c.unit}` : ''
          })"`
      ),
    ].join(',');
    const rows = alternatives.map((alt, i) =>
      [`"${alt}"`, ...matrix[i].map((v) => v.toFixed(2))].join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'current_active_matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate 6-Section Complete Academic Report according to Pipeline Stages
  const generateMarkdownReport = (): string => {
    const timestamp = new Date().toLocaleString();
    let md = `# 指标权重计算与多属性决策实验室综合评估报告\n\n`;
    md += `> 本报告严格遵循全流程导引标准管道组织，涵盖评价背景、数据标准化、主客观赋权、博弈论组合优化及 TOPSIS 几何决策六大部分。\n\n`;
    md += `**评估场景**: ${scenarioTitle}\n`;
    md += `**生成时间**: ${timestamp}\n`;
    md += `**决策规模**: ${alternatives.length} 个备选方案，${criteria.length} 项多属性综合指标\n\n`;

    // Part 1
    md += `## 一、评价背景与系统界定 (System Definition & Objectives)\n\n`;
    md += `针对“${scenarioTitle}”开展多目标决策分析。系统包含 ${alternatives.length} 个待评估方案：${alternatives.join('、')}。\n`;
    md += `旨在构建不可公度指标的科学度量体系，消解主观经验偏见与纯客观统计噪声，实现科学稳健的多属性综合排序。\n\n`;

    // Part 2
    md += `## 二、指标体系构建与极值正规化 (Criteria System & Normalization)\n\n`;
    md += `### 1. 指标属性与量纲定义表\n\n`;
    md += `| 标识 | 指标名称 | 属性类别 | 计量单位 | 指标说明 |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    criteria.forEach((c, idx) => {
      md += `| C${idx + 1} | ${c.name} | ${
        c.type === 'benefit' ? '效益型 (Benefit, 越大越优)' : '成本型 (Cost, 越小越优)'
      } | ${c.unit || '-'} | ${c.description || '-'} |\n`;
    });

    md += `\n### 2. 原始决策矩阵 X [${alternatives.length} × ${criteria.length}]:\n\n`;
    md += `| 备选方案 | ` + criteria.map((c) => c.name).join(' | ') + ` |\n`;
    md += `| :--- | ` + criteria.map(() => ':---:').join(' | ') + ` |\n`;
    alternatives.forEach((alt, i) => {
      md += `| ${alt} | ` + matrix[i].map((v) => v.toFixed(2)).join(' | ') + ` |\n`;
    });

    md += `\n### 3. 极值规范化矩阵 Z (Min-Max 统一趋优):\n\n`;
    md += `> 效益型采用 $z_{ij} = (x_{ij} - x_{\\min})/(x_{\\max} - x_{\\min})$；成本型采用 $z_{ij} = (x_{\\max} - x_{ij})/(x_{\\max} - x_{\\min})$ 并辅以 $10^{-6}$ 零值平移防护。\n\n`;
    md += `| 备选方案 | ` + criteria.map((c) => `Z(${c.name})`).join(' | ') + ` |\n`;
    md += `| :--- | ` + criteria.map(() => ':---:').join(' | ') + ` |\n`;
    alternatives.forEach((alt, i) => {
      md += `| ${alt} | ` + (normalizedData.minMaxMatrix[i]?.map((v) => v.toFixed(4)).join(' | ') || '') + ` |\n`;
    });

    // Part 3
    md += `\n## 三、三大主观经验赋权推导 (Subjective Weighting Derivation)\n\n`;
    md += `主观赋权法体现领域专家深厚经验与战略战略安全导向：\n`;
    md += `1. **AHP 层次分析法**: 基于 1-9 标度构造互反判断矩阵，求解主特征向量 $Aw = \\lambda_{\\max} w$；经严格一致性检验满足 $CR < 0.10$ 满意一致性要求。\n`;
    md += `2. **G1 序关系分析法**: 指标依序关系排列，通过相邻重要度比值 $r_k = w_{k-1}/w_k$ 进行平滑逆向递推，逻辑单调无矛盾。\n`;
    md += `3. **德尔菲-模糊综合法 (Delphi-Fuzzy)**: 专家问卷三角模糊数 $A=(l,m,u)$ 通过重心公式 $DF=(l+2m+u)/4$ 解模糊化消解定性犹豫。\n\n`;
    md += `| 指标名称 | AHP 层次权重 | G1 序关系权重 | Delphi 模糊权重 |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    criteria.forEach((c, i) => {
      md += `| ${c.name} | ${(weightsMap.ahp[i] * 100).toFixed(2)}% | ${(weightsMap.g1[i] * 100).toFixed(2)}% | ${(weightsMap.delphi[i] * 100).toFixed(2)}% |\n`;
    });

    // Part 4
    md += `\n## 四、三大客观数据赋权测度 (Objective Weighting Measurement)\n\n`;
    md += `客观赋权法纯粹挖掘方案样本数据内在离散度与相关性结构：\n`;
    md += `1. **熵权法**: 基于信息熵 $e_j = -k \\sum p_{ij} \\ln(p_{ij})$ 测度差异系数 $d_j = 1 - e_j$。\n`;
    md += `2. **CRITIC 法**: 综合考量指标标准差 $\\sigma_j$ (对比强度) 与相关矩阵冲突性 $\\sum (1 - r_{jk})$，惩罚冗余共线性。\n`;
    md += `3. **变异系数法 (CV)**: 计算相对离散程度 $CV_j = \\sigma_j / |\\mu_j|$，剔除绝对量纲影响。\n\n`;
    md += `| 指标名称 | 熵权法权重 | CRITIC 权重 | 变异系数法权重 |\n`;
    md += `| :--- | :---: | :---: | :---: |\n`;
    criteria.forEach((c, i) => {
      md += `| ${c.name} | ${(weightsMap.entropy[i] * 100).toFixed(2)}% | ${(weightsMap.critic[i] * 100).toFixed(2)}% | ${(weightsMap.cv[i] * 100).toFixed(2)}% |\n`;
    });

    // Part 5
    md += `\n## 五、博弈论主客观组合赋权合成 (Game Theory Optimal Synthesis)\n\n`;
    md += `为克服单一主观偏见或单一客观噪声绑架决策，采用博弈论离差极小化模型：\n`;
    md += `$$\\min \\sum_{k=1}^2 \\|\\alpha_1 W_1^T + \\alpha_2 W_2^T - W_k^T\\|_2$$\n`;
    md += `求解线性方程组解得系数，并满足严格正规化约束 $\\alpha^* + \\beta^* = 1.0$。\n\n`;
    md += `- **最优主观融合系数 $\\alpha^*$**: ${gameResult.alphaStar.toFixed(4)} (${(gameResult.alphaStar * 100).toFixed(2)}%)\n`;
    md += `- **最优客观融合系数 $\\beta^*$**: ${gameResult.betaStar.toFixed(4)} (${(gameResult.betaStar * 100).toFixed(2)}%)\n\n`;
    md += `### 最终博弈论组合权重向量 W*:\n\n`;
    md += `| 指标标识 | 指标名称 | 主观权重基底 | 客观权重基底 | **博弈论组合权重 W*** |\n`;
    md += `| :--- | :--- | :---: | :---: | :---: |\n`;
    criteria.forEach((c, i) => {
      md += `| C${i + 1} | ${c.name} | ${(gameResult.subWeights[i] * 100).toFixed(2)}% | ${(gameResult.objWeights[i] * 100).toFixed(2)}% | **${(gameResult.combinedWeights[i] * 100).toFixed(2)}%** |\n`;
    });

    // Part 6
    md += `\n## 六、TOPSIS 几何决策与综合评估排序 (TOPSIS Spatial Geometry & Rankings)\n\n`;
    md += `在加权正规化空间 $V = [w_j z_{ij}]$ 中，确定正理想解 $Z^+$ 与负理想解 $Z^-$，测度欧氏距离及相对贴近度 $C_i = D_i^- / (D_i^+ + D_i^-)$：\n\n`;
    md += `| 综合排名 | 备选方案 | 相对贴近度 $C_i$ | 距正理想解 $D^+$ | 距负理想解 $D^-$ | 决策评估与实施建议 |\n`;
    md += `| :---: | :--- | :---: | :---: | :---: | :--- |\n`;
    topsisResult.rankings.forEach((r) => {
      const tag = r.rank === 1 ? '【首选推荐】最优方案' : r.rank === 2 ? '【备选优秀】次优候选' : '【一般方案】待优化提升';
      md += `| **第 ${r.rank} 名** | **${r.alternative}** | **${(r.closeness * 100).toFixed(2)}%** | ${r.dPlus.toFixed(4)} | ${r.dMinus.toFixed(4)} | ${tag} |\n`;
    });

    md += `\n### 决策结论与管理启示:\n`;
    const bestAlt = topsisResult.rankings[0]?.alternative || '方案1';
    md += `经过多属性综合测度，**${bestAlt}** 在当前加权理想空间中相对贴近度最高 ($C_1 = ${(topsisResult.rankings[0]?.closeness * 100).toFixed(2)}%$)，距正理想解距离最短，具备显著的竞争优势与综合韧性，建议作为首选实施方案。\n\n`;
    md += `---\n*本学术报告由「指标权重计算与多属性决策实验室 (Index Weighting & MCDM Lab)」全流程自动生成*\n`;

    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const text = generateMarkdownReport();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MCDM_Pipeline_Report_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <SliceCard
        sliceNumber="09"
        title="数据报告导出引擎"
        subtitle="六大实战案例原始数据快速下载，全流程导引六部分完整学术报告预览与一键导出"
        formulaBadge="6 Benchmarks Datasets & 6-Section Report"
        badgeColor="teal"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadActiveCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors shadow-2xs"
              title="下载当前实验室实时矩阵数据"
            >
              <FolderDown className="w-3.5 h-3.5 text-stone-500" />
              下载当前矩阵 CSV
            </button>
            <button
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-700 hover:bg-teal-800 text-white transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              下载 .md 报告
            </button>
            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors shadow-2xs"
            >
              {copiedMd ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  复制 Markdown
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              打印/PDF
            </button>
          </div>
        }
      >
        {/* 六大案例原始数据下载专区 */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <FolderDown className="w-4 h-4 text-teal-700" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                六大实战案例原始基准数据集下载专区 (Benchmark Raw Datasets Download)
              </h4>
            </div>
            <span className="text-[11px] text-stone-500">
              各案例原始矩阵 X、指标类型及单位标准 CSV 格式
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {CASE_STUDIES.map((cs) => {
              const isDownloaded = downloadedCaseId === cs.id;
              return (
                <div
                  key={cs.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-stone-200 shadow-2xs hover:border-stone-300 transition-all"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 border border-stone-200">
                        {cs.methodTag}
                      </span>
                      <span className="text-xs font-semibold text-stone-900 truncate block">
                        {cs.title.split('：')[0]}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate" title={cs.title}>
                      {cs.title.split('：')[1]}
                    </p>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {cs.alternatives.length} 方案 × {cs.criteria.length} 指标
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadCaseCsv(cs)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors shrink-0"
                    title={`下载 ${cs.title} 原始数据 CSV`}
                  >
                    {isDownloaded ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        已下载
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3 text-teal-600" />
                        下载 CSV
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 报告预览区控制条 */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-700" />
            <h4 className="text-sm font-semibold text-stone-900">
              决策评估综合学术报告预览 (6 大核心部分)
            </h4>
          </div>

          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setPreviewMode('rendered')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                previewMode === 'rendered'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-teal-600" />
              排版预览 (Rendered)
            </button>
            <button
              onClick={() => setPreviewMode('markdown')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                previewMode === 'markdown'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Code className="w-3.5 h-3.5 text-stone-600" />
              Markdown 源码
            </button>
          </div>
        </div>

        {/* 1. 排版预览模式 (Rendered Preview) */}
        {previewMode === 'rendered' && (
          <div className="space-y-6 bg-white p-6 rounded-xl border border-stone-200 text-stone-800 leading-relaxed shadow-2xs">
            {/* 报告头部 */}
            <div className="border-b border-stone-200 pb-4 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200 text-[11px] font-mono font-medium">
                <Sparkles className="w-3 h-3" />
                MCDM Academic Evaluation Report
              </div>
              <h2 className="text-lg font-bold text-stone-900">
                {scenarioTitle} — 多属性决策综合评估报告
              </h2>
              <div className="flex flex-wrap gap-4 text-xs text-stone-500 font-mono">
                <span>时间: {new Date().toLocaleDateString()}</span>
                <span>方案数: {alternatives.length}</span>
                <span>指标数: {criteria.length}</span>
                <span>决策模型: 博弈论合成 + TOPSIS</span>
              </div>
            </div>

            {/* 第一部分 */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-3 border-teal-700 pl-2.5">
                一、评价背景与系统界定 (System Definition & Objectives)
              </h3>
              <p className="text-xs text-stone-600 leading-normal">
                针对重大决策场景界定多元评价边界。待评估方案包含 {alternatives.join('、')}。
                系统构建兼顾定性战略导向与客观实证分布的多属性指标空间，以实现综合最优决策。
              </p>
            </div>

            {/* 第二部分 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-3 border-teal-700 pl-2.5">
                二、指标体系构建与极值正规化 (Criteria System & Normalization)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-stone-50 text-stone-700 font-medium border-b border-stone-200">
                    <tr>
                      <th className="p-2 font-mono">标识</th>
                      <th className="p-2">指标名称</th>
                      <th className="p-2">属性类别</th>
                      <th className="p-2">计量单位</th>
                      <th className="p-2 font-mono text-center">极小值 Min</th>
                      <th className="p-2 font-mono text-center">极大值 Max</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {criteria.map((c, i) => (
                      <tr key={c.id}>
                        <td className="p-2 font-semibold">C{i + 1}</td>
                        <td className="p-2 font-sans font-medium text-stone-900">{c.name}</td>
                        <td className="p-2 font-sans">
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] ${
                              c.type === 'benefit'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800'
                            }`}
                          >
                            {c.type === 'benefit' ? '效益型 (+)' : '成本型 (-)'}
                          </span>
                        </td>
                        <td className="p-2 font-sans text-stone-500">{c.unit || '-'}</td>
                        <td className="p-2 text-center text-amber-800">
                          {normalizedData.minVals[i]?.toFixed(2)}
                        </td>
                        <td className="p-2 text-center text-emerald-800">
                          {normalizedData.maxVals[i]?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 第三部分与第四部分：主客观赋权对比 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-3 border-teal-700 pl-2.5">
                三 & 四、六大主客观赋权法测度对比 (Subjective & Objective Measurements)
              </h3>
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-xs text-center border-collapse font-mono">
                  <thead className="bg-stone-50 text-stone-700 border-b border-stone-200 font-sans">
                    <tr>
                      <th className="p-2 text-left">指标</th>
                      <th className="p-2 bg-stone-100/50">AHP 层次</th>
                      <th className="p-2 bg-stone-100/50">G1 序关系</th>
                      <th className="p-2 bg-stone-100/50">Delphi 模糊</th>
                      <th className="p-2 bg-stone-100">熵权法</th>
                      <th className="p-2 bg-stone-100">CRITIC</th>
                      <th className="p-2 bg-stone-100">变异系数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {criteria.map((c, i) => (
                      <tr key={c.id}>
                        <td className="p-2 text-left font-sans font-medium text-stone-800">
                          {c.name}
                        </td>
                        <td className="p-2 text-stone-600">{(weightsMap.ahp[i] * 100).toFixed(2)}%</td>
                        <td className="p-2 text-stone-600">{(weightsMap.g1[i] * 100).toFixed(2)}%</td>
                        <td className="p-2 text-stone-600">{(weightsMap.delphi[i] * 100).toFixed(2)}%</td>
                        <td className="p-2 text-stone-700">{(weightsMap.entropy[i] * 100).toFixed(2)}%</td>
                        <td className="p-2 text-stone-700">{(weightsMap.critic[i] * 100).toFixed(2)}%</td>
                        <td className="p-2 text-stone-700">{(weightsMap.cv[i] * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 第五部分：博弈论合成 */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-3 border-teal-700 pl-2.5">
                五、博弈论主客观组合赋权合成 (Game Theory Optimal Synthesis)
              </h3>
              <div className="p-3.5 rounded-lg bg-teal-50/50 border border-teal-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="font-semibold text-teal-900">最优主观权重系数 α*: </span>
                  <span className="font-mono font-bold text-teal-800">
                    {gameResult.alphaStar.toFixed(4)} ({(gameResult.alphaStar * 100).toFixed(2)}%)
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-sky-900">最优客观权重系数 β*: </span>
                  <span className="font-mono font-bold text-sky-800">
                    {gameResult.betaStar.toFixed(4)} ({(gameResult.betaStar * 100).toFixed(2)}%)
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 font-mono">α* + β* ≡ 1.0000</div>
              </div>

              {/* 组合权重 */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {criteria.map((c, i) => (
                  <div key={c.id} className="p-2 rounded-lg bg-stone-50 border border-stone-200 text-center">
                    <span className="text-[11px] text-stone-600 truncate block">{c.name}</span>
                    <span className="font-mono text-xs font-bold text-teal-800">
                      {(gameResult.combinedWeights[i] * 100).toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 第六部分：TOPSIS 几何决策与排名 */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2 border-l-3 border-teal-700 pl-2.5">
                六、TOPSIS 几何决策与综合评估排序 (TOPSIS Spatial Geometry & Rankings)
              </h3>

              {/* Recharts 雷达图与平行坐标图对比组件 */}
              <TopsisPerformanceChart
                criteria={criteria}
                alternatives={alternatives}
                normalizedMatrix={normalizedData.minMaxMatrix}
                weightedMatrix={topsisResult.weightedMatrix}
                topsisResult={topsisResult}
              />

              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-stone-50 text-stone-700 border-b border-stone-200">
                    <tr>
                      <th className="p-2.5 text-center font-bold w-16">排名</th>
                      <th className="p-2.5 font-semibold text-stone-900">备选方案</th>
                      <th className="p-2.5 font-mono text-center">相对贴近度 C_i</th>
                      <th className="p-2.5 font-mono text-center">距正理想解 D+</th>
                      <th className="p-2.5 font-mono text-center">距负理想解 D-</th>
                      <th className="p-2.5 text-center">综合评估结论</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {topsisResult.rankings.map((r) => (
                      <tr
                        key={r.alternative}
                        className={r.rank === 1 ? 'bg-amber-50/50 font-medium' : 'hover:bg-stone-50/50'}
                      >
                        <td className="p-2.5 text-center font-mono font-bold text-stone-900">
                          #{r.rank}
                        </td>
                        <td className="p-2.5 font-semibold text-stone-900">{r.alternative}</td>
                        <td className="p-2.5 font-mono font-bold text-center text-teal-800">
                          {(r.closeness * 100).toFixed(2)}%
                        </td>
                        <td className="p-2.5 font-mono text-center text-emerald-700">
                          {r.dPlus.toFixed(4)}
                        </td>
                        <td className="p-2.5 font-mono text-center text-rose-700">
                          {r.dMinus.toFixed(4)}
                        </td>
                        <td className="p-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                              r.rank === 1
                                ? 'bg-amber-100 text-amber-900'
                                : r.rank === 2
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-stone-100 text-stone-700'
                            }`}
                          >
                            {r.rank === 1 ? '首选推荐方案' : r.rank === 2 ? '备选方案' : '合格候选'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 总结建议 */}
              <div className="p-3.5 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-700 space-y-1">
                <span className="font-semibold text-stone-900">最终结论与管理建议：</span>
                <p>
                  根据 TOPSIS 多维欧氏空间投影，方案 <strong>{topsisResult.rankings[0]?.alternative}</strong> 相对贴近度达到{' '}
                  <span className="font-mono font-bold text-teal-800">
                    {((topsisResult.rankings[0]?.closeness || 0) * 100).toFixed(2)}%
                  </span>
                  ，综合协调性与抗风险能力位列首位，推荐作为最优实施策略。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Markdown 源码模式 */}
        {previewMode === 'markdown' && (
          <div className="space-y-2">
            <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 font-mono text-xs text-stone-200 max-h-[460px] overflow-y-auto leading-relaxed shadow-inner">
              <pre className="whitespace-pre-wrap">{generateMarkdownReport()}</pre>
            </div>
          </div>
        )}
      </SliceCard>
    </div>
  );
};
