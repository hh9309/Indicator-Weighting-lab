/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CASE_STUDIES } from './data/caseStudies';
import { CaseStudy, Criterion } from './types/mcdm';
import {
  normalizeMatrix,
  computeAHP,
  computeG1,
  computeDelphiFuzzy,
  computeEntropy,
  computeCritic,
  computeCV,
  computeGameTheoryCombination,
  computeTOPSIS,
} from './utils/mcdmMath';
import { Navbar } from './components/Navbar';
import { PipelineGuide } from './components/PipelineGuide';
import { DecisionMatrixSection } from './components/DecisionMatrixSection';
import { SubjectiveWeightsSection } from './components/SubjectiveWeightsSection';
import { ObjectiveWeightsSection } from './components/ObjectiveWeightsSection';
import { GameTheoryTopsisSection } from './components/GameTheoryTopsisSection';
import { CaseStudiesSection } from './components/CaseStudiesSection';
import { PythonEngineSection } from './components/PythonEngineSection';
import { ExportReportSection } from './components/ExportReportSection';
import { KnowledgeSlicesSection } from './components/KnowledgeSlicesSection';
import { AiClinicModal } from './components/AiClinicModal';
import { Stethoscope, Sparkles } from 'lucide-react';

export default function App() {
  const initialCase = CASE_STUDIES[0];

  // Core application state
  const [currentCase, setCurrentCase] = useState<CaseStudy>(initialCase);
  const [activeModule, setActiveModule] = useState<string>('guide');
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [isAiClinicOpen, setIsAiClinicOpen] = useState<boolean>(false);

  // Active matrix & criteria state
  const [matrix, setMatrix] = useState<number[][]>(initialCase.matrix);
  const [criteria, setCriteria] = useState<Criterion[]>(initialCase.criteria);
  const [alternatives, setAlternatives] = useState<string[]>(initialCase.alternatives);

  // Method specific inputs
  const [ahpMatrix, setAhpMatrix] = useState<number[][]>(
    initialCase.ahpPairwise || Array(initialCase.criteria.length).fill(0).map(() => Array(initialCase.criteria.length).fill(1))
  );
  const [g1Ratios, setG1Ratios] = useState<number[]>(
    initialCase.g1Ratios || Array(initialCase.criteria.length - 1).fill(1.2)
  );
  const [fuzzyScores, setFuzzyScores] = useState<[number, number, number][][]>(
    initialCase.fuzzyScores || [
      Array(initialCase.criteria.length).fill([6, 7, 8]),
      Array(initialCase.criteria.length).fill([5, 6.5, 8]),
      Array(initialCase.criteria.length).fill([6.5, 7.5, 8.5]),
    ]
  );

  // Synthesis methods selected
  const [selectedSubMethod, setSelectedSubMethod] = useState<'ahp' | 'g1' | 'delphi'>('ahp');
  const [selectedObjMethod, setSelectedObjMethod] = useState<'entropy' | 'critic' | 'cv'>('entropy');
  const [customAlpha, setCustomAlpha] = useState<number>(0.5);

  // 1. Normalization
  const normalizedData = useMemo(() => {
    return normalizeMatrix(matrix, criteria);
  }, [matrix, criteria]);

  // 2. Subjective Methods
  const ahpResult = useMemo(() => {
    return computeAHP(ahpMatrix);
  }, [ahpMatrix]);

  const g1Result = useMemo(() => {
    return computeG1(criteria.map(c => c.name), g1Ratios);
  }, [criteria, g1Ratios]);

  const delphiResult = useMemo(() => {
    return computeDelphiFuzzy(fuzzyScores);
  }, [fuzzyScores]);

  // 3. Objective Methods
  const entropyResult = useMemo(() => {
    return computeEntropy(normalizedData.minMaxMatrix);
  }, [normalizedData.minMaxMatrix]);

  const criticResult = useMemo(() => {
    return computeCritic(normalizedData.minMaxMatrix);
  }, [normalizedData.minMaxMatrix]);

  const cvResult = useMemo(() => {
    return computeCV(matrix);
  }, [matrix]);

  // Selected subjective & objective weights
  const subWeights = useMemo(() => {
    if (selectedSubMethod === 'ahp') return ahpResult.weights;
    if (selectedSubMethod === 'g1') return g1Result.weights;
    return delphiResult.weights;
  }, [selectedSubMethod, ahpResult, g1Result, delphiResult]);

  const objWeights = useMemo(() => {
    if (selectedObjMethod === 'entropy') return entropyResult.weights;
    if (selectedObjMethod === 'critic') return criticResult.weights;
    return cvResult.weights;
  }, [selectedObjMethod, entropyResult, criticResult, cvResult]);

  // 4. Game Theory Synthesis
  const gameResult = useMemo(() => {
    const rawGame = computeGameTheoryCombination(subWeights, objWeights);
    // Apply custom alpha blend
    const blendedWeights = criteria.map((_, i) => {
      const sw = subWeights[i] || 0;
      const ow = objWeights[i] || 0;
      return customAlpha * sw + (1 - customAlpha) * ow;
    });
    const totalB = blendedWeights.reduce((a, b) => a + b, 0) || 1;
    const finalBlended = blendedWeights.map(w => w / totalB);

    return {
      ...rawGame,
      alphaStar: customAlpha,
      betaStar: 1 - customAlpha,
      combinedWeights: finalBlended,
    };
  }, [subWeights, objWeights, criteria, customAlpha]);

  // 5. TOPSIS Ranking
  const topsisResult = useMemo(() => {
    return computeTOPSIS(normalizedData.minMaxMatrix, gameResult.combinedWeights, alternatives);
  }, [normalizedData.minMaxMatrix, gameResult.combinedWeights, alternatives]);

  // Load a new Case Study
  const handleLoadCase = (cs: CaseStudy) => {
    setCurrentCase(cs);
    setMatrix(cs.matrix);
    setCriteria(cs.criteria);
    setAlternatives(cs.alternatives);

    if (cs.ahpPairwise) {
      setAhpMatrix(cs.ahpPairwise);
    } else {
      setAhpMatrix(Array(cs.criteria.length).fill(0).map(() => Array(cs.criteria.length).fill(1)));
    }

    if (cs.g1Ratios) {
      setG1Ratios(cs.g1Ratios);
    } else {
      setG1Ratios(Array(cs.criteria.length - 1).fill(1.2));
    }

    if (cs.fuzzyScores) {
      setFuzzyScores(cs.fuzzyScores);
    }

    // Automatically set matching method
    if (cs.methodTag === 'AHP') setSelectedSubMethod('ahp');
    if (cs.methodTag === 'G1') setSelectedSubMethod('g1');
    if (cs.methodTag === 'Delphi') setSelectedSubMethod('delphi');
    if (cs.methodTag === 'Entropy') setSelectedObjMethod('entropy');
    if (cs.methodTag === 'CRITIC') setSelectedObjMethod('critic');
    if (cs.methodTag === 'CV') setSelectedObjMethod('cv');
  };

  const handleResetBenchmark = () => {
    handleLoadCase(currentCase);
  };

  const handleApplyGameTheoryAlpha = () => {
    const rawGame = computeGameTheoryCombination(subWeights, objWeights);
    setCustomAlpha(rawGame.alphaStar);
  };

  const weightsMap = {
    ahp: ahpResult.weights,
    g1: g1Result.weights,
    delphi: delphiResult.weights,
    entropy: entropyResult.weights,
    critic: criticResult.weights,
    cv: cvResult.weights,
    combined: gameResult.combinedWeights,
  };

  return (
    <div className="min-h-screen bg-stone-50/60 font-sans text-stone-800 flex flex-col antialiased selection:bg-teal-100 selection:text-teal-900">
      {/* 顶部学术实验室导航栏 */}
      <Navbar
        activeModule={activeModule}
        onSelectModule={setActiveModule}
        currentCaseId={currentCase.id}
        onSelectCaseId={(id) => {
          const found = CASE_STUDIES.find(c => c.id === id);
          if (found) handleLoadCase(found);
        }}
        onOpenAiClinic={() => setIsAiClinicOpen(true)}
      />

      {/* 主工作区 */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* 当前决策背景学术卡片 */}
        <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
                当前运行场景
              </span>
              <span className="text-xs text-stone-400 font-mono">[{currentCase.category}]</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              {currentCase.title}
            </h2>
            <p className="text-xs text-stone-600 max-w-3xl leading-relaxed">
              {currentCase.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-right">
              <div className="text-[11px] text-stone-500">方案数 × 指标数</div>
              <div className="font-mono text-sm font-bold text-stone-900">
                {alternatives.length} Alternatives × {criteria.length} Criteria
              </div>
            </div>
          </div>
        </div>

        {/* 模块8：全流程导引 */}
        <PipelineGuide
          currentStage={currentStage}
          onSelectStage={setCurrentStage}
          onJumpToModule={setActiveModule}
        />

        {/* 根据激活模块呈现 */}
        {activeModule === 'matrix' && (
          <DecisionMatrixSection
            matrix={matrix}
            criteria={criteria}
            alternatives={alternatives}
            normalizedData={normalizedData}
            onUpdateMatrix={setMatrix}
            onUpdateCriteria={setCriteria}
            onUpdateAlternatives={setAlternatives}
            onResetBenchmark={handleResetBenchmark}
          />
        )}

        {activeModule === 'subjective' && (
          <SubjectiveWeightsSection
            criteria={criteria}
            ahpMatrix={ahpMatrix}
            ahpResult={ahpResult}
            g1Ratios={g1Ratios}
            g1Result={g1Result}
            fuzzyScores={fuzzyScores}
            delphiResult={delphiResult}
            onUpdateAhpMatrix={setAhpMatrix}
            onUpdateG1Ratios={setG1Ratios}
            onUpdateFuzzyScores={setFuzzyScores}
          />
        )}

        {activeModule === 'objective' && (
          <ObjectiveWeightsSection
            criteria={criteria}
            entropyResult={entropyResult}
            criticResult={criticResult}
            cvResult={cvResult}
          />
        )}

        {activeModule === 'gametheory' && (
          <GameTheoryTopsisSection
            criteria={criteria}
            alternatives={alternatives}
            gameResult={gameResult}
            topsisResult={topsisResult}
            selectedSubMethodName={selectedSubMethod}
            selectedObjMethodName={selectedObjMethod}
            onSelectSubMethod={setSelectedSubMethod}
            onSelectObjMethod={setSelectedObjMethod}
            customAlpha={customAlpha}
            onUpdateCustomAlpha={setCustomAlpha}
            onApplyGameTheoryAlpha={handleApplyGameTheoryAlpha}
          />
        )}

        {activeModule === 'cases' && (
          <CaseStudiesSection
            currentCaseId={currentCase.id}
            onLoadCase={handleLoadCase}
          />
        )}

        {activeModule === 'code' && (
          <PythonEngineSection
            matrix={matrix}
            criteria={criteria}
            alternatives={alternatives}
            ahpPairwise={ahpMatrix}
            g1Ratios={g1Ratios}
            ahpResult={ahpResult}
            g1Result={g1Result}
            delphiResult={delphiResult}
            entropyResult={entropyResult}
            criticResult={criticResult}
            cvResult={cvResult}
            gameResult={gameResult}
            topsisResult={topsisResult}
          />
        )}

        {activeModule === 'export' && (
          <ExportReportSection
            scenarioTitle={currentCase.title}
            matrix={matrix}
            criteria={criteria}
            alternatives={alternatives}
            normalizedData={normalizedData}
            weightsMap={weightsMap}
            gameResult={gameResult}
            topsisResult={topsisResult}
          />
        )}

        {activeModule === 'knowledge' && (
          <KnowledgeSlicesSection />
        )}

        {/* 默认或者在导引视图下展示核心视图 (全景实验室) */}
        {activeModule === 'guide' && (
          <div className="space-y-8">
            <DecisionMatrixSection
              matrix={matrix}
              criteria={criteria}
              alternatives={alternatives}
              normalizedData={normalizedData}
              onUpdateMatrix={setMatrix}
              onUpdateCriteria={setCriteria}
              onUpdateAlternatives={setAlternatives}
              onResetBenchmark={handleResetBenchmark}
            />

            <SubjectiveWeightsSection
              criteria={criteria}
              ahpMatrix={ahpMatrix}
              ahpResult={ahpResult}
              g1Ratios={g1Ratios}
              g1Result={g1Result}
              fuzzyScores={fuzzyScores}
              delphiResult={delphiResult}
              onUpdateAhpMatrix={setAhpMatrix}
              onUpdateG1Ratios={setG1Ratios}
              onUpdateFuzzyScores={setFuzzyScores}
            />

            <ObjectiveWeightsSection
              criteria={criteria}
              entropyResult={entropyResult}
              criticResult={criticResult}
              cvResult={cvResult}
            />

            <GameTheoryTopsisSection
              criteria={criteria}
              alternatives={alternatives}
              gameResult={gameResult}
              topsisResult={topsisResult}
              selectedSubMethodName={selectedSubMethod}
              selectedObjMethodName={selectedObjMethod}
              onSelectSubMethod={setSelectedSubMethod}
              onSelectObjMethod={setSelectedObjMethod}
              customAlpha={customAlpha}
              onUpdateCustomAlpha={setCustomAlpha}
              onApplyGameTheoryAlpha={handleApplyGameTheoryAlpha}
            />

            <CaseStudiesSection
              currentCaseId={currentCase.id}
              onLoadCase={handleLoadCase}
            />

            <PythonEngineSection
              matrix={matrix}
              criteria={criteria}
              alternatives={alternatives}
              ahpPairwise={ahpMatrix}
              g1Ratios={g1Ratios}
              ahpResult={ahpResult}
              g1Result={g1Result}
              delphiResult={delphiResult}
              entropyResult={entropyResult}
              criticResult={criticResult}
              cvResult={cvResult}
              gameResult={gameResult}
              topsisResult={topsisResult}
            />

            <ExportReportSection
              scenarioTitle={currentCase.title}
              matrix={matrix}
              criteria={criteria}
              alternatives={alternatives}
              normalizedData={normalizedData}
              weightsMap={weightsMap}
              gameResult={gameResult}
              topsisResult={topsisResult}
            />

            <KnowledgeSlicesSection />
          </div>
        )}
      </main>

      {/* 悬浮 AI 随诊体检浮动按钮 */}
      <button
        onClick={() => setIsAiClinicOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full bg-teal-800 text-white shadow-xl hover:bg-teal-900 transition-all hover:scale-105 active:scale-95 group"
      >
        <div className="relative">
          <Stethoscope className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
          </span>
        </div>
        <span className="text-xs font-semibold pr-1">AI 随诊体检</span>
      </button>

      {/* AI 诊断与随诊对话弹窗 */}
      <AiClinicModal
        isOpen={isAiClinicOpen}
        onClose={() => setIsAiClinicOpen(false)}
        matrix={matrix}
        criteria={criteria}
        alternatives={alternatives}
        ahpMatrix={ahpMatrix}
        weights={weightsMap}
        scenarioTitle={currentCase.title}
      />

      {/* 页脚 */}
      <footer className="mt-16 border-t border-stone-200/80 bg-white py-8 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-2 font-medium text-stone-700">
            <span>指标权重计算与多属性决策实验室 (Index Weighting & MCDM Lab)</span>
            <span>•</span>
            <span>运筹学与统计决策学术仿真引擎</span>
          </div>
          <p className="text-[11px] text-stone-400">
            集成 AHP、G1、Delphi-Fuzzy、熵权法、CRITIC、变异系数法、博弈论组合赋权与 TOPSIS 决策空间投影
          </p>
        </div>
      </footer>
    </div>
  );
}
