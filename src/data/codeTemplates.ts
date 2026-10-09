import { Criterion } from '../types/mcdm';

export function generatePythonCode(
  method: 'all' | 'ahp' | 'g1' | 'delphi' | 'entropy' | 'critic' | 'cv' | 'gametheory' | 'topsis',
  matrix: number[][],
  criteria: Criterion[],
  alternatives: string[],
  ahpPairwise?: number[][],
  g1Ratios?: number[]
): string {
  const criteriaNames = criteria.map(c => `'${c.name}'`).join(', ');
  const criteriaTypes = criteria.map(c => `'${c.type}'`).join(', ');
  const altsList = alternatives.map(a => `'${a}'`).join(', ');

  const matrixRows = matrix.map(row => `    [${row.map(v => v.toFixed(2)).join(', ')}]`).join(',\n');
  const matrixStr = `X = np.array([\n${matrixRows}\n], dtype=float)`;

  const ahpStr = ahpPairwise
    ? `A = np.array([\n${ahpPairwise.map(r => `    [${r.map(v => (v >= 1 ? v.toFixed(2) : `1/${(1/v).toFixed(0)}`)).join(', ')}]`).join(',\n')}\n], dtype=float)`
    : `# 示例 AHP 判断矩阵\nA = np.eye(${criteria.length})`;

  const g1Str = g1Ratios
    ? `r_k = np.array([${g1Ratios.join(', ')}])`
    : `r_k = np.array([1.2] * ${Math.max(1, criteria.length - 1)})`;

  if (method === 'ahp') {
    return `# ========================================================
# 1. AHP (Analytic Hierarchy Process) - NumPy & Matplotlib
# All plot titles, legends, and axes are in English for portability.
# ========================================================
import numpy as np
import matplotlib.pyplot as plt

${ahpStr}

criteria = [${criteriaNames}]
n = A.shape[0]

# 1. Sum-Product Method for Approximate Weights
col_sum = np.sum(A, axis=0)
norm_A = A / col_sum
w_sum_product = np.mean(norm_A, axis=1)

# 2. Principal Eigenvector (Aw = lambda_max * w)
eigenvalues, eigenvectors = np.linalg.eig(A)
max_idx = np.argmax(np.real(eigenvalues))
lambda_max = np.real(eigenvalues[max_idx])
w_eigen = np.real(eigenvectors[:, max_idx])
w_eigen = w_eigen / np.sum(w_eigen)

# 3. Consistency Check (CI and CR)
CI = (lambda_max - n) / (n - 1)
RI_TABLE = {1: 0.0, 2: 0.0, 3: 0.58, 4: 0.90, 5: 1.12, 6: 1.24, 7: 1.32, 8: 1.41}
RI = RI_TABLE.get(n, 1.45)
CR = CI / RI if RI > 0 else 0.0

print("--- AHP Results ---")
print(f"Max Eigenvalue (lambda_max): {lambda_max:.4f}")
print(f"Consistency Index (CI):       {CI:.4f}")
print(f"Consistency Ratio (CR):       {CR:.4f} (Valid: {CR < 0.1})")
print("Weights:", np.round(w_eigen, 4))

# 4. Visualization (English Labels)
plt.figure(figsize=(8, 4.5))
bars = plt.bar([f"C{i+1}" for i in range(n)], w_eigen, color="#0f766e", edgecolor="#134e4a", label="AHP Weight")
plt.title("AHP Criteria Weights Distribution", fontsize=14, fontweight="bold")
plt.xlabel("Criteria (C1 to Cn)", fontsize=11)
plt.ylabel("Weight Value", fontsize=11)
plt.ylim(0, max(w_eigen) * 1.25)
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.legend(loc="upper right")
for bar, val in zip(bars, w_eigen):
    plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01, f"{val:.3f}", ha="center", fontsize=10)
plt.tight_layout()
plt.show()
`;
  }

  if (method === 'g1') {
    return `# ========================================================
# 2. G1 Order Relation Analysis - NumPy & Matplotlib
# All plot titles, legends, and axes are in English for portability.
# ========================================================
import numpy as np
import matplotlib.pyplot as plt

criteria = [${criteriaNames}]
${g1Str}
n = len(criteria)

# Compute products: prod_term_k = prod_{j=k}^n r_j
prod_terms = []
for k in range(2, n + 1):
    sub_slice = r_k[(k - 2):]
    prod_terms.append(np.prod(sub_slice))

# Base weight w_n
denominator = 1.0 + np.sum(prod_terms)
w_n = 1.0 / denominator

# Backward recursion: w_{k-1} = r_k * w_k
w = np.zeros(n)
w[-1] = w_n
for k in range(n - 1, 0, -1):
    w[k - 1] = r_k[k - 1] * w[k]

w = w / np.sum(w)

print("--- G1 Weighting Results ---")
for idx, (name, val) in enumerate(zip(criteria, w)):
    print(f"Criterion {idx+1} ({name}): {val:.4f}")

# Visualization (English Labels)
plt.figure(figsize=(8, 4.5))
bars = plt.bar([f"C{i+1}" for i in range(n)], w, color="#1e293b", edgecolor="#0f172a", label="G1 Weight")
plt.title("G1 Order Relation Weights Distribution", fontsize=14, fontweight="bold")
plt.xlabel("Criteria (Rank Ordered)", fontsize=11)
plt.ylabel("Weight Value", fontsize=11)
plt.ylim(0, max(w) * 1.25)
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.legend(loc="upper right")
for bar, val in zip(bars, w):
    plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01, f"{val:.3f}", ha="center", fontsize=10)
plt.tight_layout()
plt.show()
`;
  }

  if (method === 'delphi') {
    return `# ========================================================
# 3. Delphi-Fuzzy (Triangular Fuzzy Numbers) - NumPy & Matplotlib
# All plot titles, legends, and axes are in English for portability.
# ========================================================
import numpy as np
import matplotlib.pyplot as plt

# Expert ratings (l, m, u) for criteria
fuzzy_ratings = np.array([
    [[8.5, 9.5, 10.0], [7.0, 8.0, 9.0], [6.0, 7.0, 8.5], [5.0, 6.5, 8.0], [6.5, 7.5, 9.0]],
    [[8.0, 9.0,  9.8], [7.5, 8.5, 9.5], [5.5, 6.5, 8.0], [6.0, 7.0, 8.5], [7.0, 8.0, 8.8]],
    [[9.0, 9.8, 10.0], [6.5, 7.5, 8.5], [6.5, 7.5, 8.5], [5.5, 6.0, 7.5], [6.0, 7.0, 8.5]],
])

# 1. Mean TFN
mean_tfn = np.mean(fuzzy_ratings, axis=0)

# 2. Centroid Defuzzification: DF = (l + 2m + u) / 4
df = (mean_tfn[:, 0] + 2.0 * mean_tfn[:, 1] + mean_tfn[:, 2]) / 4.0

# 3. Normalized Weights
w_delphi = df / np.sum(df)
n = len(w_delphi)

print("--- Delphi-Fuzzy Results ---")
for j, w_val in enumerate(w_delphi):
    print(f"Criterion {j+1}: Mean TFN=({mean_tfn[j,0]:.2f}, {mean_tfn[j,1]:.2f}, {mean_tfn[j,2]:.2f}) -> Weight: {w_val:.4f}")

# Visualization (English Labels)
plt.figure(figsize=(8, 4.5))
bars = plt.bar([f"C{i+1}" for i in range(n)], w_delphi, color="#0284c7", edgecolor="#0369a1", label="Delphi-Fuzzy Weight")
plt.title("Delphi-Fuzzy Defuzzified Weights Distribution", fontsize=14, fontweight="bold")
plt.xlabel("Criteria", fontsize=11)
plt.ylabel("Weight Value", fontsize=11)
plt.ylim(0, max(w_delphi) * 1.25)
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.legend(loc="upper right")
for bar, val in zip(bars, w_delphi):
    plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01, f"{val:.3f}", ha="center", fontsize=10)
plt.tight_layout()
plt.show()
`;
  }

  if (method === 'entropy') {
    return `# ========================================================
# 4. Entropy Weight Method - NumPy & Matplotlib
# All plot titles, legends, and axes are in English for portability.
# ========================================================
import numpy as np
import matplotlib.pyplot as plt

${matrixStr}
criteria_types = [${criteriaTypes}]
m, n = X.shape

# 1. Min-Max Normalization
Z = np.zeros_like(X)
for j in range(n):
    c_min, c_max = np.min(X[:, j]), np.max(X[:, j])
    rng = c_max - c_min if c_max != c_min else 1.0
    Z[:, j] = (X[:, j] - c_min) / rng if criteria_types[j] == 'benefit' else (c_max - X[:, j]) / rng

# 2. Probability Proportion with Epsilon Shift (1e-6)
eps = 1e-6
Z_shift = Z + eps
P = Z_shift / np.sum(Z_shift, axis=0)

# 3. Information Entropy: e_j = -k * sum(P * ln(P))
k_val = 1.0 / np.log(m) if m > 1 else 1.0
e = -k_val * np.sum(P * np.log(P), axis=0)
e = np.clip(e, 0.0, 1.0)

# 4. Divergence Coefficient d_j = 1 - e_j & Weight
d = 1.0 - e
w_entropy = d / np.sum(d)

print("--- Entropy Weight Results ---")
print("Information Entropy (e_j):", np.round(e, 4))
print("Divergence (d_j = 1 - e):  ", np.round(d, 4))
print("Entropy Weights (w_j):     ", np.round(w_entropy, 4))

# Visualization (English Labels)
plt.figure(figsize=(8, 4.5))
bars = plt.bar([f"C{i+1}" for i in range(n)], w_entropy, color="#d97706", edgecolor="#b45309", label="Entropy Weight")
plt.title("Entropy Method Criteria Weights Distribution", fontsize=14, fontweight="bold")
plt.xlabel("Criteria", fontsize=11)
plt.ylabel("Weight Value", fontsize=11)
plt.ylim(0, max(w_entropy) * 1.25)
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.legend(loc="upper right")
for bar, val in zip(bars, w_entropy):
    plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01, f"{val:.3f}", ha="center", fontsize=10)
plt.tight_layout()
plt.show()
`;
  }

  if (method === 'critic') {
    return `# ========================================================
# 5. CRITIC Method - NumPy & Matplotlib
# All plot titles, legends, and axes are in English for portability.
# ========================================================
import numpy as np
import matplotlib.pyplot as plt

${matrixStr}
criteria_types = [${criteriaTypes}]
m, n = X.shape

# 1. Normalization
Z = np.zeros_like(X)
for j in range(n):
    c_min, c_max = np.min(X[:, j]), np.max(X[:, j])
    rng = c_max - c_min if c_max != c_min else 1.0
    Z[:, j] = (X[:, j] - c_min) / rng if criteria_types[j] == 'benefit' else (c_max - X[:, j]) / rng

# 2. Contrast Intensity (Standard Deviation sigma)
sigma = np.std(Z, axis=0, ddof=0)

# 3. Intercriteria Conflict (Pearson Correlation Matrix)
corr_matrix = np.corrcoef(Z, rowvar=False)
corr_matrix = np.nan_to_num(corr_matrix, nan=0.0)
conflict = np.sum(1.0 - corr_matrix, axis=1)

# 4. Information Quantity C_j = sigma_j * conflict_j
C = sigma * conflict
w_critic = C / np.sum(C)

print("--- CRITIC Results ---")
print("Std Deviation (sigma):    ", np.round(sigma, 4))
print("Conflict sum(1 - r):      ", np.round(conflict, 4))
print("Information Quantity (C): ", np.round(C, 4))
print("CRITIC Weights:           ", np.round(w_critic, 4))

# Visualization (English Labels)
plt.figure(figsize=(8, 4.5))
bars = plt.bar([f"C{i+1}" for i in range(n)], w_critic, color="#7c3aed", edgecolor="#6d28d9", label="CRITIC Weight")
plt.title("CRITIC Method Weights Distribution", fontsize=14, fontweight="bold")
plt.xlabel("Criteria", fontsize=11)
plt.ylabel("Weight Value", fontsize=11)
plt.ylim(0, max(w_critic) * 1.25)
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.legend(loc="upper right")
for bar, val in zip(bars, w_critic):
    plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01, f"{val:.3f}", ha="center", fontsize=10)
plt.tight_layout()
plt.show()
`;
  }

  if (method === 'cv') {
    return `# ========================================================
# 6. Coefficient of Variation (CV) - NumPy & Matplotlib
# All plot titles, legends, and axes are in English for portability.
# ========================================================
import numpy as np
import matplotlib.pyplot as plt

${matrixStr}
m, n = X.shape

mu = np.mean(X, axis=0)
sigma = np.std(X, axis=0, ddof=0)

cv = np.zeros(n)
for j in range(n):
    cv[j] = sigma[j] / np.abs(mu[j]) if np.abs(mu[j]) > 1e-9 else 0.0

w_cv = cv / np.sum(cv)

print("--- CV Results ---")
print("Mean (mu):         ", np.round(mu, 4))
print("Std Dev (sigma):   ", np.round(sigma, 4))
print("Coeff of Var (CV): ", np.round(cv, 4))
print("CV Weights:        ", np.round(w_cv, 4))

# Visualization (English Labels)
plt.figure(figsize=(8, 4.5))
bars = plt.bar([f"C{i+1}" for i in range(n)], w_cv, color="#059669", edgecolor="#047857", label="CV Weight")
plt.title("Coefficient of Variation (CV) Weights Distribution", fontsize=14, fontweight="bold")
plt.xlabel("Criteria", fontsize=11)
plt.ylabel("Weight Value", fontsize=11)
plt.ylim(0, max(w_cv) * 1.25)
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.legend(loc="upper right")
for bar, val in zip(bars, w_cv):
    plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01, f"{val:.3f}", ha="center", fontsize=10)
plt.tight_layout()
plt.show()
`;
  }

  if (method === 'gametheory') {
    return `# ========================================================
# 7. Game Theory Combination Weighting - NumPy & Matplotlib
# All plot titles, legends, and axes are in English for portability.
# ========================================================
import numpy as np
import matplotlib.pyplot as plt

# Subjective & Objective base vectors
W_sub = np.array([0.15, 0.30, 0.35, 0.08, 0.12])
W_obj = np.array([0.22, 0.18, 0.28, 0.14, 0.18])
n = len(W_sub)

# Game Theory linear system:
# [ W1·W1  W1·W2 ] [ alpha1 ] = [ W1·W1 ]
# [ W2·W1  W2·W2 ] [ alpha2 ]   [ W2·W2 ]
A_game = np.array([
    [np.dot(W_sub, W_sub), np.dot(W_sub, W_obj)],
    [np.dot(W_obj, W_sub), np.dot(W_obj, W_obj)]
])
B_game = np.array([np.dot(W_sub, W_sub), np.dot(W_obj, W_obj)])
alphas = np.linalg.solve(A_game, B_game)

# Normalized coefficients: alpha* + beta* = 1
sum_alpha = np.sum(np.abs(alphas))
alpha_star = np.abs(alphas[0]) / sum_alpha
beta_star  = np.abs(alphas[1]) / sum_alpha

# Combined weight vector W*
W_star = alpha_star * W_sub + beta_star * W_obj
W_star = W_star / np.sum(W_star)

print("--- Game Theory Combination Results ---")
print(f"Coefficients: alpha* (Subjective) = {alpha_star:.4f}, beta* (Objective) = {beta_star:.4f}")
print("Combined Weights (W*):", np.round(W_star, 4))

# Visualization (English Labels)
x_idx = np.arange(n)
width = 0.26
plt.figure(figsize=(9, 4.8))
plt.bar(x_idx - width, W_sub, width, label="Subjective Weight", color="#64748b")
plt.bar(x_idx, W_obj, width, label="Objective Weight", color="#0284c7")
plt.bar(x_idx + width, W_star, width, label="Combined Weight (W*)", color="#0f766e")
plt.title("Game Theory Combined Weight Synthesis", fontsize=14, fontweight="bold")
plt.xlabel("Criteria Index", fontsize=11)
plt.ylabel("Weight Value", fontsize=11)
plt.xticks(x_idx, [f"C{i+1}" for i in range(n)])
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.legend(loc="upper right")
plt.tight_layout()
plt.show()
`;
  }

  if (method === 'topsis') {
    return `# ========================================================
# 8. TOPSIS Decision Ranking - NumPy & Matplotlib
# All plot titles, legends, and axes are in English for portability.
# ========================================================
import numpy as np
import matplotlib.pyplot as plt

${matrixStr}
criteria_types = [${criteriaTypes}]
alternatives = [${altsList}]
m, n = X.shape

# 1. Normalization
Z = np.zeros_like(X)
for j in range(n):
    c_min, c_max = np.min(X[:, j]), np.max(X[:, j])
    rng = c_max - c_min if c_max != c_min else 1.0
    Z[:, j] = (X[:, j] - c_min) / rng if criteria_types[j] == 'benefit' else (c_max - X[:, j]) / rng

# Equal weights or passed synthesis vector
w = np.array([1.0 / n] * n)

# 2. Weighted Matrix V
V = Z * w

# 3. Ideal Solutions
Z_plus  = np.max(V, axis=0)
Z_minus = np.min(V, axis=0)

# 4. Euclidean Distances D+ and D-
D_plus  = np.sqrt(np.sum((V - Z_plus)**2, axis=1))
D_minus = np.sqrt(np.sum((V - Z_minus)**2, axis=1))

# 5. Relative Closeness: C_i = D- / (D+ + D-)
C = D_minus / (D_plus + D_minus)

ranking_indices = np.argsort(-C)
print("--- TOPSIS Final Rankings ---")
for rank, idx in enumerate(ranking_indices, 1):
    print(f"Rank {rank}: {alternatives[idx]} (Closeness Ci = {C[idx]:.4f}, D+={D_plus[idx]:.4f}, D-={D_minus[idx]:.4f})")

# Visualization (English Labels)
plt.figure(figsize=(8.5, 4.5))
colors = ["#0f766e" if i == ranking_indices[0] else "#64748b" for i in range(m)]
bars = plt.bar(range(m), C, color=colors, edgecolor="#334155", label="Closeness Coefficient (Ci)")
plt.title("TOPSIS Closeness Coefficient Ranking", fontsize=14, fontweight="bold")
plt.xlabel("Alternative", fontsize=11)
plt.ylabel("Relative Closeness (Ci)", fontsize=11)
plt.xticks(range(m), [f"Alt {i+1}" for i in range(m)])
plt.ylim(0, 1.05)
plt.grid(axis="y", linestyle="--", alpha=0.5)
plt.legend(loc="upper right")
for bar, val in zip(bars, C):
    plt.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.02, f"{val:.3f}", ha="center", fontsize=10)
plt.tight_layout()
plt.show()
`;
  }

  // Unified Full Pipeline
  return `# ==============================================================================
# Index Weighting & MCDM Lab - Full Pipeline Python Script
# Normalization -> AHP -> Entropy -> CRITIC -> Game Theory -> TOPSIS
# All plot titles, legends, and axes are in English for portability.
# ==============================================================================
import numpy as np
import matplotlib.pyplot as plt

# 1. Decision Matrix X & Criteria Definitions
${matrixStr}
criteria_types = [${criteriaTypes}]
alternatives = [${altsList}]
m, n = X.shape

# 2. Normalization Matrix Z
Z = np.zeros_like(X)
for j in range(n):
    c_min, c_max = np.min(X[:, j]), np.max(X[:, j])
    rng = c_max - c_min if c_max != c_min else 1.0
    Z[:, j] = (X[:, j] - c_min) / rng if criteria_types[j] == 'benefit' else (c_max - X[:, j]) / rng

# 3. Objective Weight: Entropy Method (with 1e-6 shift)
P = (Z + 1e-6) / np.sum(Z + 1e-6, axis=0)
k = 1.0 / np.log(m) if m > 1 else 1.0
e = -k * np.sum(P * np.log(P), axis=0)
d = 1.0 - np.clip(e, 0.0, 1.0)
w_entropy = d / np.sum(d)

# 4. Subjective Weight: G1 Order Relation
${g1Str}
prod_terms = [np.prod(r_k[(k-2):]) for k in range(2, n + 1)]
w_g1 = np.zeros(n)
w_g1[-1] = 1.0 / (1.0 + np.sum(prod_terms))
for k in range(n - 1, 0, -1):
    w_g1[k - 1] = r_k[k - 1] * w_g1[k]
w_g1 = w_g1 / np.sum(w_g1)

# 5. Game Theory Optimal Combination Synthesis
A_game = np.array([
    [np.dot(w_g1, w_g1), np.dot(w_g1, w_entropy)],
    [np.dot(w_entropy, w_g1), np.dot(w_entropy, w_entropy)]
])
B_game = np.array([np.dot(w_g1, w_g1), np.dot(w_entropy, w_entropy)])
alphas = np.linalg.solve(A_game, B_game)
sum_a = np.sum(np.abs(alphas))
alpha_star, beta_star = np.abs(alphas[0]) / sum_a, np.abs(alphas[1]) / sum_a
w_comb = (alpha_star * w_g1 + beta_star * w_entropy)
w_comb /= np.sum(w_comb)

# 6. TOPSIS Decision Ranking
V = Z * w_comb
Z_plus = np.max(V, axis=0)
Z_minus = np.min(V, axis=0)
D_plus = np.sqrt(np.sum((V - Z_plus)**2, axis=1))
D_minus = np.sqrt(np.sum((V - Z_minus)**2, axis=1))
C = D_minus / (D_plus + D_minus)

print("--- MCDM Full Pipeline Results ---")
print(f"Coefficients: alpha*={alpha_star:.4f}, beta*={beta_star:.4f}")
print("Final Combined Weights (w*):", np.round(w_comb, 4))
ranks = np.argsort(-C)
for r, idx in enumerate(ranks, 1):
    print(f"Rank {r}: {alternatives[idx]} | Closeness Ci = {C[idx]:.4f}")

# 7. Dual Plot Visualization (English Titles & Axes)
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.5))

# Plot 1: Combined Weights
bars1 = ax1.bar([f"C{i+1}" for i in range(n)], w_comb, color="#0f766e", edgecolor="#134e4a", label="Combined Weight")
ax1.set_title("Criteria Weight Distribution (W*)", fontsize=12, fontweight="bold")
ax1.set_xlabel("Criteria", fontsize=10)
ax1.set_ylabel("Weight Value", fontsize=10)
ax1.grid(axis="y", linestyle="--", alpha=0.5)
ax1.legend(loc="upper right")

# Plot 2: TOPSIS Closeness Ranking
bars2 = ax2.bar(range(m), C, color="#0284c7", edgecolor="#0369a1", label="Relative Closeness (Ci)")
ax2.set_title("TOPSIS Closeness Coefficient Ranking", fontsize=12, fontweight="bold")
ax2.set_xlabel("Alternative", fontsize=10)
ax2.set_ylabel("Closeness (Ci)", fontsize=10)
ax2.set_xticks(range(m))
ax2.set_xticklabels([f"Alt {i+1}" for i in range(m)])
ax2.set_ylim(0, 1.05)
ax2.grid(axis="y", linestyle="--", alpha=0.5)
ax2.legend(loc="upper right")

plt.tight_layout()
plt.show()
`;
}
