import React, { useState } from 'react';
import { Criterion, AHPResult, G1Result, DelphiFuzzyResult } from '../types/mcdm';
import { SliceCard } from './SliceCard';
import { CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';

interface SubjectiveWeightsSectionProps {
  criteria: Criterion[];
  ahpMatrix: number[][];
  ahpResult: AHPResult;
  g1Ratios: number[];
  g1Result: G1Result;
  fuzzyScores: [number, number, number][][];
  delphiResult: DelphiFuzzyResult;
  onUpdateAhpMatrix: (m: number[][]) => void;
  onUpdateG1Ratios: (ratios: number[]) => void;
  onUpdateFuzzyScores: (scores: [number, number, number][][]) => void;
}

export const SubjectiveWeightsSection: React.FC<SubjectiveWeightsSectionProps> = ({
  criteria,
  ahpMatrix,
  ahpResult,
  g1Ratios,
  g1Result,
  fuzzyScores,
  delphiResult,
  onUpdateAhpMatrix,
  onUpdateG1Ratios,
  onUpdateFuzzyScores,
}) => {
  const [activeSubMethod, setActiveSubMethod] = useState<'ahp' | 'g1' | 'delphi'>('ahp');

  // AHP cell change handler
  const handleAhpCellChange = (i: number, j: number, val: number) => {
    if (i === j) return;
    const n = ahpMatrix.length;
    const newM = ahpMatrix.map(row => [...row]);
    const cleanVal = Math.max(0.111, Math.min(9, val));
    newM[i][j] = cleanVal;
    newM[j][i] = 1 / cleanVal;
    onUpdateAhpMatrix(newM);
  };

  // G1 ratio change handler
  const handleG1RatioChange = (idx: number, val: number) => {
    const updated = [...g1Ratios];
    updated[idx] = Math.max(1.0, Math.min(2.0, val));
    onUpdateG1Ratios(updated);
  };

  // Delphi fuzzy score change
  const handleFuzzyChange = (expertIdx: number, critIdx: number, tupleIdx: 0 | 1 | 2, val: number) => {
    const updated = fuzzyScores.map(row => row.map(tuple => [...tuple] as [number, number, number]));
    updated[expertIdx][critIdx][tupleIdx] = Math.max(0, Math.min(10, val));
    onUpdateFuzzyScores(updated);
  };

  return (
    <div className="space-y-6">
      {/* 模块主卡片 */}
      <SliceCard
        sliceNumber="02"
        title="三大主观赋权法推导实验室"
        subtitle="结合决策专家经验与定性战略导向：AHP层次分析法、G1序关系分析法、德尔菲-三角模糊数法"
        formulaBadge="Aw = λ_max · w | w_k-1 = r_k · w_k | DF = (l + 2m + u)/4"
        badgeColor="teal"
      >
        {/* 子方法选择分段器 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4 mb-6">
          <button
            onClick={() => setActiveSubMethod('ahp')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubMethod === 'ahp'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            ① AHP 层次分析法 (判断矩阵 & CR检验)
          </button>
          <button
            onClick={() => setActiveSubMethod('g1')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubMethod === 'g1'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            ② G1 序关系分析法 (免矩阵平滑递推)
          </button>
          <button
            onClick={() => setActiveSubMethod('delphi')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeSubMethod === 'delphi'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            ③ 德尔菲-三角模糊法 (Delphi-Fuzzy TFN)
          </button>
        </div>

        {/* 1. AHP 模块 */}
        {activeSubMethod === 'ahp' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-stone-200 bg-stone-50/70">
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-stone-900">
                  Satty 1-9 标度判断矩阵 A = [a_ij] (互反矩阵 a_ji = 1/a_ij)
                </h4>
                <p className="text-xs text-stone-500">
                  1: 同等重要 | 3: 略微重要 | 5: 显著重要 | 7: 强烈重要 | 9: 极端重要 (2,4,6,8为折中值)
                </p>
              </div>

              {/* CR 一致性仪表指示 */}
              <div
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl border font-mono text-xs shadow-2xs ${
                  ahpResult.isConsistent
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}
              >
                {ahpResult.isConsistent ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <div>
                  <div className="font-semibold">
                    CR = {ahpResult.CR.toFixed(4)}{' '}
                    <span className="font-normal">
                      ({ahpResult.isConsistent ? '< 0.10 通过' : '≥ 0.10 逻辑矛盾！'})
                    </span>
                  </div>
                  <div className="text-[10px] text-stone-500">
                    λ_max = {ahpResult.lambdaMax.toFixed(3)} | CI = {ahpResult.CI.toFixed(4)}
                  </div>
                </div>
              </div>
            </div>

            {/* AHP 判断矩阵表格 */}
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700">
                    <th className="p-2.5 text-left font-semibold text-stone-900 min-w-[130px]">成对重要度比较</th>
                    {criteria.map((c, idx) => (
                      <th key={c.id} className="p-2.5 font-medium text-stone-800 min-w-[90px]">
                        {c.name}
                      </th>
                    ))}
                    <th className="p-2.5 font-semibold text-teal-900 bg-teal-50/50 min-w-[100px]">
                      特征向量权重 w
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {criteria.map((rowC, i) => (
                    <tr key={rowC.id} className="hover:bg-stone-50/60">
                      <td className="p-2.5 text-left font-medium text-stone-900 bg-stone-50/40 border-r border-stone-100">
                        {rowC.name}
                      </td>
                      {criteria.map((colC, j) => {
                        const val = ahpMatrix[i]?.[j] ?? 1;
                        const isDiagonal = i === j;
                        return (
                          <td key={colC.id} className="p-2">
                            {isDiagonal ? (
                              <span className="font-mono text-stone-400 font-medium">1</span>
                            ) : i < j ? (
                              <select
                                value={val < 1 ? `1/${Math.round(1 / val)}` : `${Math.round(val)}`}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  let num = 1;
                                  if (text.startsWith('1/')) {
                                    num = 1 / parseFloat(text.replace('1/', ''));
                                  } else {
                                    num = parseFloat(text);
                                  }
                                  handleAhpCellChange(i, j, num);
                                }}
                                className="w-full rounded border border-stone-200 bg-stone-50/70 p-1 text-center font-mono text-xs focus:bg-white focus:border-teal-500"
                              >
                                <option value="9">9</option>
                                <option value="7">7</option>
                                <option value="5">5</option>
                                <option value="3">3</option>
                                <option value="2">2</option>
                                <option value="1">1</option>
                                <option value="1/2">1/2</option>
                                <option value="1/3">1/3</option>
                                <option value="1/5">1/5</option>
                                <option value="1/7">1/7</option>
                                <option value="1/9">1/9</option>
                              </select>
                            ) : (
                              <span className="font-mono text-stone-500">
                                {val >= 1 ? val.toFixed(2) : `1/${(1 / val).toFixed(0)}`}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2.5 font-mono font-semibold text-teal-800 bg-teal-50/40">
                        {(ahpResult.weights[i] * 100).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 权重水平对比条 */}
            <div className="space-y-2 p-4 rounded-xl border border-stone-200 bg-stone-50/50">
              <span className="text-xs font-semibold text-stone-700">AHP 主观权重分布:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {criteria.map((c, i) => {
                  const w = ahpResult.weights[i] || 0;
                  return (
                    <div key={c.id} className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-stone-700 truncate">{c.name}</span>
                        <span className="font-mono font-semibold text-teal-700">{(w * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${w * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* 2. G1 序关系分析法 */}
        {activeSubMethod === 'g1' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60">
              <h4 className="text-sm font-semibold text-stone-900 mb-1">
                G1 序关系分析法：相邻重要度比值 r_k = w_(k-1) / w_k 平滑递推
              </h4>
              <p className="text-xs text-stone-500">
                专家按重要性排序 x_1* ≥ x_2* ≥ ... ≥ x_n* 后，无需构造互反矩阵，直接设置相邻比值 r_k ∈ [1.0, 1.8]，数学上严格不存在矛盾（无 CR 风险）。
              </p>
            </div>

            {/* 相邻比值滑块与调节器 */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-stone-700">相邻指标重要度比值系数设定 (r_k):</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {criteria.slice(1).map((c, idx) => {
                  const prevCrit = criteria[idx];
                  const ratio = g1Ratios[idx] ?? 1.2;
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-white shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-900">
                          <span>{prevCrit.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                          <span>{c.name}</span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          比值 r_{idx + 2} = w_{idx + 1} / w_{idx + 2}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="1.0"
                          max="1.8"
                          step="0.05"
                          value={ratio}
                          onChange={(e) => handleG1RatioChange(idx, parseFloat(e.target.value))}
                          className="w-24 accent-teal-600"
                        />
                        <span className="font-mono text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-1 rounded border border-teal-200 w-12 text-center">
                          {ratio.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 递推公式展开切片 */}
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-900 text-stone-100 font-mono text-xs space-y-1.5 overflow-x-auto">
              <div className="text-stone-400 mb-1">// G1 逆向递推求解过程展开:</div>
              {g1Result.formulaSteps.map((step, idx) => (
                <div key={idx} className="text-teal-300">
                  {step}
                </div>
              ))}
            </div>

            {/* G1 权重分布 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {criteria.map((c, i) => {
                const w = g1Result.weights[i] || 0;
                return (
                  <div key={c.id} className="bg-white p-2.5 rounded-lg border border-stone-200 shadow-2xs">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-stone-700 truncate">{c.name}</span>
                      <span className="font-mono font-semibold text-teal-700">{(w * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-teal-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${w * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Delphi-Fuzzy 模块 */}
        {activeSubMethod === 'delphi' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60">
              <h4 className="text-sm font-semibold text-stone-900 mb-1">
                德尔菲-三角模糊数法 (Delphi-Fuzzy TFN)
              </h4>
              <p className="text-xs text-stone-500">
                多轮专家问卷使用三角模糊数 A = (l, m, u) 打分 (0-10分)。l: 保守下限, m: 最可能中值, u: 乐观上限。
                通过重心法 DF = (l + 2m + u) / 4 解模糊化消除主观犹豫不确定性。
              </p>
            </div>

            {/* 专家打分表格 */}
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700">
                    <th className="p-2.5 text-left font-semibold text-stone-900 min-w-[120px]">评审专家 \ 指标</th>
                    {criteria.map((c) => (
                      <th key={c.id} className="p-2.5 font-medium min-w-[130px]">
                        {c.name}
                        <div className="text-[10px] text-stone-400 font-normal">(l, m, u)</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {fuzzyScores.map((expertScores, expertIdx) => (
                    <tr key={expertIdx} className="hover:bg-stone-50/60">
                      <td className="p-2.5 text-left font-medium text-stone-800 bg-stone-50/40 border-r border-stone-100">
                        专家 #{expertIdx + 1}
                      </td>
                      {criteria.map((c, critIdx) => {
                        const [l, m, u] = expertScores[critIdx] || [5, 6, 7];
                        return (
                          <td key={c.id} className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                value={l}
                                onChange={(e) => handleFuzzyChange(expertIdx, critIdx, 0, parseFloat(e.target.value))}
                                className="w-10 rounded border border-stone-200 text-center py-0.5 text-xs bg-stone-50"
                                title="下限 l"
                              />
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                value={m}
                                onChange={(e) => handleFuzzyChange(expertIdx, critIdx, 1, parseFloat(e.target.value))}
                                className="w-10 rounded border border-teal-300 font-semibold text-teal-800 text-center py-0.5 text-xs bg-teal-50/40"
                                title="中值 m"
                              />
                              <input
                                type="number"
                                step="0.5"
                                min="0"
                                max="10"
                                value={u}
                                onChange={(e) => handleFuzzyChange(expertIdx, critIdx, 2, parseFloat(e.target.value))}
                                className="w-10 rounded border border-stone-200 text-center py-0.5 text-xs bg-stone-50"
                                title="上限 u"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-teal-50/50 border-t border-teal-200 font-mono text-xs font-semibold text-teal-900">
                    <td className="p-2.5 text-left">重心解模糊权重</td>
                    {delphiResult.weights.map((w, idx) => (
                      <td key={idx} className="p-2.5">
                        {(w * 100).toFixed(2)}%
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </SliceCard>
    </div>
  );
};
