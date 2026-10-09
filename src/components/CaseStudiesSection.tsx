import React from 'react';
import { CASE_STUDIES } from '../data/caseStudies';
import { CaseStudy } from '../types/mcdm';
import { SliceCard } from './SliceCard';
import { Layers, ArrowRight, Check, BookOpen } from 'lucide-react';

interface CaseStudiesSectionProps {
  currentCaseId: string;
  onLoadCase: (cs: CaseStudy) => void;
}

export const CaseStudiesSection: React.FC<CaseStudiesSectionProps> = ({
  currentCaseId,
  onLoadCase,
}) => {
  return (
    <div className="space-y-6">
      <SliceCard
        sliceNumber="05"
        title="六大综合评价实战案例库"
        subtitle="覆盖重大装备制造、科研攻坚、防灾减灾、城市治理、工业物联网与战略运营6大标杆领域，一对一精准映射6大赋权理论"
        formulaBadge="6 Real-world MCDM Benchmarks"
        badgeColor="teal"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CASE_STUDIES.map((cs) => {
            const isLoaded = currentCaseId === cs.id;

            return (
              <div
                key={cs.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-200 ${
                  isLoaded
                    ? 'border-teal-500 bg-teal-50/20 shadow-xs ring-1 ring-teal-500'
                    : 'border-stone-200 bg-white hover:border-stone-300 hover:shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  {/* 类别与映射方法标签 */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                      {cs.category}
                    </span>
                    <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded border bg-stone-50 text-stone-800 border-stone-200">
                      映射: {cs.methodTag}
                    </span>
                  </div>

                  {/* 标题与描述 */}
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900 leading-snug mb-1">
                      {cs.title}
                    </h4>
                    <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                      {cs.description}
                    </p>
                  </div>

                  {/* 匹配机理说明 */}
                  <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 leading-normal">
                    <span className="font-semibold text-stone-800">方法匹配理由：</span>
                    {cs.methodJustification}
                  </div>

                  {/* 方案与指标概览 */}
                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1 border-t border-stone-100">
                    <span>{cs.alternatives.length} 个备选方案</span>
                    <span>{cs.criteria.length} 项评价指标</span>
                  </div>
                </div>

                {/* 载入按钮 */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <button
                    onClick={() => onLoadCase(cs)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isLoaded
                        ? 'bg-teal-700 text-white shadow-2xs'
                        : 'bg-stone-100 hover:bg-stone-200 text-stone-800'
                    }`}
                  >
                    {isLoaded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        当前实验室已载入此案例
                      </>
                    ) : (
                      <>
                        <span>一键装载至全流程实验室</span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SliceCard>
    </div>
  );
};
