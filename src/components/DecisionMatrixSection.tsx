import React, { useState } from 'react';
import { Criterion, NormalizedData } from '../types/mcdm';
import { SliceCard } from './SliceCard';
import { Plus, Trash2, ArrowUpDown, FileSpreadsheet, RefreshCw, Sparkles } from 'lucide-react';

interface DecisionMatrixSectionProps {
  matrix: number[][];
  criteria: Criterion[];
  alternatives: string[];
  normalizedData: NormalizedData;
  onUpdateMatrix: (matrix: number[][]) => void;
  onUpdateCriteria: (criteria: Criterion[]) => void;
  onUpdateAlternatives: (alternatives: string[]) => void;
  onResetBenchmark: () => void;
}

export const DecisionMatrixSection: React.FC<DecisionMatrixSectionProps> = ({
  matrix,
  criteria,
  alternatives,
  normalizedData,
  onUpdateMatrix,
  onUpdateCriteria,
  onUpdateAlternatives,
  onResetBenchmark,
}) => {
  const [activeTab, setActiveTab] = useState<'raw' | 'minmax' | 'vector'>('raw');
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);

  const handleCellChange = (row: number, col: number, val: number) => {
    const newM = matrix.map((r, rIdx) =>
      r.map((c, cIdx) => (rIdx === row && cIdx === col ? (isNaN(val) ? 0 : val) : c))
    );
    onUpdateMatrix(newM);
  };

  const handleToggleCriterionType = (colIdx: number) => {
    const updated = criteria.map((c, idx) => {
      if (idx === colIdx) {
        return {
          ...c,
          type: (c.type === 'benefit' ? 'cost' : 'benefit') as 'benefit' | 'cost',
        };
      }
      return c;
    });
    onUpdateCriteria(updated);
  };

  const handleAddAlternative = () => {
    const newAltName = `方案 ${String.fromCharCode(65 + alternatives.length)}`;
    const newRow = Array(criteria.length).fill(10);
    onUpdateAlternatives([...alternatives, newAltName]);
    onUpdateMatrix([...matrix, newRow]);
  };

  const handleRemoveAlternative = (idx: number) => {
    if (alternatives.length <= 2) return;
    const newAlts = alternatives.filter((_, i) => i !== idx);
    const newM = matrix.filter((_, i) => i !== idx);
    onUpdateAlternatives(newAlts);
    onUpdateMatrix(newM);
  };

  const handleAddCriterion = () => {
    const newId = `c${criteria.length + 1}`;
    const newCrit: Criterion = {
      id: newId,
      name: `指标 X${criteria.length + 1}`,
      type: 'benefit',
      unit: '分',
    };
    const newCritList = [...criteria, newCrit];
    const newM = matrix.map(row => [...row, 50]);
    onUpdateCriteria(newCritList);
    onUpdateMatrix(newM);
  };

  const handleRemoveCriterion = (idx: number) => {
    if (criteria.length <= 2) return;
    const newCritList = criteria.filter((_, i) => i !== idx);
    const newM = matrix.map(row => row.filter((_, i) => i !== idx));
    onUpdateCriteria(newCritList);
    onUpdateMatrix(newM);
  };

  const exportCsv = () => {
    const header = ['方案名称', ...criteria.map(c => `${c.name}(${c.type === 'benefit' ? '效益型+' : '成本型-'})`)].join(',');
    const rows = alternatives.map((alt, i) => [alt, ...matrix[i]].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [header, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'MCDM_Decision_Matrix.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 切片1：代数原理与极值转换推导 */}
      <SliceCard
        sliceNumber="01"
        title="决策矩阵代数与正规化推导引擎"
        subtitle="多元决策矩阵 X = [x_ij] 与效益/成本型极值极小化代数空间转换"
        formulaBadge="z_ij = (x_ij - x_min) / (x_max - x_min)"
        badgeColor="teal"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" />
              导出 CSV
            </button>
            <button
              onClick={onResetBenchmark}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100 transition-colors"
              title="重置为当前案例基准值"
            >
              <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
              重置基准
            </button>
          </div>
        }
      >
        {/* 数学代数切片卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                ① 效益型指标 (Benefit / 正向)
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-emerald-100/70 text-emerald-800">
                越大越优
              </span>
            </div>
            <div className="text-sm font-mono text-emerald-950 bg-white/80 p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
              z_ij = (x_ij - x_min,j) / (x_max,j - x_min,j)
            </div>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              将原始数据映射至 [0, 1] 闭区间，最优方案取 1.0，最劣方案取 0.0。
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
                ② 成本型指标 (Cost / 负向逆转)
              </span>
              <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-800">
                越小越优
              </span>
            </div>
            <div className="text-sm font-mono text-amber-950 bg-white/80 p-2.5 rounded-lg border border-amber-100 shadow-2xs">
              z_ij = (x_max,j - x_ij) / (x_max,j - x_min,j)
            </div>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              反转坐标方向使得所有指标“趋优一致性”。若未执行同向化，将导致 TOPSIS 正负理想解逻辑完全倒置！
            </p>
          </div>
        </div>

        {/* 矩阵查看方式切换 */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('raw')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'raw'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              原始决策矩阵 X [{matrix.length} × {criteria.length}]
            </button>
            <button
              onClick={() => setActiveTab('minmax')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'minmax'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              极值规范化矩阵 Z (Min-Max)
            </button>
            <button
              onClick={() => setActiveTab('vector')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'vector'
                  ? 'bg-white text-sky-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              向量标准化矩阵 R (Vector Norm)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddAlternative}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 增加方案
            </button>
            <button
              onClick={handleAddCriterion}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> 增加指标
            </button>
          </div>
        </div>

        {/* 交互式矩阵数据表格 */}
        <div className="overflow-x-auto rounded-xl border border-stone-200/80 bg-stone-50/30">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-100/70 text-stone-700">
                <th className="p-3 font-semibold text-stone-900 sticky left-0 bg-stone-100/90 min-w-[150px]">
                  备选方案 \ 指标体系
                </th>
                {criteria.map((c, colIdx) => (
                  <th key={c.id} className="p-3 font-medium min-w-[160px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-stone-900 truncate">{c.name}</span>
                        {criteria.length > 2 && (
                          <button
                            onClick={() => handleRemoveCriterion(colIdx)}
                            className="text-stone-400 hover:text-rose-600 transition-colors"
                            title="删除该指标"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <button
                          onClick={() => handleToggleCriterionType(colIdx)}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-mono font-medium border transition-colors ${
                            c.type === 'benefit'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                          }`}
                          title="点击切换 正向/负向"
                        >
                          <ArrowUpDown className="w-2.5 h-2.5" />
                          {c.type === 'benefit' ? '效益型 (+)' : '成本型 (-)'}
                        </button>
                        {c.unit && <span className="text-stone-400">[{c.unit}]</span>}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/60 bg-white">
              {alternatives.map((alt, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-stone-50/80 transition-colors">
                  <td className="p-3 font-medium text-stone-800 sticky left-0 bg-white/95 border-r border-stone-100">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={alt}
                        onChange={(e) => {
                          const newAlts = [...alternatives];
                          newAlts[rowIdx] = e.target.value;
                          onUpdateAlternatives(newAlts);
                        }}
                        className="bg-transparent font-medium text-stone-900 focus:bg-stone-100 px-1 py-0.5 rounded outline-hidden w-full"
                      />
                      {alternatives.length > 2 && (
                        <button
                          onClick={() => handleRemoveAlternative(rowIdx)}
                          className="text-stone-300 hover:text-rose-600 transition-colors"
                          title="删除该方案"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>

                  {criteria.map((c, colIdx) => {
                    const rawVal = matrix[rowIdx]?.[colIdx] ?? 0;
                    const minMaxVal = normalizedData.minMaxMatrix[rowIdx]?.[colIdx] ?? 0;
                    const vectorVal = normalizedData.vectorNormMatrix[rowIdx]?.[colIdx] ?? 0;

                    if (activeTab === 'raw') {
                      return (
                        <td key={colIdx} className="p-2.5">
                          <input
                            type="number"
                            step="any"
                            value={rawVal}
                            onChange={(e) => handleCellChange(rowIdx, colIdx, parseFloat(e.target.value))}
                            className="w-full rounded-md border border-stone-200 bg-stone-50/50 px-2 py-1 text-xs font-mono text-stone-800 focus:border-teal-500 focus:bg-white focus:outline-hidden transition-all"
                          />
                        </td>
                      );
                    }

                    if (activeTab === 'minmax') {
                      // Calculate heat tint
                      const opacity = Math.round(minMaxVal * 40);
                      return (
                        <td key={colIdx} className="p-2.5">
                          <div
                            className="flex items-center justify-between px-2 py-1 rounded font-mono font-medium text-xs"
                            style={{ backgroundColor: `rgba(16, 185, 129, ${minMaxVal * 0.18 + 0.04})` }}
                          >
                            <span className="text-emerald-950">{minMaxVal.toFixed(4)}</span>
                            <div
                              className="h-1.5 rounded-full bg-emerald-500"
                              style={{ width: `${Math.max(4, minMaxVal * 40)}px` }}
                            />
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={colIdx} className="p-2.5 font-mono text-stone-700">
                        <div className="bg-sky-50/60 px-2 py-1 rounded text-sky-950 font-medium">
                          {vectorVal.toFixed(4)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

            {/* 统计极值行 */}
            <tfoot>
              <tr className="border-t-2 border-stone-200 bg-stone-50/90 font-mono text-[11px] text-stone-600">
                <td className="p-2.5 font-semibold text-stone-800 sticky left-0 bg-stone-50">
                  极值统计 (Max / Min)
                </td>
                {criteria.map((c, colIdx) => (
                  <td key={colIdx} className="p-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-emerald-700">Max: {normalizedData.maxVals[colIdx]?.toFixed(2)}</span>
                      <span className="text-amber-700">Min: {normalizedData.minVals[colIdx]?.toFixed(2)}</span>
                    </div>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 提示与避坑切片标注 */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-stone-200/80 bg-stone-50 p-3 text-xs text-stone-600">
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-stone-800">矩阵代数提示：</span>
            在后续主客观赋权与 TOPSIS 计算中，已自动执行正负向指标统一趋优（极值规范化），并内置{' '}
            <code className="font-mono bg-stone-200 px-1 py-0.5 rounded text-stone-800">y_ij = z_ij + 1e-6</code>{' '}
            零值平移防护，杜绝信息熵对数计算 <code className="font-mono text-rose-700">ln(0)</code> 产生 NaN 异常。
          </div>
        </div>
      </SliceCard>
    </div>
  );
};
