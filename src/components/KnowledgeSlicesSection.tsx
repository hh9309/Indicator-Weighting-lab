import React from 'react';
import { SliceCard } from './SliceCard';
import { ShieldAlert, Compass, Network, HelpCircle, CheckCircle, AlertTriangle } from 'lucide-react';

export const KnowledgeSlicesSection: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* 模块10 主卡片 */}
      <SliceCard
        sliceNumber="10"
        title="权重计算与多属性决策知识导引体系"
        subtitle="4大学术级认知切片：方法匹配机理、高维空间投影、三大致命赋权陷阱与误区警示"
        formulaBadge="4 Theoretical Slices"
        badgeColor="teal"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 切片一 */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-stone-900 text-stone-100 flex items-center justify-center font-mono text-xs font-semibold">
                S1
              </span>
              <h4 className="text-sm font-semibold text-stone-900">
                【切片一：主客观 6 种代表性方法与案例匹配机理】
              </h4>
            </div>

            <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                <span className="font-semibold text-stone-800">主观 3 法 (AHP / G1 / Delphi-Fuzzy)：</span>
                核心契合具有深厚领域专家经验、指标层级多、或缺乏海量统计实测样本的场景。通过成对标度、序关系反向递推或三角模糊数 (l, m, u) 将定性认知结构化，避免“唯数据论”抹杀战略安全红线。
              </div>

              <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80">
                <span className="font-semibold text-stone-800">客观 3 法 (熵权 / CRITIC / 变异系数)：</span>
                纯粹依据多方案实测数据的离散度与相关性结构计算权重。完全排除人为情感偏好干扰，适用于宏观统计年鉴、多源传感器物联网时序监测等大数据量化评估。
              </div>

              <p className="text-[11px] text-teal-800 font-medium">
                ★ 案例一对一映射凸显了各方法的适用边界：定性战略选主观，海量实测选客观，综合攻坚选博弈组合！
              </p>
            </div>
          </div>

          {/* 切片二 */}
          <div className="p-5 rounded-xl border border-stone-200 bg-white shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-stone-900 text-stone-100 flex items-center justify-center font-mono text-xs font-semibold">
                S2
              </span>
              <h4 className="text-sm font-semibold text-stone-900">
                【切片二：适用条件与几何空间投影】
              </h4>
            </div>

            <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <p>
                多属性决策适用于多目标、不可公度（各指标单位量纲不同）、甚至相互冲突的复杂系统评价。
              </p>

              <div className="p-2.5 rounded-lg bg-teal-50/50 border border-teal-200 font-mono text-teal-950 text-[11px]">
                空间投影原理: 方案 X_i ∈ ℝⁿ 映射至加权正规化空间 V_i = W ⊙ Z_i，通过欧氏度量求取至正理想解 Z⁺ 和负理想解 Z⁻ 的法向距离，降维至标量相对贴近度 C_i ∈ [0, 1]。
              </div>

              <p className="text-stone-500">
                几何排序本质是将 n 维超立方体中的离散方案点向“理想点-负理想点”连线轴进行投影排序，各方案相对距离由欧氏几何度量确定。
              </p>
            </div>
          </div>

          {/* 切片三 */}
          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-rose-800 text-white flex items-center justify-center font-mono text-xs font-semibold">
                S3
              </span>
              <h4 className="text-sm font-semibold text-rose-950">
                【切片三：三大致命赋权陷阱】
              </h4>
            </div>

            <div className="space-y-2 text-xs text-rose-900 leading-relaxed">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-950">陷阱 1：未做正/负向同向化直接计算熵权</strong>
                  <p className="text-rose-800 text-[11px]">若成本型指标未做 (x_max - x)/(x_max - x_min) 转换，其离散度计算将完全倒置，导致惩罚项变成激励项。</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-950">陷阱 2：数据存在零值导致 ln(0) 崩溃</strong>
                  <p className="text-rose-800 text-[11px]">归一化后最劣方案取 0，计算信息熵 -k Σ p ln(p) 时 ln(0) 产生 NaN。必须进行极小扰动平移 (z_ij + 1e-6)。</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-950">陷阱 3：AHP 判断矩阵存在逻辑环路</strong>
                  <p className="text-rose-800 text-[11px]">出现传递性悖论（如 A &gt; B 且 B &gt; C 但 C &gt; A），致使 CR ≥ 0.1。此时特征向量无法作为有效权重。</p>
                </div>
              </div>
            </div>
          </div>

          {/* 切片四 */}
          <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-6 w-6 rounded-md bg-amber-800 text-white flex items-center justify-center font-mono text-xs font-semibold">
                S4
              </span>
              <h4 className="text-sm font-semibold text-amber-950">
                【切片四：误区警示与诊断陷阱】
              </h4>
            </div>

            <div className="space-y-2 text-xs text-amber-900 leading-relaxed">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-950">警惕“离散度高即重要”的客观法噪声陷阱</strong>
                  <p className="text-amber-800 text-[11px]">
                    若某次要辅助指标因测量误差、离群异常值波动巨大，单纯熵权法会赋予其畸高权重，导致“噪声绑架决策”。因此重大系统严禁单纯依赖单一客观法！
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-950">组合赋权系数必须经过正规化约束</strong>
                  <p className="text-amber-800 text-[11px]">
                    博弈论最小二乘求解的 raw 线性系数 (α, β) 往往不等于 1，必须执行严格的投影归一化 α* = |α| / (|α| + |β|) 约束，确保组合权重满足公理化归一条件。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SliceCard>
    </div>
  );
};
