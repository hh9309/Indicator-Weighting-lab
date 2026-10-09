import React from 'react';
import { SliceCard } from './SliceCard';
import { ArrowRight, CheckCircle2, GitCommit, Play, Compass, FileCheck } from 'lucide-react';

interface PipelineGuideProps {
  currentStage: number;
  onSelectStage: (stage: number) => void;
  onJumpToModule: (moduleId: string) => void;
}

export const PipelineGuide: React.FC<PipelineGuideProps> = ({
  currentStage,
  onSelectStage,
  onJumpToModule,
}) => {
  const stages = [
    {
      id: 1,
      title: '阶段一：矩阵构建与极值正规化',
      sub: '原始矩阵输入、正/负向指标同向化、零值防护',
      targetModule: 'matrix',
      icon: GitCommit,
    },
    {
      id: 2,
      title: '阶段二：6大主客观算法映射推导',
      sub: 'AHP/G1/Delphi主观法与熵权/CRITIC/CV客观法',
      targetModule: 'subjective',
      icon: Play,
    },
    {
      id: 3,
      title: '阶段三：博弈论合成与TOPSIS决策',
      sub: '离差极小化组合赋权、正负理想解空间投影',
      targetModule: 'gametheory',
      icon: Compass,
    },
    {
      id: 4,
      title: '阶段四：代码引擎与学术报告导出',
      sub: 'Python运行出图与表、Markdown/CSV报告导出',
      targetModule: 'export',
      icon: FileCheck,
    },
  ];

  return (
    <div className="space-y-4">
      <SliceCard
        sliceNumber="08"
        title="全流程导引管道 (Pipeline Workflow)"
        subtitle="矩阵输入 → 极值正规化 → 6法与6案例映射 → 博弈论合成 → TOPSIS排序 → 报告导出"
        formulaBadge="End-to-End MCDM Pipeline"
        badgeColor="teal"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const isCurrent = currentStage === stage.id;
            const isCompleted = currentStage > stage.id;

            return (
              <div
                key={stage.id}
                onClick={() => {
                  onSelectStage(stage.id);
                  onJumpToModule(stage.targetModule);
                }}
                className={`cursor-pointer p-3.5 rounded-xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isCurrent
                    ? 'border-teal-600 bg-teal-50/50 shadow-xs ring-1 ring-teal-500'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                    : 'border-stone-200 bg-stone-50/50 hover:bg-stone-100 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-5 w-5 rounded-md flex items-center justify-center font-mono text-xs font-semibold ${
                        isCurrent
                          ? 'bg-teal-700 text-white'
                          : isCompleted
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-200 text-stone-600'
                      }`}
                    >
                      {stage.id}
                    </span>
                    <span className="text-[11px] font-semibold text-stone-500">
                      STEP 0{stage.id}
                    </span>
                  </div>

                  {isCompleted && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-stone-900 leading-snug">
                    {stage.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                    {stage.sub}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px] font-medium text-teal-800">
                  <span>跳转至此环节</span>
                  <ArrowRight className="w-3 h-3 text-teal-600" />
                </div>
              </div>
            );
          })}
        </div>
      </SliceCard>
    </div>
  );
};
