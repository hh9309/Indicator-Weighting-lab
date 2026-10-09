import {
  Criterion,
  NormalizedData,
  AHPResult,
  G1Result,
  DelphiFuzzyResult,
  EntropyResult,
  CriticResult,
  CVResult,
  GameTheoryResult,
  TopsisResult,
  SensitivityPoint,
} from '../types/mcdm';

// RI Table for AHP (up to 15 dimensions)
const RI_TABLE = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49, 1.51, 1.54, 1.56, 1.57, 1.59];

/**
 * Normalization: Min-Max and Vector Normalization
 */
export function normalizeMatrix(
  matrix: number[][],
  criteria: Criterion[]
): NormalizedData {
  const m = matrix.length;
  if (m === 0) return { minMaxMatrix: [], vectorNormMatrix: [], minVals: [], maxVals: [] };
  const n = matrix[0].length;

  const minVals: number[] = [];
  const maxVals: number[] = [];
  const colSumSquares: number[] = [];

  for (let j = 0; j < n; j++) {
    const col = matrix.map(row => row[j]);
    const minVal = Math.min(...col);
    const maxVal = Math.max(...col);
    minVals.push(minVal);
    maxVals.push(maxVal);

    const sumSq = col.reduce((sum, val) => sum + val * val, 0);
    colSumSquares.push(Math.sqrt(sumSq) || 1);
  }

  const minMaxMatrix: number[][] = [];
  const vectorNormMatrix: number[][] = [];

  for (let i = 0; i < m; i++) {
    const minMaxRow: number[] = [];
    const vectorRow: number[] = [];

    for (let j = 0; j < n; j++) {
      const x = matrix[i][j];
      const min = minVals[j];
      const max = maxVals[j];
      const range = max - min || 1;
      const type = criteria[j]?.type || 'benefit';

      // Min-Max
      let z: number;
      if (type === 'benefit') {
        z = (x - min) / range;
      } else {
        z = (max - x) / range;
      }
      minMaxRow.push(Math.max(0, Math.min(1, z)));

      // Vector normalization
      const r = x / colSumSquares[j];
      vectorRow.push(r);
    }
    minMaxMatrix.push(minMaxRow);
    vectorNormMatrix.push(vectorRow);
  }

  return { minMaxMatrix, vectorNormMatrix, minVals, maxVals };
}

/**
 * 1. AHP (Analytic Hierarchy Process)
 */
export function computeAHP(ahpMatrix: number[][]): AHPResult {
  const n = ahpMatrix.length;
  if (n <= 1) {
    return {
      weights: [1],
      lambdaMax: 1,
      CI: 0,
      CR: 0,
      isConsistent: true,
      geometricMeanWeights: [1],
      sumProductWeights: [1],
    };
  }

  // 1. Sum-Product Method
  const colSums = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      colSums[j] += ahpMatrix[i][j];
    }
  }

  const sumProductWeights = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let rowNormSum = 0;
    for (let j = 0; j < n; j++) {
      rowNormSum += ahpMatrix[i][j] / (colSums[j] || 1);
    }
    sumProductWeights[i] = rowNormSum / n;
  }

  // 2. Geometric Mean (Root) Method
  const geomRoots = Array(n).fill(0);
  let totalGeom = 0;
  for (let i = 0; i < n; i++) {
    let prod = 1;
    for (let j = 0; j < n; j++) {
      prod *= ahpMatrix[i][j];
    }
    const root = Math.pow(prod, 1 / n);
    geomRoots[i] = root;
    totalGeom += root;
  }
  const geometricMeanWeights = geomRoots.map(r => r / (totalGeom || 1));

  // Primary weights used: geometric mean / eigenvalue approx
  const weights = geometricMeanWeights;

  // Aw vector
  const Aw = Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      Aw[i] += ahpMatrix[i][j] * weights[j];
    }
  }

  // Lambda max
  let sumRatio = 0;
  for (let i = 0; i < n; i++) {
    sumRatio += Aw[i] / (weights[i] || 1e-6);
  }
  const lambdaMax = sumRatio / n;

  const CI = (lambdaMax - n) / (n - 1);
  const RI = RI_TABLE[n - 1] || 1.49;
  const CR = n === 2 ? 0 : CI / (RI || 1);

  return {
    weights,
    lambdaMax,
    CI,
    CR,
    isConsistent: CR < 0.1,
    geometricMeanWeights,
    sumProductWeights,
  };
}

/**
 * 2. G1 Order Relation Analysis (序关系分析法)
 * Given order x_1* > x_2* > ... > x_n* and adjacent ratios r_k = w_{k-1} / w_k
 */
