import React, { useState, useMemo } from 'react';
import { Criterion, TopsisResult } from '../types/mcdm';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Radar as RadarIcon, SlidersHorizontal, Check, Eye, Sparkles } from 'lucide-react';

interface TopsisPerformanceChartProps {
  criteria: Criterion[];
  alternatives: string[];
  normalizedMatrix: number[][]; // [m alternatives][n criteria], 0 to 1
  weightedMatrix?: number[][];
  topsisResult: TopsisResult;
}

// Distinct, academic-grade colors for alternatives
const PALETTE = [
  '#0f766e', // Rank 1: Deep Teal
  '#d97706', // Rank 2: Amber
  '#2563eb', // Rank 3: Blue
  '#7c3aed', // Rank 4: Purple
  '#e11d48', // Rank 5: Rose
  '#059669', // Rank 6: Emerald
  '#475569', // Rank 7: Slate
];

export const TopsisPerformanceChart: React.FC<TopsisPerformanceChartProps> = ({
  criteria,
  alternatives,
  normalizedMatrix,
  weightedMatrix,
  topsisResult,
}) => {
  const [chartType, setChartType] = useState<'radar' | 'parallel'>('radar');
  const [dataScoreType, setDataScoreType] = useState<'norm' | 'weighted'>('norm');
  const [selectedAlts, setSelectedAlts] = useState<string[]>(alternatives);

  // Map alternative name to ranking color
  const altColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    topsisResult.rankings.forEach((r, idx) => {
      map[r.alternative] = PALETTE[idx % PALETTE.length];
    });
    return map;
  }, [topsisResult]);

  // Toggle alternative visibility
  const toggleAlt = (alt: string) => {
    if (selectedAlts.includes(alt)) {
      if (selectedAlts.length > 1) {
        setSelectedAlts(selectedAlts.filter((a) => a !== alt));
      }
    } else {
      setSelectedAlts([...selectedAlts, alt]);
    }
  };

  const selectAllAlts = () => setSelectedAlts(alternatives);
  const selectTopTwo = () => {
    const top2 = topsisResult.rankings.slice(0, 2).map((r) => r.alternative);
    setSelectedAlts(top2);
  };

  // 1. Radar Chart Data Preparation
  // Format: [{ criterion: 'C1', alt1: 85, alt2: 92, fullMark: 100 }, ...]
  const radarData = useMemo(() => {
    return criteria.map((c, j) => {
      const item: Record<string, any> = {
        criterion: `${c.name} (${c.type === 'benefit' ? '+' : '-'})`,
        shortName: `C${j + 1}: ${c.name}`,
        fullMark: 100,
      };

      alternatives.forEach((alt, i) => {
        const matrixToUse =
          dataScoreType === 'weighted' && weightedMatrix && weightedMatrix[i]
            ? weightedMatrix[i][j] * 100 * criteria.length // scaled for readability
            : (normalizedMatrix[i]?.[j] ?? 0) * 100;
        item[alt] = parseFloat(matrixToUse.toFixed(1));
      });

      return item;
    });
  }, [criteria, alternatives, normalizedMatrix, weightedMatrix, dataScoreType]);

  // 2. Parallel Coordinates Data Preparation
  // Format: [{ criterion: 'C1', alt1: 85, alt2: 92 }, ...]
  const parallelData = useMemo(() => {
    return criteria.map((c, j) => {
      const item: Record<string, any> = {
        criterion: `C${j + 1} ${c.name}`,
      };
      alternatives.forEach((alt, i) => {
        const val = (normalizedMatrix[i]?.[j] ?? 0) * 100;
        item[alt] = parseFloat(val.toFixed(1));
      });
      return item;
    });
  }, [criteria, alternatives, normalizedMatrix]);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4 shadow-2xs">
      {/* 头部控制栏 */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
              <RadarIcon className="w-4 h-4 text-teal-700" />
              基于 TOPSIS 规范化解空间的方案性能对比图
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200 font-semibold">
              Recharts Multi-Attribute Visualizer
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            直观展现各方案在所有指标上的均衡度与短板，数值经极值同向化处理（100分代表正向最优/负向极佳）
          </p>
        </div>

        {/* 视图切换按钮 */}
        <div className="flex items-center gap-2">
          {/* 数据类型选择 */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setDataScoreType('norm')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                dataScoreType === 'norm'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              标准化得分 (0-100)
            </button>
            <button
              onClick={() => setDataScoreType('weighted')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                dataScoreType === 'weighted'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              加权性能量级
            </button>
          </div>

          {/* 图表类型切换 */}
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setChartType('radar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                chartType === 'radar'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <RadarIcon className="w-3.5 h-3.5 text-teal-600" />
              雷达图
            </button>
            <button
              onClick={() => setChartType('parallel')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                chartType === 'parallel'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-sky-600" />
              平行坐标图
            </button>
          </div>
        </div>
      </div>

      {/* 方案显示/筛选选择器条 */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50/70 p-2.5 rounded-xl border border-stone-200 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-stone-500 font-medium">图例过滤:</span>
          {topsisResult.rankings.map((r) => {
            const isChecked = selectedAlts.includes(r.alternative);
            const color = altColorMap[r.alternative];
            return (
              <button
                key={r.alternative}
                onClick={() => toggleAlt(r.alternative)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all border ${
                  isChecked
                    ? 'bg-white shadow-2xs text-stone-900 border-stone-300'
                    : 'bg-stone-100/70 text-stone-400 border-transparent hover:bg-stone-100'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: isChecked ? color : '#cbd5e1' }}
                />
                <span className="truncate max-w-[120px]">{r.alternative}</span>
                <span className="font-mono text-[10px] text-stone-400">#{r.rank}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-medium text-stone-600">
          <button
            onClick={selectAllAlts}
            className="px-2 py-0.5 rounded hover:bg-stone-200 text-stone-700"
          >
            显示全集
          </button>
          <span>|</span>
          <button
            onClick={selectTopTwo}
            className="px-2 py-0.5 rounded hover:bg-stone-200 text-teal-800 font-semibold"
          >
            对标前两名
          </button>
        </div>
      </div>

      {/* 图表主显示区域 */}
      <div className="h-80 w-full pt-2">
        {chartType === 'radar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis
                dataKey="shortName"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: '#94a3b8', fontSize: 9 }}
                stroke="#cbd5e1"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.96)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              {topsisResult.rankings.map((r) => {
                const isSelected = selectedAlts.includes(r.alternative);
                if (!isSelected) return null;
                const color = altColorMap[r.alternative];
                const isWinner = r.rank === 1;

                return (
                  <Radar
                    key={r.alternative}
                    name={`${r.alternative} (Rank #${r.rank})`}
                    dataKey={r.alternative}
                    stroke={color}
                    fill={color}
                    fillOpacity={isWinner ? 0.35 : 0.15}
                    strokeWidth={isWinner ? 2.5 : 1.5}
                  />
                );
              })}
              <Legend
                wrapperStyle={{
                  paddingTop: '10px',
                  fontSize: '11px',
                  fontFamily: 'sans-serif',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={parallelData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="criterion"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#64748b', fontSize: 10 }}
                label={{
                  value: '性能得分 (0-100)',
                  angle: -90,
                  position: 'insideLeft',
                  fill: '#94a3b8',
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.96)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                }}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '8px',
                  fontSize: '11px',
                  fontFamily: 'sans-serif',
                }}
              />
              {topsisResult.rankings.map((r) => {
                const isSelected = selectedAlts.includes(r.alternative);
                if (!isSelected) return null;
                const color = altColorMap[r.alternative];
                const isWinner = r.rank === 1;

                return (
                  <Line
                    key={r.alternative}
                    type="monotone"
                    name={`${r.alternative} (Rank #${r.rank})`}
                    dataKey={r.alternative}
                    stroke={color}
                    strokeWidth={isWinner ? 2.5 : 1.5}
                    dot={{ r: isWinner ? 4 : 3, fill: color }}
                    activeDot={{ r: 6 }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 底部指标优势快速解析卡片 */}
      <div className="rounded-lg bg-stone-50 border border-stone-200/80 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-stone-700">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span className="font-semibold text-stone-900">雷达图拓扑结论：</span>
          <span>
            最优方案 <strong>{topsisResult.rankings[0]?.alternative}</strong> 在多边形覆盖面积与各顶点的均衡度最高，距理想解外包络面距离最近。
          </span>
        </div>
        <span className="font-mono text-[11px] text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
          贴近度 Ci = {((topsisResult.rankings[0]?.closeness ?? 0) * 100).toFixed(2)}%
        </span>
      </div>
    </div>
  );
};
