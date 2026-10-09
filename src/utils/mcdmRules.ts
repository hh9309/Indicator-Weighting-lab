import { DiagnosticIssue } from '../types/mcdm';

/**
 * Built-in expert rule engine for instant client-side offline analysis
 * Guarantees 100% offline functionality when deployed statically on GitHub Pages
 */
export function runLocalMCDMRules(data: {
  matrix?: number[][];
  criteria?: { name: string; type: 'benefit' | 'cost' }[];
  alternatives?: string[];
  ahpMatrix?: number[][];
  weights?: Record<string, number[]>;
}): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];

  // 1. Check AHP Consistency
  if (data.ahpMatrix && data.ahpMatrix.length > 2) {
    const n = data.ahpMatrix.length;
    const colSums = Array(n).fill(0);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        colSums[j] += data.ahpMatrix[i][j];
      }
    }
    const normMatrix = data.ahpMatrix.map(row => row.map((val, j) => val / (colSums[j] || 1)));
    const weights = normMatrix.map(row => row.reduce((a, b) => a + b, 0) / n);

    const Aw = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        Aw[i] += data.ahpMatrix[i][j] * weights[j];
      }
    }
    const lambdaMax = Aw.reduce((acc, val, i) => acc + val / (weights[i] || 1e-6), 0) / n;
    const CI = (lambdaMax - n) / (n - 1);
    const RI_TABLE = [0, 0, 0.58, 0.90, 1.12, 1.24, 1.32, 1.41, 1.45, 1.49];
    const RI = RI_TABLE[n - 1] || 1.49;
    const CR = CI / (RI || 1);

    if (CR >= 0.1) {
      issues.push({
        type: 'danger',
        title: 'AHP 判断矩阵逻辑一致性未通过 (CR ≥ 0.1)',
        message: `当前阶数 n=${n}，λmax=${lambdaMax.toFixed(4)}，CI=${CI.toFixed(4)}，一致性比率 CR=${CR.toFixed(4)} (阈值 0.10)。存在专家主观传递性矛盾（如 A > B 且 B > C 但 C > A，或标度放大失真）。`,
        suggestion: '建议使用诱导矩阵或和积法核查互反标度，对偏离度最大的指标成对打分重新调优修正。',
      });
    } else {
      issues.push({
        type: 'success',
        title: 'AHP 判断矩阵一致性良好 (CR < 0.1)',
        message: `计算得出 CR=${CR.toFixed(4)} < 0.10，判断矩阵满足满意一致性检验。`,
        suggestion: '主观偏好传递逻辑严密，可安全作为主观权重向量参与博弈组合。',
      });
    }
  }

  // 2. Check Decision Matrix for zero-values & negative-values under entropy weighting
  if (data.matrix && data.matrix.length > 0) {
    const m = data.matrix.length;
    const n = data.matrix[0].length;
    let hasZero = false;
    let hasIdenticalCol = false;

    for (let j = 0; j < n; j++) {
      const colVals = data.matrix.map(row => row[j]);
      const minVal = Math.min(...colVals);
      const maxVal = Math.max(...colVals);
      if (minVal <= 0) hasZero = true;
      if (Math.abs(maxVal - minVal) < 1e-9) hasIdenticalCol = true;
    }

    if (hasZero) {
      issues.push({
        type: 'warning',
        title: '检测到非正数/零值 (熵权 ln(p) 奇点防线)',
        message: '原始矩阵或归一化矩阵存在 0 或负数元素。在执行信息熵计算 -k∑ p_ij ln(p_ij) 时，ln(0) 会触发 NaN / 溢出异常。',
        suggestion: '实验室已采用非负平移修正（y_ij = z_ij + 1e-6 平滑化），确保数学稳定性。',
      });
    }

    if (hasIdenticalCol) {
      issues.push({
        type: 'warning',
        title: '存在零方差/无辨识度指标',
        message: '某一指标在所有备选方案中的取值完全一致（极差为 0）。',
        suggestion: '该指标客观差异系数为 0，熵权与变异系数将退化为 0。建议剔除该冗余指标或转为主观必要性门槛过滤。',
      });
    }

    // Multicollinearity check (CRITIC conflict)
    if (n >= 3 && m >= 3) {
      let highCorrCount = 0;
      for (let j1 = 0; j1 < n; j1++) {
        for (let j2 = j1 + 1; j2 < n; j2++) {
          const col1 = data.matrix.map(r => r[j1]);
          const col2 = data.matrix.map(r => r[j2]);
          const mean1 = col1.reduce((a, b) => a + b, 0) / m;
          const mean2 = col2.reduce((a, b) => a + b, 0) / m;
          let cov = 0, var1 = 0, var2 = 0;
          for (let i = 0; i < m; i++) {
            cov += (col1[i] - mean1) * (col2[i] - mean2);
            var1 += (col1[i] - mean1) ** 2;
            var2 += (col2[i] - mean2) ** 2;
          }
          const r = cov / (Math.sqrt(var1 * var2) || 1e-9);
          if (Math.abs(r) > 0.85) {
            highCorrCount++;
          }
        }
      }
      if (highCorrCount > 0) {
        issues.push({
          type: 'info',
          title: '指标间存在强相关性/多重共线性',
          message: `检测到 ${highCorrCount} 对指标 Pearson 相关系数绝对值超过 0.85，信息存在重复计量。`,
          suggestion: '此时 CRITIC 法能够通过冲突性指标 ∑(1-r_jk) 自动惩罚强相关冗余；单纯熵权法可能赋予双重权重，建议选用 CRITIC 或博弈论组合。',
        });
      }
    }
  }

  return issues;
}