export function computeG1(criteriaNames: string[], ratios: number[]): G1Result {
  const n = criteriaNames.length;
  if (n <= 1) {
    return {
      weights: [1],
      sortedCriteria: criteriaNames,
      ratios: [],
      formulaSteps: ['单指标系统，权重为 1.0000'],
    };
  }

  // Compute products prod_i = prod_{j=k}^n r_j
  // For k = 2 to n:
  // w_n = ( 1 + sum_{k=2}^n prod_{j=k}^n r_j ) ^ (-1)
  const prodTerms: number[] = [];
  const formulaSteps: string[] = [];

  for (let k = 2; k <= n; k++) {
    let p = 1;
    for (let j = k; j <= n; j++) {
      // index in ratios array: ratio r_j is at j - 2
      p *= ratios[j - 2] ?? 1.2;
    }
    prodTerms.push(p);
  }

  const denominator = 1 + prodTerms.reduce((sum, val) => sum + val, 0);
  const wn = 1 / denominator;

  // Compute backward
  const weights = Array(n).fill(0);
  weights[n - 1] = wn;
  formulaSteps.push(`基础递推项: w_${n} = 1 / (1 + ΣΠ r_i) = ${wn.toFixed(4)}`);

  for (let k = n - 1; k >= 1; k--) {
    const rk = ratios[k - 1] ?? 1.2;
    weights[k - 1] = rk * weights[k];
    formulaSteps.push(`递推: w_${k} = r_${k + 1} × w_${k + 1} = ${rk.toFixed(2)} × ${weights[k].toFixed(4)} = ${weights[k - 1].toFixed(4)}`);
  }

  // Normalization safety check
  const totalW = weights.reduce((a, b) => a + b, 0);
  const normalizedWeights = weights.map(w => w / (totalW || 1));

  return {
    weights: normalizedWeights,
    sortedCriteria: criteriaNames,
    ratios,
    formulaSteps,
  };
}

/**
 * 3. Delphi - Fuzzy (德尔菲-三角模糊数法)
 * Scores for each criterion as Triangular Fuzzy Numbers (l, m, u)
 */
export function computeDelphiFuzzy(scores: [number, number, number][][]): DelphiFuzzyResult {
  // scores shape: [numExperts][numCriteria]
  const numExperts = scores.length;
  if (numExperts === 0) return { weights: [], aggregatedTFN: [], defuzzifiedValues: [] };
  const numCriteria = scores[0].length;

  const aggregatedTFN: [number, number, number][] = [];
  const defuzzifiedValues: number[] = [];

  for (let j = 0; j < numCriteria; j++) {
    let sumL = 0;
    let sumM = 0;
    let sumU = 0;

    for (let k = 0; k < numExperts; k++) {
      const [l, m, u] = scores[k][j];
      sumL += l;
      sumM += m;
      sumU += u;
    }

    const meanL = sumL / numExperts;
    const meanM = sumM / numExperts;
    const meanU = sumU / numExperts;
    aggregatedTFN.push([meanL, meanM, meanU]);

    // Centroid Defuzzification DF = (l + 2m + u) / 4
    const df = (meanL + 2 * meanM + meanU) / 4;
    defuzzifiedValues.push(df);
  }

  const totalDF = defuzzifiedValues.reduce((a, b) => a + b, 0) || 1;
  const weights = defuzzifiedValues.map(v => v / totalDF);

  return { weights, aggregatedTFN, defuzzifiedValues };
}

/**
 * 4. Entropy Weight Method (熵权法)
 */
export function computeEntropy(normMatrix: number[][]): EntropyResult {
  const m = normMatrix.length;
  if (m === 0) return { proportions: [], entropies: [], divergences: [], weights: [] };
  const n = normMatrix[0].length;

  const eps = 1e-6; // Logarithmic singularity protection
  const colSums = Array(n).fill(0);

  // Add eps and sum
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < m; i++) {
      colSums[j] += normMatrix[i][j] + eps;
    }
  }

  const proportions: number[][] = [];
  for (let i = 0; i < m; i++) {
    const rowP: number[] = [];
    for (let j = 0; j < n; j++) {
      rowP.push((normMatrix[i][j] + eps) / colSums[j]);
    }
    proportions.push(rowP);
  }

  const k = 1 / Math.log(m || 2);
  const entropies: number[] = [];
  const divergences: number[] = [];

  for (let j = 0; j < n; j++) {
    let e = 0;
    for (let i = 0; i < m; i++) {
      const p = proportions[i][j];
      if (p > 0) {
        e += p * Math.log(p);
      }
    }
    const entropyVal = Math.min(1, Math.max(0, -k * e));
    entropies.push(entropyVal);
    divergences.push(1 - entropyVal);
  }

  const totalDivergence = divergences.reduce((a, b) => a + b, 0) || 1;
  const weights = divergences.map(d => d / totalDivergence);

  return { proportions, entropies, divergences, weights };
}

