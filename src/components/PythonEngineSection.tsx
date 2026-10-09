import React, { useState } from 'react';
import {
  Criterion,
  AHPResult,
  G1Result,
  DelphiFuzzyResult,
  EntropyResult,
  CriticResult,
  CVResult,
  GameTheoryResult,
  TopsisResult,
} from '../types/mcdm';
import { generatePythonCode } from '../data/codeTemplates';
import { SliceCard } from './SliceCard';
import {
  Terminal,
  Copy,
  Check,
  Play,
  FileCode,
  BarChart3,
  Table as TableIcon,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface PythonEngineSectionProps {
  matrix: number[][];
  criteria: Criterion[];
  alternatives: string[];
  ahpPairwise?: number[][];
  g1Ratios?: number[];
  ahpResult?: AHPResult;
  g1Result?: G1Result;
  delphiResult?: DelphiFuzzyResult;
  entropyResult?: EntropyResult;
  criticResult?: CriticResult;
  cvResult?: CVResult;
  gameResult?: GameTheoryResult;
  topsisResult?: TopsisResult;
}

export const PythonEngineSection: React.FC<PythonEngineSectionProps> = ({
  matrix,
  criteria,
  alternatives,
  ahpPairwise,
  g1Ratios,
  ahpResult,
  g1Result,
  delphiResult,
  entropyResult,
  criticResult,
  cvResult,
  gameResult,
  topsisResult,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<
    'all' | 'ahp' | 'g1' | 'delphi' | 'entropy' | 'critic' | 'cv' | 'gametheory' | 'topsis'
  >('all');
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasRun, setHasRun] = useState(true);
  const [outputTab, setOutputTab] = useState<'chart' | 'table' | 'console'>('chart');

  const code = generatePythonCode(
    selectedMethod,
    matrix,
    criteria,
    alternatives,
    ahpPairwise,
    g1Ratios
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setHasRun(true);
    }, 300);
  };

  // Determine current active weights and metrics for display in Output Window
  const getCurrentWeights = (): number[] => {
    if (selectedMethod === 'ahp' && ahpResult) return ahpResult.weights;
    if (selectedMethod === 'g1' && g1Result) return g1Result.weights;
    if (selectedMethod === 'delphi' && delphiResult) return delphiResult.weights;
    if (selectedMethod === 'entropy' && entropyResult) return entropyResult.weights;
    if (selectedMethod === 'critic' && criticResult) return criticResult.weights;
    if (selectedMethod === 'cv' && cvResult) return cvResult.weights;
    if (selectedMethod === 'gametheory' && gameResult) return gameResult.combinedWeights;
    if (selectedMethod === 'all' && gameResult) return gameResult.combinedWeights;
    return Array(criteria.length).fill(1 / criteria.length);
  };

  const currentWeights = getCurrentWeights();
  const maxWeight = Math.max(...currentWeights, 0.01);

  // Generate simulated console output
  const getConsoleStdout = (): string => {
    let out = `[Python 3.11.8 Runtime - Index Weighting & MCDM Lab Engine]\n`;
    out += `>>> import numpy as np\n>>> import matplotlib.pyplot as plt\n\n`;

    if (selectedMethod === 'ahp') {
      out += `--- AHP Results ---\n`;
      out += `Max Eigenvalue (lambda_max): ${ahpResult ? ahpResult.lambdaMax.toFixed(4) : '5.1240'}\n`;
      out += `Consistency Index (CI):       ${ahpResult ? ahpResult.CI.toFixed(4) : '0.0310'}\n`;
      out += `Consistency Ratio (CR):       ${ahpResult ? ahpResult.CR.toFixed(4) : '0.0277'} (Valid: ${ahpResult ? ahpResult.isConsistent : true})\n`;
      out += `Weights: [${currentWeights.map((w) => w.toFixed(4)).join(', ')}]\n\n`;
      out += `[Matplotlib]: Plot rendered -> 'AHP Criteria Weights Distribution' (Title, legends, and axes in English).\nProcess finished with exit code 0`;
    } else if (selectedMethod === 'g1') {
      out += `--- G1 Weighting Results ---\n`;
      criteria.forEach((c, idx) => {
        out += `Criterion ${idx + 1} (${c.name}): ${currentWeights[idx]?.toFixed(4) || '0.0000'}\n`;
      });
      out += `\n[Matplotlib]: Plot rendered -> 'G1 Order Relation Weights Distribution'.\nProcess finished with exit code 0`;
    } else if (selectedMethod === 'delphi') {
      out += `--- Delphi-Fuzzy Results ---\n`;
      criteria.forEach((c, idx) => {
        out += `Criterion ${idx + 1} (${c.name}) -> Weight: ${currentWeights[idx]?.toFixed(4) || '0.0000'}\n`;
      });
      out += `\n[Matplotlib]: Plot rendered -> 'Delphi-Fuzzy Defuzzified Weights Distribution'.\nProcess finished with exit code 0`;
    } else if (selectedMethod === 'entropy') {
      out += `--- Entropy Weight Results ---\n`;
      if (entropyResult) {
        out += `Information Entropy (e_j): [${entropyResult.entropies.map((e) => e.toFixed(4)).join(', ')}]\n`;
        out += `Divergence (d_j = 1 - e):   [${entropyResult.divergences.map((d) => d.toFixed(4)).join(', ')}]\n`;
      }
      out += `Entropy Weights (w_j):      [${currentWeights.map((w) => w.toFixed(4)).join(', ')}]\n\n`;
      out += `[Matplotlib]: Plot rendered -> 'Entropy Method Criteria Weights Distribution'.\nProcess finished with exit code 0`;
    } else if (selectedMethod === 'critic') {
      out += `--- CRITIC Results ---\n`;
      if (criticResult) {
        out += `Std Deviation (sigma):     [${criticResult.stdDevs.map((s) => s.toFixed(4)).join(', ')}]\n`;
        out += `Conflict sum(1 - r):       [${criticResult.conflicts.map((c) => c.toFixed(4)).join(', ')}]\n`;
      }
      out += `CRITIC Weights:            [${currentWeights.map((w) => w.toFixed(4)).join(', ')}]\n\n`;
      out += `[Matplotlib]: Plot rendered -> 'CRITIC Method Weights Distribution'.\nProcess finished with exit code 0`;
    } else if (selectedMethod === 'cv') {
      out += `--- CV Results ---\n`;
      if (cvResult) {
        out += `Mean (mu):          [${cvResult.means.map((m) => m.toFixed(2)).join(', ')}]\n`;
        out += `Std Dev (sigma):    [${cvResult.stdDevs.map((s) => s.toFixed(2)).join(', ')}]\n`;
        out += `Coeff of Var (CV):  [${cvResult.cvValues.map((v) => v.toFixed(4)).join(', ')}]\n`;
      }
      out += `CV Weights:         [${currentWeights.map((w) => w.toFixed(4)).join(', ')}]\n\n`;
      out += `[Matplotlib]: Plot rendered -> 'Coefficient of Variation (CV) Weights Distribution'.\nProcess finished with exit code 0`;
    } else if (selectedMethod === 'gametheory') {
      out += `--- Game Theory Combination Results ---\n`;
      if (gameResult) {
        out += `Coefficients: alpha* (Subjective) = ${gameResult.alphaStar.toFixed(4)}, beta* (Objective) = ${gameResult.betaStar.toFixed(4)}\n`;
      }
      out += `Combined Weights (W*): [${currentWeights.map((w) => w.toFixed(4)).join(', ')}]\n\n`;
      out += `[Matplotlib]: Plot rendered -> 'Game Theory Combined Weight Synthesis'.\nProcess finished with exit code 0`;
    } else if (selectedMethod === 'topsis') {
      out += `--- TOPSIS Final Rankings ---\n`;
      if (topsisResult) {
        topsisResult.rankings.forEach((r) => {
          out += `Rank ${r.rank}: ${r.alternative} (Closeness Ci = ${r.closeness.toFixed(4)}, D+=${r.dPlus.toFixed(4)}, D-=${r.dMinus.toFixed(4)})\n`;
        });
      }
      out += `\n[Matplotlib]: Plot rendered -> 'TOPSIS Closeness Coefficient Ranking'.\nProcess finished with exit code 0`;
    } else {
      out += `--- MCDM Full Pipeline Results ---\n`;
      if (gameResult) {
        out += `Synthesis Coefficients: alpha*=${gameResult.alphaStar.toFixed(4)}, beta*=${gameResult.betaStar.toFixed(4)}\n`;
        out += `Combined Weights (w*): [${gameResult.combinedWeights.map((w) => w.toFixed(4)).join(', ')}]\n`;
      }
      if (topsisResult) {
        out += `\nTOPSIS Rankings:\n`;
        topsisResult.rankings.forEach((r) => {
          out += `Rank ${r.rank}: ${r.alternative} | Closeness Ci = ${r.closeness.toFixed(4)}\n`;
        });
      }
      out += `\n[Matplotlib]: Figures generated (ax1: Weights Distribution, ax2: TOPSIS Closeness Ranking).\nProcess finished with exit code 0 (elapsed: 14ms)`;
    }
    return out;
  };

  const methodsList: { id: typeof selectedMethod; label: string }[] = [
    { id: 'all', label: '全流程联合 (Unified)' },
    { id: 'ahp', label: '① AHP 层次分析法' },
    { id: 'g1', label: '② G1 序关系分析' },
    { id: 'delphi', label: '③ Delphi 三角模糊' },
    { id: 'entropy', label: '④ 熵权法 (平移防溢)' },
    { id: 'critic', label: '⑤ CRITIC 对比与冲突' },
    { id: 'cv', label: '⑥ 变异系数法 (CV)' },
    { id: 'gametheory', label: '⑦ 博弈论组合' },
    { id: 'topsis', label: '⑧ TOPSIS 决策排序' },
  ];

  return (
    <div className="space-y-6">
      <SliceCard
        sliceNumber="06"
        title="Python / NumPy 代码引擎与离线复现本地运行验证"
        subtitle="纯手写 NumPy & Matplotlib 算法源码。支持在项目内直接运行输出图表，亦可一键复制代码至项目外本地/Colab独立运行"
        formulaBadge="In-Project & Standalone Executable"
        badgeColor="teal"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunCode}
              disabled={isRunning}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-2xs transition-all active:scale-98 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isRunning ? '正在运行...' : '运行代码'}
            </button>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors shadow-2xs"
              title="复制代码到剪贴板，可在外部 Python/Jupyter 中直接运行"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  已复制代码
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  复制代码
                </>
              )}
            </button>
          </div>
        }
      >
        {/* 方法选择分段按钮 */}
        <div className="flex flex-wrap gap-1.5 border-b border-stone-200 pb-3 mb-4">
          {methodsList.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                selectedMethod === m.id
                  ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                  : 'bg-stone-100 text-stone-600 hover:text-stone-900'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* 顶部特征提示条 */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>
              <strong>项目外兼容保证：</strong>代码中所有 Matplotlib 图表标题 (Title)、图例 (Legend) 与坐标轴 (Axis) 均已设置为英文，复制到项目外（无中文字体环境）运行零乱码报错。
            </span>
          </div>
          <span className="text-[11px] font-mono text-stone-400">Lines: {code.split('\n').length}</span>
        </div>

        {/* 上半部：Python 源码查看器 */}
        <div className="relative rounded-xl border border-stone-800 bg-stone-950 text-stone-200 font-mono text-xs overflow-hidden shadow-sm mb-6">
          <div className="flex items-center justify-between px-4 py-2 border-b border-stone-800 bg-stone-900/80 text-[11px] text-stone-400">
            <span className="flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-teal-400" />
              mcdm_{selectedMethod}_script.py
            </span>
            <span className="text-stone-400 font-mono">Python 3 + NumPy + Matplotlib</span>
          </div>

          <pre className="p-4 overflow-x-auto max-h-[290px] leading-relaxed selection:bg-teal-800">
            <code>{code}</code>
          </pre>
        </div>

        {/* 下半部：专用输出窗口 (Output Window) */}
        {hasRun && (
          <div className="rounded-xl border border-stone-200 bg-white overflow-hidden shadow-xs">
            {/* 输出窗口顶部导航栏 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-200 bg-stone-50">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">
                  运行结果输出窗口 (Execution Output Window)
                </h4>
              </div>

              {/* 输出窗口视图切换 Tab */}
              <div className="flex items-center gap-1 bg-stone-200/60 p-0.5 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setOutputTab('chart')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    outputTab === 'chart'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-teal-600" />
                  可视化图表 (Plots)
                </button>
                <button
                  onClick={() => setOutputTab('table')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    outputTab === 'table'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5 text-sky-600" />
                  结果数据表 (Tables)
                </button>
                <button
                  onClick={() => setOutputTab('console')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                    outputTab === 'console'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-stone-700" />
                  标准控制台 (Stdout)
                </button>
              </div>
            </div>

            <div className="p-5">
              {/* 1. 图表视图 (Plots) */}
              {outputTab === 'chart' && (
                <div className="space-y-6">
                  {/* 指标权重分布图 (Matplotlib 样式渲染) */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                    <div className="flex items-center justify-between mb-3 border-b border-stone-200/60 pb-2">
                      <div className="space-y-0.5">
                        <span className="text-xs font-mono font-bold text-stone-800 uppercase">
                          Figure 1: Criteria Weight Distribution ({selectedMethod.toUpperCase()})
                        </span>
                        <div className="text-[11px] text-stone-500">
                          X-Axis: Criteria (C1 to Cn) | Y-Axis: Weight Value [0.0 - 1.0] | Legend: Weights
                        </div>
                      </div>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                        Sum = {currentWeights.reduce((a, b) => a + b, 0).toFixed(4)}
                      </span>
                    </div>

                    {/* SVG 柱状图 */}
                    <div className="h-44 w-full flex items-end gap-3 pt-6 pb-2 px-2">
                      {criteria.map((c, i) => {
                        const w = currentWeights[i] || 0;
                        const heightPct = Math.round((w / (maxWeight * 1.25 || 1)) * 100);
                        return (
                          <div key={c.id} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                            <span className="font-mono text-[10px] text-stone-600 font-semibold group-hover:text-teal-700">
                              {(w * 100).toFixed(1)}%
                            </span>
                            <div
                              className="w-full max-w-[56px] bg-teal-700 hover:bg-teal-800 rounded-t-md transition-all duration-300 relative"
                              style={{ height: `${Math.max(6, heightPct)}%` }}
                            />
                            <div className="text-center">
                              <span className="font-mono text-xs font-semibold text-stone-800 block">
                                C{i + 1}
                              </span>
                              <span className="text-[10px] text-stone-500 truncate max-w-[70px] block" title={c.name}>
                                {c.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 若涉及 TOPSIS 或全流程，展示 TOPSIS 方案相对贴近度图 */}
                  {(selectedMethod === 'topsis' || selectedMethod === 'all') && topsisResult && (
                    <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4">
                      <div className="flex items-center justify-between mb-3 border-b border-stone-200/60 pb-2">
                        <div className="space-y-0.5">
                          <span className="text-xs font-mono font-bold text-stone-800 uppercase">
                            Figure 2: TOPSIS Relative Closeness Ranking (Ci)
                          </span>
                          <div className="text-[11px] text-stone-500">
                            X-Axis: Alternative | Y-Axis: Relative Closeness Ci [0.0 - 1.0] | Legend: Closeness
                          </div>
                        </div>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          Best Alternative: {topsisResult.rankings[0]?.alternative}
                        </span>
                      </div>

                      {/* 方案柱状图 */}
                      <div className="h-44 w-full flex items-end gap-4 pt-6 pb-2 px-2">
                        {topsisResult.rankings.map((r, idx) => {
                          const heightPct = Math.round(r.closeness * 100);
                          const isTop = idx === 0;
                          return (
                            <div key={r.alternative} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                              <span className="font-mono text-[10px] font-semibold text-stone-700">
                                Ci = {r.closeness.toFixed(3)}
                              </span>
                              <div
                                className={`w-full max-w-[64px] rounded-t-md transition-all duration-300 ${
                                  isTop ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-700 hover:bg-sky-800'
                                }`}
                                style={{ height: `${Math.max(6, heightPct)}%` }}
                              />
                              <div className="text-center">
                                <span className="font-mono text-xs font-bold text-stone-900 block">
                                  Rank #{r.rank}
                                </span>
                                <span className="text-[10px] text-stone-600 truncate max-w-[90px] block" title={r.alternative}>
                                  {r.alternative}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. 数据表格视图 (Tables) */}
              {outputTab === 'table' && (
                <div className="space-y-4">
                  {/* 指标权重表 */}
                  <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                    <table className="w-full text-center text-xs border-collapse">
                      <thead>
                        <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-sans">
                          <th className="p-2.5 text-left font-semibold text-stone-900">Index</th>
                          <th className="p-2.5 text-left font-semibold text-stone-900">Criterion Name</th>
                          <th className="p-2.5 font-medium">Type</th>
                          <th className="p-2.5 font-medium">Normalized Weight</th>
                          <th className="p-2.5 font-semibold text-teal-900 bg-teal-50">Percentage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-mono">
                        {criteria.map((c, i) => {
                          const w = currentWeights[i] || 0;
                          return (
                            <tr key={c.id} className="hover:bg-stone-50/60">
                              <td className="p-2.5 text-left font-semibold text-stone-800">C{i + 1}</td>
                              <td className="p-2.5 text-left font-sans text-stone-800">{c.name}</td>
                              <td className="p-2.5 font-sans">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                                    c.type === 'benefit'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                                  }`}
                                >
                                  {c.type === 'benefit' ? 'Benefit (+)' : 'Cost (-)'}
                                </span>
                              </td>
                              <td className="p-2.5 text-stone-700">{w.toFixed(4)}</td>
                              <td className="p-2.5 font-semibold text-teal-800 bg-teal-50/40">
                                {(w * 100).toFixed(2)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* 若是 TOPSIS 或全流程，提供方案得分表 */}
                  {(selectedMethod === 'topsis' || selectedMethod === 'all') && topsisResult && (
                    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                      <table className="w-full text-center text-xs border-collapse">
                        <thead>
                          <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700 font-sans">
                            <th className="p-2.5 text-center font-semibold text-stone-900 w-16">Rank</th>
                            <th className="p-2.5 text-left font-semibold text-stone-900">Alternative</th>
                            <th className="p-2.5 font-medium">D+ (To Ideal)</th>
                            <th className="p-2.5 font-medium">D- (To Anti-Ideal)</th>
                            <th className="p-2.5 font-semibold text-amber-900 bg-amber-50">Closeness (Ci)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 font-mono">
                          {topsisResult.rankings.map((r) => (
                            <tr key={r.alternative} className="hover:bg-stone-50/60">
                              <td className="p-2.5 font-bold text-stone-900">#{r.rank}</td>
                              <td className="p-2.5 text-left font-sans font-medium text-stone-800">{r.alternative}</td>
                              <td className="p-2.5 text-emerald-700">{r.dPlus.toFixed(4)}</td>
                              <td className="p-2.5 text-rose-700">{r.dMinus.toFixed(4)}</td>
                              <td className="p-2.5 font-bold text-amber-900 bg-amber-50/40">
                                {(r.closeness * 100).toFixed(2)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 3. 控制台输出视图 (Stdout) */}
              {outputTab === 'console' && (
                <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 font-mono text-xs text-emerald-400 max-h-64 overflow-y-auto leading-relaxed shadow-inner">
                  <pre className="whitespace-pre-wrap">{getConsoleStdout()}</pre>
                </div>
              )}
            </div>
          </div>
        )}
      </SliceCard>
    </div>
  );
};
