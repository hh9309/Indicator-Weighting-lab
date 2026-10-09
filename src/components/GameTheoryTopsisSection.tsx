import React, { useState } from 'react';
import { Criterion, GameTheoryResult, TopsisResult } from '../types/mcdm';
import { SliceCard } from './SliceCard';
import { Trophy, Compass, Sliders, Sparkles, Scale, Activity } from 'lucide-react';

interface GameTheoryTopsisSectionProps {
  criteria: Criterion[];
  alternatives: string[];
  gameResult: GameTheoryResult;
  topsisResult: TopsisResult;
  selectedSubMethodName: string;
  selectedObjMethodName: string;
  onSelectSubMethod: (name: 'ahp' | 'g1' | 'delphi') => void;
  onSelectObjMethod: (name: 'entropy' | 'critic' | 'cv') => void;
  customAlpha: number;
  onUpdateCustomAlpha: (alpha: number) => void;
  onApplyGameTheoryAlpha: () => void;
}

export const GameTheoryTopsisSection: React.FC<GameTheoryTopsisSectionProps> = ({
  criteria,
  alternatives,
  gameResult,
  topsisResult,
  selectedSubMethodName,
  selectedObjMethodName,
  onSelectSubMethod,
  onSelectObjMethod,
  customAlpha,
  onUpdateCustomAlpha,
  onApplyGameTheoryAlpha,
}) => {
  const [selectedSensitivityCrit, setSelectedSensitivityCrit] = useState<number>(0);

  return (
    <div className="space-y-6">
      {/* 切片1：博弈论主客观组合赋权 */}
      <SliceCard
        sliceNumber="04"
        title="博弈论组合赋权与 TOPSIS 决策空间投影"
        subtitle="向量投影极小化主客观离差 W* = α W_sub + β W_obj 及 TOPSIS 理想解欧氏空间几何排序"
        formulaBadge="min ||Σ α_k W_k^T - W^T||_2 & C_i = D_i^- / (D_i^+ + D_i^-)"
        badgeColor="teal"
      >
        {/* 博弈组合配置区 */}
        <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4 space-y-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal-600" />
                博弈论主客观融合源设置 (Game Theory Vector Synthesis)
              </h4>
              <p className="text-xs text-stone-500">
                通过矩阵方程组解得使主观战略偏好与客观数据特征离差极小化的最优化系数对 (α*, β*)。
              </p>
            </div>

            <button
              onClick={onApplyGameTheoryAlpha}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 shadow-2xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              应用博弈论解析最优解 (α* = {gameResult.alphaStar.toFixed(3)})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 主观法选择 */}
            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                <span>主观赋权基底 (W_sub):</span>
                <span className="font-mono text-teal-700">当前占比: {(customAlpha * 100).toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['ahp', 'g1', 'delphi'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => onSelectSubMethod(method)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedSubMethodName === method
                        ? 'bg-stone-900 text-white font-semibold shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {method === 'ahp' ? 'AHP 层次' : method === 'g1' ? 'G1 序关系' : 'Delphi 模糊'}
                  </button>
                ))}
              </div>
            </div>

            {/* 客观法选择 */}
            <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs space-y-2">
              <div className="text-xs font-semibold text-stone-800 flex items-center justify-between">
                <span>客观赋权基底 (W_obj):</span>
                <span className="font-mono text-sky-700">当前占比: {((1 - customAlpha) * 100).toFixed(1)}%</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['entropy', 'critic', 'cv'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => onSelectObjMethod(method)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedObjMethodName === method
                        ? 'bg-stone-900 text-white font-semibold shadow-2xs'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {method === 'entropy' ? '熵权法' : method === 'critic' ? 'CRITIC' : '变异系数 CV'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 交互调节滑块 */}
          <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-stone-700">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-stone-400" />
                主客观配比调节器 (α* + β* ≡ 1.0)
              </span>
              <span className="font-mono text-[11px] text-stone-500">
                主观偏好: {(customAlpha * 100).toFixed(1)}% | 客观数据: {((1 - customAlpha) * 100).toFixed(1)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              value={customAlpha}
              onChange={(e) => onUpdateCustomAlpha(parseFloat(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>
        </div>

        {/* 组合权重对比表 */}
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white mb-6">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/80 border-b border-stone-200 text-stone-700">
                <th className="p-2.5 text-left font-semibold text-stone-900">指标体系</th>
                <th className="p-2.5 font-medium">主观权重 ({selectedSubMethodName.toUpperCase()})</th>
                <th className="p-2.5 font-medium">客观权重 ({selectedObjMethodName.toUpperCase()})</th>
                <th className="p-2.5 font-semibold text-teal-900 bg-teal-50/70">
                  博弈论组合权重 W*
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {criteria.map((c, idx) => {
                const subW = gameResult.subWeights[idx] ?? 0;
                const objW = gameResult.objWeights[idx] ?? 0;
                const combW = gameResult.combinedWeights[idx] ?? 0;
                return (
                  <tr key={c.id} className="hover:bg-stone-50/60">
                    <td className="p-2.5 text-left font-medium text-stone-800 bg-stone-50/30 border-r border-stone-100 font-sans">
                      {c.name}
                    </td>
                    <td className="p-2.5 text-stone-600">{(subW * 100).toFixed(2)}%</td>
                    <td className="p-2.5 text-stone-600">{(objW * 100).toFixed(2)}%</td>
                    <td className="p-2.5 font-semibold text-teal-800 bg-teal-50/40">
                      {(combW * 100).toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TOPSIS 决策结果排行榜与贴近度 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-stone-900 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              TOPSIS 备选方案优劣度排序 (Relative Closeness C_i)
            </h4>
            <span className="text-xs text-stone-500">贴近度 C_i 越接近 1.0 综合表现越优</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {topsisResult.rankings.map((r, rankIdx) => {
              const isFirst = rankIdx === 0;
              const isSecond = rankIdx === 1;
              const isThird = rankIdx === 2;

              return (
                <div
                  key={r.alternative}
                  className={`p-4 rounded-xl border transition-all ${
                    isFirst
                      ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                      : isSecond
                      ? 'bg-slate-50 border-slate-300'
                      : isThird
                      ? 'bg-stone-50 border-stone-300'
                      : 'bg-white border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`h-6 w-6 rounded-md flex items-center justify-center font-mono font-bold text-xs ${
                        isFirst
                          ? 'bg-amber-500 text-white'
                          : isSecond
                          ? 'bg-slate-400 text-white'
                          : isThird
                          ? 'bg-stone-400 text-white'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      #{r.rank}
                    </span>
                    <span className="font-mono text-xs font-semibold text-stone-800">
                      C_i = {(r.closeness * 100).toFixed(2)}%
                    </span>
                  </div>

                  <h5 className="font-semibold text-sm text-stone-900 mb-1.5 truncate" title={r.alternative}>
                    {r.alternative}
                  </h5>

                  <div className="space-y-1 font-mono text-[11px] text-stone-500">
                    <div className="flex justify-between">
                      <span>距正理想解 D+:</span>
                      <span className="text-emerald-700 font-medium">{r.dPlus.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>距负理想解 D-:</span>
                      <span className="text-rose-700 font-medium">{r.dMinus.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="mt-3 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full ${
                        isFirst ? 'bg-amber-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${Math.max(5, r.closeness * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 正负理想解坐标提示 */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 text-xs text-stone-600 flex items-start gap-2">
            <Compass className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-800">TOPSIS 几何空间坐标定义：</span>
              正理想解 <code className="font-mono bg-stone-200 px-1 py-0.5 rounded text-emerald-800">Z+ = max(v_ij)</code>{' '}
              各维度均为加权最高水准；负理想解 <code className="font-mono bg-stone-200 px-1 py-0.5 rounded text-rose-800">Z- = min(v_ij)</code>{' '}
              均为加权最低水准。欧氏距离公式严格保障解空间旋转不变性。
            </div>
          </div>
        </div>
      </SliceCard>
    </div>
  );
};