/**
 * 5. CRITIC Method (Criteria Importance Through Intercriteria Correlation)
 */
export function computeCritic(normMatrix: number[][]): CriticResult {
  const m = normMatrix.length;
  if (m === 0) return { stdDevs: [], correlationMatrix: [], conflicts: [], informationQuantities: [], weights: [] };
  const n = normMatrix[0].length;

  // Means & Standard Deviations
  const means: number[] = [];
  const stdDevs: number[] = [];

  for (let j = 0; j < n; j++) {
    const col = normMatrix.map(row => row[j]);
    const mean = col.reduce((a, b) => a + b, 0) / m;
    means.push(mean);

    const variance = col.reduce((sum, val) => sum + (val - mean) ** 2, 0) / m;
    stdDevs.push(Math.sqrt(variance));
  }

  // Pearson correlation matrix
  const correlationMatrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

  for (let j1 = 0; j1 < n; j1++) {
    for (let j2 = 0; j2 < n; j2++) {
      if (j1 === j2) {
        correlationMatrix[j1][j2] = 1.0;
        continue;
      }
      let cov = 0;
      for (let i = 0; i < m; i++) {
        cov += (normMatrix[i][j1] - means[j1]) * (normMatrix[i][j2] - means[j2]);
      }
      cov = cov / m;
      const denom = (stdDevs[j1] * stdDevs[j2]) || 1e-6;
      correlationMatrix[j1][j2] = Math.max(-1, Math.min(1, cov / denom));
    }
  }

  // Conflicts: sum(1 - r_jk)
  const conflicts: number[] = [];
  const informationQuantities: number[] = [];

  for (let j = 0; j < n; j++) {
    let conf = 0;
    for (let k = 0; k < n; k++) {
      conf += (1 - correlationMatrix[j][k]);
    }
    conflicts.push(conf);
    const Cj = stdDevs[j] * conf;
    informationQuantities.push(Cj);
  }

  const totalC = informationQuantities.reduce((a, b) => a + b, 0) || 1;
  const weights = informationQuantities.map(c => c / totalC);

  return { stdDevs, correlationMatrix, conflicts, informationQuantities, weights };
}

/**
 * 6. Coefficient of Variation (CV - 变异系数法)
 */
export function computeCV(matrix: number[][]): CVResult {
  const m = matrix.length;
  if (m === 0) return { means: [], stdDevs: [], cvValues: [], weights: [] };
  const n = matrix[0].length;

  const means: number[] = [];
  const stdDevs: number[] = [];
  const cvValues: number[] = [];

  for (let j = 0; j < n; j++) {
    const col = matrix.map(row => row[j]);
    const mean = col.reduce((a, b) => a + b, 0) / m;
    means.push(mean);

    const variance = col.reduce((sum, val) => sum + (val - mean) ** 2, 0) / m;
    const std = Math.sqrt(variance);
    stdDevs.push(std);

    // CV = std / mean
    const cv = mean !== 0 ? std / Math.abs(mean) : 0;
    cvValues.push(cv);
  }

  const totalCV = cvValues.reduce((a, b) => a + b, 0) || 1;
  const weights = cvValues.map(v => v / totalCV);

  return { means, stdDevs, cvValues, weights };
}

/**
 * 4. Game Theory Combination Weighting (博弈论组合赋权)
 * Solve linear system:
 * [ (W1 · W1)  (W1 · W2) ] [ a1 ] = [ W1 · W1 ]
 * [ (W2 · W1)  (W2 · W2) ] [ a2 ]   [ W2 · W2 ]
 * Then normalize: alpha* = a1 / (a1 + a2), beta* = a2 / (a1 + a2)
 */
export function computeGameTheoryCombination(
  subWeights: number[],
  objWeights: number[]
): GameTheoryResult {
  const n = subWeights.length;
  if (n === 0) {
    return {
      subWeights: [],
      objWeights: [],
      alpha: 0.5,
      beta: 0.5,
      alphaStar: 0.5,
      betaStar: 0.5,
      combinedWeights: [],
    };
  }

  let w11 = 0;
  let w12 = 0;
  let w22 = 0;

  for (let i = 0; i < n; i++) {
    w11 += subWeights[i] * subWeights[i];
    w12 += subWeights[i] * objWeights[i];
    w22 += objWeights[i] * objWeights[i];
  }

  // 2x2 determinant
  const det = w11 * w22 - w12 * w12;
  let a1 = 0.5;
  let a2 = 0.5;

  if (Math.abs(det) > 1e-9) {
    // Cramer's rule:
    // [w11, w12] [a1] = [w11]
    // [w12, w22] [a2]   [w22]
    // a1 = (w11 * w22 - w12 * w22) / det
    // a2 = (w11 * w22 - w11 * w12) / det
    a1 = (w11 * w22 - w12 * w22) / det;
    a2 = (w11 * w22 - w11 * w12) / det;
  }

  // Normalization constraint: alphaStar + betaStar = 1
  const sumA = Math.abs(a1) + Math.abs(a2) || 1;
  const alphaStar = Math.max(0.05, Math.min(0.95, Math.abs(a1) / sumA));
  const betaStar = 1 - alphaStar;

  const combinedWeights: number[] = [];
  for (let i = 0; i < n; i++) {
    combinedWeights.push(alphaStar * subWeights[i] + betaStar * objWeights[i]);
  }

  // Ensure normalized
  const totalCombined = combinedWeights.reduce((a, b) => a + b, 0) || 1;
  const finalWeights = combinedWeights.map(w => w / totalCombined);

  return {
    subWeights,
    objWeights,
    alpha: a1,
    beta: a2,
    alphaStar,
    betaStar,
    combinedWeights: finalWeights,
  };
}

