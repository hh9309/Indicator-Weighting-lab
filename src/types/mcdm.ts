export type CriterionType = 'benefit' | 'cost';

export interface Criterion {
  id: string;
  name: string;
  type: CriterionType;
  unit?: string;
  description?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  mappedMethod: string;
  methodTag: 'AHP' | 'G1' | 'Delphi' | 'Entropy' | 'CRITIC' | 'CV';
  category: string;
  description: string;
  criteria: Criterion[];
  alternatives: string[];
  matrix: number[][]; // [m alternatives][n criteria]
  ahpPairwise?: number[][]; // For AHP
  g1Ratios?: number[]; // For G1: r_2, r_3, ... r_n
  fuzzyScores?: [number, number, number][][]; // [expert/alt][criterion]: (l, m, u)
  methodJustification: string;
}

export interface NormalizedData {
  minMaxMatrix: number[][]; // 0 to 1
  vectorNormMatrix: number[][];
  minVals: number[];
  maxVals: number[];
}

export interface AHPResult {
  weights: number[];
  lambdaMax: number;
  CI: number;
  CR: number;
  isConsistent: boolean;
  geometricMeanWeights: number[];
  sumProductWeights: number[];
}

export interface G1Result {
  weights: number[];
  sortedCriteria: string[];
  ratios: number[];
  formulaSteps: string[];
}

export interface DelphiFuzzyResult {
  weights: number[];
  aggregatedTFN: [number, number, number][]; // (l, m, u) for each criterion
  defuzzifiedValues: number[];
}

export interface EntropyResult {
  proportions: number[][]; // p_ij
  entropies: number[]; // e_j
  divergences: number[]; // d_j = 1 - e_j
  weights: number[];
}

export interface CriticResult {
  stdDevs: number[]; // sigma_j
  correlationMatrix: number[][]; // r_jk
  conflicts: number[]; // sum(1 - r_jk)
  informationQuantities: number[]; // C_j
  weights: number[];
}

export interface CVResult {
  means: number[];
  stdDevs: number[];
  cvValues: number[];
  weights: number[];
}

export interface GameTheoryResult {
  subWeights: number[];
  objWeights: number[];
  alpha: number; // raw
  beta: number;  // raw
  alphaStar: number; // normalized
  betaStar: number;  // normalized
  combinedWeights: number[];
}

export interface TopsisResult {
  weightedMatrix: number[][];
  idealPositive: number[];
  idealNegative: number[];
  distPositive: number[]; // D_i^+
  distNegative: number[]; // D_i^-
  relativeCloseness: number[]; // C_i
  rankings: {
    alternative: string;
    index: number;
    closeness: number;
    rank: number;
    dPlus: number;
    dMinus: number;
  }[];
}

export interface SensitivityPoint {
  weightFactor: number; // 0 to 1
  scores: { [altName: string]: number };
}

export interface DiagnosticIssue {
  type: 'danger' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  suggestion: string;
}
