import React from 'react';
import { CASE_STUDIES } from '../data/caseStudies';
import { Stethoscope, Compass, Sparkles, FolderKanban, BookOpen, Layers } from 'lucide-react';

interface NavbarProps {
  activeModule: string;
  onSelectModule: (moduleId: string) => void;
  currentCaseId: string;
  onSelectCaseId: (caseId: string) => void;
  onOpenAiClinic: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  onSelectModule,
  currentCaseId,
  onSelectCaseId,
  onOpenAiClinic,
}) => {
  const navItems = [
    { id: 'guide', label: '8. 全流程导引', short: '导引' },
    { id: 'matrix', label: '1. 矩阵代数与正规化', short: '矩阵代数' },
    { id: 'subjective', label: '2. 主观三法推导', short: '主观赋权' },
    { id: 'objective', label: '3. 客观三法推导', short: '客观赋权' },
    { id: 'gametheory', label: '4. 博弈组合与TOPSIS', short: '博弈&TOPSIS' },
    { id: 'cases', label: '5. 六大实战案例', short: '案例库' },
    { id: 'code', label: '6. 代码引擎', short: '代码引擎' },
    { id: 'export', label: '9. 数据报告', short: '数据报告' },
    { id: 'knowledge', label: '10. 知识导引', short: '知识导引' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-stone-50/90 backdrop-blur-md">
      {/* 顶部主信息栏 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* 左侧 Logo 与学术品牌 */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-teal-800 text-white flex items-center justify-center font-serif text-lg font-bold shadow-xs">
            Ω
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold text-stone-900 tracking-tight">
                指标权重计算与多属性决策实验室
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-teal-100 text-teal-800 border border-teal-200">
                MCDM Lab v3.8
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-mono hidden md:block">
              Matrix Algebra • Subjective/Objective Weighting • Game Theory Synthesis • TOPSIS
            </p>
          </div>
        </div>

        {/* 右侧：案例快速切换 & AI随诊启动按钮 */}
        <div className="flex items-center gap-2.5">
          {/* 案例快速下拉选择器 */}
          <div className="hidden sm:flex items-center gap-1.5 bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <FolderKanban className="w-3.5 h-3.5 text-stone-400" />
            <select
              value={currentCaseId}
              onChange={(e) => onSelectCaseId(e.target.value)}
              className="text-xs font-medium text-stone-700 bg-transparent outline-hidden pr-1 cursor-pointer max-w-[190px] truncate"
            >
              {CASE_STUDIES.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.title.split('：')[0]} - {cs.methodTag}
                </option>
              ))}
            </select>
          </div>

          {/* AI随诊按钮 */}
          <button
            onClick={onOpenAiClinic}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white shadow-2xs transition-all active:scale-98"
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>AI 随诊体检</span>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
          </button>
        </div>
      </div>

      {/* 底部 10大模块导航条 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto no-scrollbar border-t border-stone-200/50">
        <nav className="flex items-center gap-1 py-1.5 text-xs">
          {navItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectModule(item.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.short}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