/**
 * TOPSIS: Technique for Order Preference by Similarity to Ideal Solution
 */
export function computeTOPSIS(
  normMatrix: number[][],
  weights: number[],
  alternatives: string[]
): TopsisResult {
  const m = normMatrix.length;
  if (m === 0) {
    return {
      weightedMatrix: [],
      idealPositive: [],
      idealNegative: [],
      distPositive: [],
      distNegative: [],
      relativeCloseness: [],
      rankings: [],
    };
  }
  const n = normMatrix[0].length;

  // 1. Weighted normalized matrix: v_ij = w_j * z_ij
  const weightedMatrix: number[][] = [];
  for (let i = 0; i < m; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      row.push(normMatrix[i][j] * (weights[j] || 0));
    }
    weightedMatrix.push(row);
  }

  // 2. Positive & Negative Ideal Solutions
  const idealPositive: number[] = [];
  const idealNegative: number[] = [];

  for (let j = 0; j < n; j++) {
    const colVals = weightedMatrix.map(row => row[j]);
    idealPositive.push(Math.max(...colVals));
    idealNegative.push(Math.min(...colVals));
  }

  // 3. Euclidean distances
  const distPositive: number[] = [];
  const distNegative: number[] = [];
  const relativeCloseness: number[] = [];

  for (let i = 0; i < m; i++) {
    let dPlusSq = 0;
    let dMinusSq = 0;

    for (let j = 0; j < n; j++) {
      dPlusSq += (weightedMatrix[i][j] - idealPositive[j]) ** 2;
      dMinusSq += (weightedMatrix[i][j] - idealNegative[j]) ** 2;
    }

    const dPlus = Math.sqrt(dPlusSq);
    const dMinus = Math.sqrt(dMinusSq);
    distPositive.push(dPlus);
    distNegative.push(dMinus);

    const denom = dPlus + dMinus;
    const closeness = denom === 0 ? 0.5 : dMinus / denom;
    relativeCloseness.push(closeness);
  }

  // 4. Rankings
  const rankings = alternatives.map((alt, idx) => ({
    alternative: alt,
    index: idx,
    closeness: relativeCloseness[idx],
    rank: 0,
    dPlus: distPositive[idx],
    dMinus: distNegative[idx],
  }));

  rankings.sort((a, b) => b.closeness - a.closeness);
  rankings.forEach((r, rankIdx) => {
    r.rank = rankIdx + 1;
  });

  return {
    weightedMatrix,
    idealPositive,
    idealNegative,
    distPositive,
    distNegative,
    relativeCloseness,
    rankings,
  };
}

/**
 * Sensitivity Analysis: perturb a single criterion's weight from 0 to 1
 * while proportionally scaling other criteria
 */
export function computeSensitivity(
  normMatrix: number[][],
  baseWeights: number[],
  targetCriterionIndex: number,
  alternatives: string[]
): SensitivityPoint[] {
  const steps = 11; // 0.0, 0.1, ..., 1.0
  const points: SensitivityPoint[] = [];
  const n = baseWeights.length;

  for (let s = 0; s < steps; s++) {
    const targetW = s / (steps - 1);
    const remainingW = 1 - targetW;
    const currentBaseRest = baseWeights.reduce((sum, w, i) => (i !== targetCriterionIndex ? sum + w : sum), 0) || 1;

    const testWeights = baseWeights.map((w, i) => {
      if (i === targetCriterionIndex) return targetW;
      return (w / currentBaseRest) * remainingW;
    });

    const topsisRes = computeTOPSIS(normMatrix, testWeights, alternatives);
    const scores: { [alt: string]: number } = {};
    topsisRes.rankings.forEach(item => {
      scores[item.alternative] = item.closeness;
    });

    points.push({
      weightFactor: targetW,
      scores,
    });
  }

  return points;
}
