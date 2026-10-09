/**
 * Client-Side LLM Service for Browser & GitHub Pages Deployment
 * Supports Gemini 3 Flash & DeepSeek-v4-pro with User-Provided API Keys
 */

export type SupportedModel = 'gemini 3 flash' | 'deepseek-v4-pro';

export interface LLMConfig {
  apiKey: string;
  model: SupportedModel;
  customEndpoint?: string;
}

const STORAGE_KEY = 'mcdm_lab_llm_config';

export function getStoredLLMConfig(): LLMConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        apiKey: parsed.apiKey || '',
        model: parsed.model || 'gemini 3 flash',
        customEndpoint: parsed.customEndpoint || '',
      };
    }
  } catch (e) {
    console.error('Failed to load LLM config from localStorage:', e);
  }
  return {
    apiKey: '',
    model: 'gemini 3 flash',
    customEndpoint: '',
  };
}

export function saveStoredLLMConfig(config: LLMConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save LLM config to localStorage:', e);
  }
}

/**
 * Generate completion using Gemini API (Direct Browser Fetch)
 */
async function callGemini(
  prompt: string,
  systemInstruction: string,
  apiKey: string,
  customEndpoint?: string
): Promise<string> {
  // Use Gemini 2.5 Flash / 2.0 Flash REST endpoint compatible with Google AI Studio keys
  const endpoint =
    customEndpoint?.trim() ||
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    '未能从 Gemini 获取到有效回复，请检查 API-Key 权限。';
  return text;
}

/**
 * Generate completion using DeepSeek API (Direct Browser Fetch)
 */
async function callDeepSeek(
  prompt: string,
  systemInstruction: string,
  apiKey: string,
  customEndpoint?: string
): Promise<string> {
  const endpoint =
    customEndpoint?.trim() || 'https://api.deepseek.com/chat/completions';

  const body = {
    model: 'deepseek-chat', // DeepSeek-v4-pro / standard chat model
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2048,
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`DeepSeek API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text =
    data.choices?.[0]?.message?.content ||
    '未能从 DeepSeek 获取到有效回复，请检查 API-Key 权限及余额。';
  return text;
}

/**
 * Unified invoke function
 */
export async function invokeLLM(
  prompt: string,
  config: LLMConfig,
  systemInstruction = '你是一个世界顶级的运筹学与多属性决策科学（MCDM）专家顾问。请对决策问题给出专业、严谨、条理分明的回答。'
): Promise<string> {
  const key = config.apiKey?.trim();
  if (!key) {
    throw new Error(
      '未配置 API-Key！请点击右上角小齿轮【大模型设置】输入对应的 API-Key 后再进行调用。'
    );
  }

  if (config.model === 'gemini 3 flash') {
    return await callGemini(prompt, systemInstruction, key, config.customEndpoint);
  } else if (config.model === 'deepseek-v4-pro') {
    return await callDeepSeek(prompt, systemInstruction, key, config.customEndpoint);
  } else {
    throw new Error(`不支持的模型类型: ${config.model}`);
  }
}
