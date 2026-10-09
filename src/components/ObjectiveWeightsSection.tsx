import React, { useState } from 'react';
import { Criterion, EntropyResult, CriticResult, CVResult } from '../types/mcdm';
import { SliceCard } from './SliceCard';
import { BarChart3, Network, Activity } from 'lucide-react';

interface ObjectiveWeightsSectionProps {
  criteria: Criterion[];
  entropyResult: EntropyResult;
  criticResult: CriticResult;
  cvResult: CVResult;
}

export const ObjectiveWeightsSection: React.FC<ObjectiveWeightsSectionProps> = ({
  criteria,
  entropyResult,
  criticResult,
  cvResult,
}) => {
  const [activeObjMethod, setActiveObjMethod] = useState<'entropy' | 'critic' | 'cv'>('entropy');

  return (
    <div className="space-y-6">
      <SliceCard
        sliceNumber="03"
        title="三大客观赋权法推导实验室"
        subtitle="纯粹挖掘多方案样本数据内在离散度与相关性结构：熵权法、CRITIC法、变异系数法"
        formulaBadge="e_j = -k Σ p ln(p) | C_j = σ_j · Σ(1-r_jk) | CV_j = σ_j / μ_j"
        badgeColor="teal"
      >
        {/* 子方法选择分段器 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-stone-200 pb-4 mb-6">
          <button
            onClick={() => setActiveObjMethod('entropy')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeObjMethod === 'entropy'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            ④ 熵权法 (信息熵与差异系数)
          </button>
          <button
            onClick={() => setActiveObjMethod('critic')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeObjMethod === 'critic'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            ⑤ CRITIC 法 (对比强度与冲突性)
          </button>
          <button
            onClick={() => setActiveObjMethod('cv')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeObjMethod === 'cv'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:text-stone-900'
            }`}
          >
            ⑥ 变异系数法 (CV 相对离散度)
          </button>
        </div>

        {/* 1. 熵权法 */}
        {activeObjMethod === 'entropy' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60">
              <h4 className="text-sm font-semibold text-stone-900 mb-1">
                信息熵赋权机理：e_j = -k Σ p_ij ln(p_ij)，其中 k = 1 / ln(m)
              </h4>
              <p className="text-xs text-stone-500">
                指标在各方案间的数值变异程度越大，信息熵 e_j 越小，说明该指标提供的信息量越大，差异系数 d_j = 1 - e_j 越高，赋权权重越高。
              </p>
            </div>

            {/* 熵权推导表格 */}
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700">
                    <th className="p-2.5 text-left font-semibold text-stone-900">指标名称</th>
                    <th className="p-2.5 font-medium">指标属性</th>
                    <th className="p-2.5 font-medium">信息熵 e_j</th>
                    <th className="p-2.5 font-medium">差异系数 d_j = 1 - e_j</th>
                    <th className="p-2.5 font-semibold text-teal-900 bg-teal-50/50">熵权权重 w_j</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {criteria.map((c, idx) => {
                    const e = entropyResult.entropies[idx] ?? 0;
                    const d = entropyResult.divergences[idx] ?? 0;
                    const w = entropyResult.weights[idx] ?? 0;
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/60">
                        <td className="p-2.5 text-left font-medium text-stone-800 bg-stone-50/30 border-r border-stone-100 font-sans">
                          {c.name}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-sans ${
                              c.type === 'benefit'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {c.type === 'benefit' ? '效益型 +' : '成本型 -'}
                          </span>
                        </td>
                        <td className="p-2.5 text-stone-600">{e.toFixed(4)}</td>
                        <td className="p-2.5 text-stone-800 font-semibold">{d.toFixed(4)}</td>
                        <td className="p-2.5 font-semibold text-teal-800 bg-teal-50/40">
                          {(w * 100).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 权重水平条 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {criteria.map((c, i) => {
                const w = entropyResult.weights[i] || 0;
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

        {/* 2. CRITIC 法 */}
        {activeObjMethod === 'critic' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60">
              <h4 className="text-sm font-semibold text-stone-900 mb-1">
                CRITIC 法：对比强度 (标准差 σ) 与冲突性 (Σ(1-r_jk)) 复合测度
              </h4>
              <p className="text-xs text-stone-500">
                不仅考量单个指标区分方案的对比强度 (σ_j)，而且通过 Pearson 相关矩阵测度指标间的冲突性。若某指标与其他指标高度正相关，冲突性低，说明信息冗余，CRITIC 会自动削减其权重。
              </p>
            </div>

            {/* CRITIC 指标推导 */}
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700">
                    <th className="p-2.5 text-left font-semibold text-stone-900">指标</th>
                    <th className="p-2.5 font-medium">对比强度 (标准差 σ_j)</th>
                    <th className="p-2.5 font-medium">冲突性测度 Σ(1 - r_jk)</th>
                    <th className="p-2.5 font-medium">综合信息量 C_j</th>
                    <th className="p-2.5 font-semibold text-teal-900 bg-teal-50/50">CRITIC 权重 w_j</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {criteria.map((c, idx) => {
                    const std = criticResult.stdDevs[idx] ?? 0;
                    const conflict = criticResult.conflicts[idx] ?? 0;
                    const cj = criticResult.informationQuantities[idx] ?? 0;
                    const w = criticResult.weights[idx] ?? 0;
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/60">
                        <td className="p-2.5 text-left font-medium text-stone-800 bg-stone-50/30 border-r border-stone-100 font-sans">
                          {c.name}
                        </td>
                        <td className="p-2.5 text-stone-700">{std.toFixed(4)}</td>
                        <td className="p-2.5 text-stone-700">{conflict.toFixed(4)}</td>
                        <td className="p-2.5 text-stone-900 font-semibold">{cj.toFixed(4)}</td>
                        <td className="p-2.5 font-semibold text-teal-800 bg-teal-50/40">
                          {(w * 100).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 相关系数热力矩阵 */}
            {criticResult.correlationMatrix.length > 0 && (
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800">
                  <Network className="w-3.5 h-3.5 text-stone-500" />
                  Pearson 指标相关系数矩阵 R = [r_jk] (高相关即冗余):
                </div>
                <div className="overflow-x-auto">
                  <table className="text-center font-mono text-[11px] border-collapse bg-white rounded-lg border border-stone-200">
                    <thead>
                      <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-700">
                        <th className="p-2 text-left font-sans text-xs">指标相关性</th>
                        {criteria.map((c) => (
                          <th key={c.id} className="p-2 font-sans truncate max-w-[90px]">
                            {c.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {criteria.map((rowC, i) => (
                        <tr key={rowC.id}>
                          <td className="p-2 text-left font-sans font-medium text-stone-700 bg-stone-50/50">
                            {rowC.name}
                          </td>
                          {criteria.map((colC, j) => {
                            const rVal = criticResult.correlationMatrix[i]?.[j] ?? 0;
                            // Coloring based on correlation
                            const isHigh = Math.abs(rVal) > 0.8 && i !== j;
                            return (
                              <td
                                key={colC.id}
                                className={`p-2 font-medium ${
                                  i === j
                                    ? 'text-stone-400 bg-stone-50/40'
                                    : isHigh
                                    ? 'text-amber-800 bg-amber-50 font-semibold'
                                    : 'text-stone-600'
                                }`}
                              >
                                {rVal.toFixed(3)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. 变异系数法 */}
        {activeObjMethod === 'cv' && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60">
              <h4 className="text-sm font-semibold text-stone-900 mb-1">
                变异系数法：CV_j = σ_j / |μ_j| 消除绝对量纲的相对离散度
              </h4>
              <p className="text-xs text-stone-500">
                通过标准差与均值之比衡量相对变异程度，消除了指标绝对量纲大小对离散度的影响。变异系数越大，表明指标区分各备选方案能力越强。
              </p>
            </div>

            {/* CV 推导表格 */}
            <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-center text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700">
                    <th className="p-2.5 text-left font-semibold text-stone-900">指标</th>
                    <th className="p-2.5 font-medium">均值 μ_j</th>
                    <th className="p-2.5 font-medium">标准差 σ_j</th>
                    <th className="p-2.5 font-medium">变异系数 CV_j</th>
                    <th className="p-2.5 font-semibold text-teal-900 bg-teal-50/50">CV 权重 w_j</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono">
                  {criteria.map((c, idx) => {
                    const mu = cvResult.means[idx] ?? 0;
                    const std = cvResult.stdDevs[idx] ?? 0;
                    const cv = cvResult.cvValues[idx] ?? 0;
                    const w = cvResult.weights[idx] ?? 0;
                    return (
                      <tr key={c.id} className="hover:bg-stone-50/60">
                        <td className="p-2.5 text-left font-medium text-stone-800 bg-stone-50/30 border-r border-stone-100 font-sans">
                          {c.name}
                        </td>
                        <td className="p-2.5 text-stone-700">{mu.toFixed(2)}</td>
                        <td className="p-2.5 text-stone-700">{std.toFixed(2)}</td>
                        <td className="p-2.5 text-stone-900 font-semibold">{cv.toFixed(4)}</td>
                        <td className="p-2.5 font-semibold text-teal-800 bg-teal-50/40">
                          {(w * 100).toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 权重水平条 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {criteria.map((c, i) => {
                const w = cvResult.weights[i] || 0;
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
      </SliceCard>
    </div>
  );
};
