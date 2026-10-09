import React, { useState, useEffect } from 'react';
import { Criterion, DiagnosticIssue } from '../types/mcdm';
import {
  Stethoscope,
  X,
  Send,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  Bot,
  User,
  MessageSquare,
  RefreshCw,
  Settings,
  Key,
  Eye,
  EyeOff,
  Cpu,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import {
  getStoredLLMConfig,
  saveStoredLLMConfig,
  invokeLLM,
  SupportedModel,
  LLMConfig,
} from '../services/llmService';
import { runLocalMCDMRules } from '../utils/mcdmRules';

interface AiClinicModalProps {
  isOpen: boolean;
  onClose: () => void;
  matrix: number[][];
  criteria: Criterion[];
  alternatives: string[];
  ahpMatrix?: number[][];
  weights?: Record<string, number[]>;
  scenarioTitle?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  modelUsed?: string;
}

export const AiClinicModal: React.FC<AiClinicModalProps> = ({
  isOpen,
  onClose,
  matrix,
  criteria,
  alternatives,
  ahpMatrix,
  weights,
  scenarioTitle,
}) => {
  const [activeTab, setActiveTab] = useState<'scan' | 'chat'>('scan');
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<DiagnosticIssue[]>([]);
  const [aiReportText, setAiReportText] = useState<string>('');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(getStoredLLMConfig());
  const [tempApiKey, setTempApiKey] = useState(llmConfig.apiKey);
  const [tempModel, setTempModel] = useState<SupportedModel>(llmConfig.model);
  const [tempCustomEndpoint, setTempCustomEndpoint] = useState(llmConfig.customEndpoint || '');
  const [showPassword, setShowPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Chat State
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '您好！我是 MCDM 实验室的学术随诊助手。已为您连接浏览器端大模型调用引擎（支持 Gemini 3 Flash 与 DeepSeek-v4-pro）。所有大模型调用需先配置 API-Key。未配置时将使用内置离线运筹学规则引擎。',
      time: '刚刚',
    },
  ]);

  // Load config on mount
  useEffect(() => {
    const cfg = getStoredLLMConfig();
    setLlmConfig(cfg);
    setTempApiKey(cfg.apiKey);
    setTempModel(cfg.model);
    setTempCustomEndpoint(cfg.customEndpoint || '');
  }, [isOpen]);

  // Execute Diagnosis
  const handleRunDiagnosis = async () => {
    setIsScanning(true);
    // 1. Instant local heuristic scan (guaranteed offline)
    const localIssues = runLocalMCDMRules({ matrix, criteria, alternatives, ahpMatrix, weights });
    setIssues(localIssues);

    // 2. If API Key is configured, run LLM reasoning
    if (llmConfig.apiKey && llmConfig.apiKey.trim() !== '') {
      try {
        const prompt = `你是一位严谨的运筹学、数理统计与多属性决策分析（MCDM）专家顾问。
请根据以下多属性决策实验室的输入状态进行深度学术诊断：
- 决策场景: ${scenarioTitle || '自定义多方案评估'}
- 指标数量: ${criteria?.length || 0} 个（包含效益型/成本型）
- 备选方案: ${alternatives?.join(', ') || '多方案'}
- 规则引擎初诊发现:
${localIssues.map((iss) => `  * [${iss.type}] ${iss.title}: ${iss.message}`).join('\n')}

请输出结构化的专家诊断结论，重点剖析：
1. 判断矩阵一致性或定性赋权逻辑风险；
2. 客观指标的离散度（熵权与变异系数）是否存在噪声驱动的假性高权陷阱；
3. 指标多重共线性对 TOPSIS 欧氏距离空间变形的影响；
4. 针对本案例推荐的主客观博弈组合策略（α与β的合理区间）。
请语言专业、精炼、客观，避免泛泛空话，分要点回答。`;

        const aiText = await invokeLLM(prompt, llmConfig);
        setAiReportText(aiText);
      } catch (err: any) {
        console.error('LLM Diagnosis Error:', err);
        setAiReportText(
          `【${llmConfig.model} 调用提示】: ${err.message || '网络连接异常'}。已为您切换展示内置本地运筹学初诊结论。`
        );
      }
    } else {
      setAiReportText(
        '【提示】：当前尚未配置 API-Key，诊断结果基于实验室内置运筹学专家规则库实时生成。点击右上角【小齿轮】输入 API-Key 即可启用 ' +
          llmConfig.model +
          ' 深度综合分析。'
      );
    }
    setIsScanning(false);
  };

  // Run scan once on open if not already scanned
  useEffect(() => {
    if (isOpen && issues.length === 0) {
      handleRunDiagnosis();
    }
  }, [isOpen]);

  // Save Settings
  const handleSaveSettings = () => {
    const updated: LLMConfig = {
      apiKey: tempApiKey.trim(),
      model: tempModel,
      customEndpoint: tempCustomEndpoint.trim(),
    };
    saveStoredLLMConfig(updated);
    setLlmConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setIsSettingsOpen(false);
    }, 800);
  };

  // Send message
  const handleSendMessage = async (msgToSend?: string) => {
    const text = msgToSend || inputMessage;
    if (!text.trim() || isSending) return;

    // Check if API-Key is configured
    if (!llmConfig.apiKey || llmConfig.apiKey.trim() === '') {
      setIsSettingsOpen(true);
      return;
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsSending(true);

    try {
      const chatPrompt = `【当前决策背景】: ${scenarioTitle || '多属性综合评估'} (方案数: ${
        alternatives.length
      }, 指标数: ${criteria.length})
用户提问: ${text}`;

      const reply = await invokeLLM(chatPrompt, llmConfig);

      const aiReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: llmConfig.model,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackReply: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `【调用失败 (${llmConfig.model})】: ${
          err.message || '请求超时或被浏览器拦截'
        }。\n请点击右上角小齿轮检查 API-Key 或选择另一个大模型。`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    '为什么 CR ≥ 0.1 必须修正？如何定位最大矛盾元素？',
    '熵权法在什么情况下会导致异常噪声绑架决策？',
    'CRITIC 法的冲突性测度原理是什么？',
    'TOPSIS 逆序 (Rank Reversal) 现象发生机理与防范策略？',
    '博弈论组合赋权当 α 或 β 为负数时如何正规化？',
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col w-full max-w-3xl h-[85vh] bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden relative">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-xs">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-semibold text-stone-900">
                  AI 随诊与运筹学决策体检
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-medium">
                  {llmConfig.model}
                </span>
                {llmConfig.apiKey ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Key已配置
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    未配Key
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500">
                支持直接在浏览器内由用户 API-Key 调用大模型，适配 GitHub 部署
              </p>
            </div>
          </div>

          {/* 标题右侧工具按钮区（包含齿轮设置） */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleRunDiagnosis}
              disabled={isScanning}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs"
              title="重新体检"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-teal-600' : 'text-stone-500'}`}
              />
              <span className="hidden sm:inline">重新体检</span>
            </button>

            {/* 小齿轮设置大模型图标 */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-1.5 rounded-lg border transition-all shadow-2xs flex items-center gap-1 text-xs font-medium ${
                isSettingsOpen
                  ? 'bg-teal-700 text-white border-teal-800'
                  : 'bg-white hover:bg-stone-100 text-stone-700 border-stone-200'
              }`}
              title="大模型设置 (API-Key 与 模型切换)"
            >
              <Settings className="w-4 h-4 text-teal-600 group-hover:rotate-45 transition-transform" />
              <span className="hidden sm:inline text-[11px]">设置大模型</span>
            </button>

            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 未配置 Key 时的醒目提示条 */}
        {!llmConfig.apiKey && !isSettingsOpen && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-amber-700" />
              <span>
                本项目支持部署至 GitHub 静态网站，所有大模型调用必须由用户手工输入 API-Key 后方可调用。
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="font-semibold underline hover:text-amber-950 ml-2 shrink-0"
            >
              立即配置 API-Key
            </button>
          </div>
        )}

        {/* 标签栏 */}
        <div className="flex items-center border-b border-stone-200 px-5 bg-white text-xs font-medium">
          <button
            onClick={() => setActiveTab('scan')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'scan'
                ? 'border-teal-700 text-teal-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-teal-600" />
            当前状态体检诊断
            {issues.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-stone-100 text-stone-700">
                {issues.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'border-teal-700 text-teal-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
            运筹学 Q&A 随诊咨询
          </button>
        </div>

        {/* 主体工作区 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'scan' && (
            <div className="space-y-4">
              {/* 实时体检卡片列表 */}
              <div className="space-y-3">
                {issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                      issue.type === 'danger'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                        : issue.type === 'warning'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                        : issue.type === 'success'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : 'bg-stone-50 border-stone-200 text-stone-900'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {issue.type === 'danger' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                      {issue.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                      {issue.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {issue.type === 'info' && <Info className="w-4 h-4 text-sky-600" />}
                      <span className="text-sm">{issue.title}</span>
                    </div>

                    <p className="leading-relaxed text-stone-700">{issue.message}</p>

                    <div className="p-2.5 rounded-lg bg-white/80 border border-stone-200/60 text-stone-800 font-medium leading-normal">
                      <span className="text-stone-500 font-semibold">专家处方对策：</span>{' '}
                      {issue.suggestion}
                    </div>
                  </div>
                ))}
              </div>

              {/* 大模型深度综合学术结语 */}
              {aiReportText && (
                <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-teal-900">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      大模型 ({llmConfig.model}) 学术综合诊断分析:
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">Browser Direct Invocation</span>
                  </div>
                  <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                    {aiReportText}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col h-full space-y-4">
              <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${
                      m.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {m.sender === 'ai' && (
                      <div className="h-7 w-7 rounded-lg bg-teal-700 text-white flex items-center justify-center shrink-0 text-xs shadow-2xs">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-stone-900 text-white rounded-tr-xs'
                          : 'bg-stone-100 text-stone-800 rounded-tl-xs border border-stone-200'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.text}</div>
                      <div
                        className={`text-[10px] mt-1.5 flex items-center justify-between gap-2 ${
                          m.sender === 'user' ? 'text-stone-400' : 'text-stone-400'
                        }`}
                      >
                        <span>{m.time}</span>
                        {m.modelUsed && <span className="font-mono text-[9px]">[{m.modelUsed}]</span>}
                      </div>
                    </div>
                    {m.sender === 'user' && (
                      <div className="h-7 w-7 rounded-lg bg-stone-300 text-stone-700 flex items-center justify-center shrink-0 text-xs shadow-2xs">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isSending && (
                  <div className="flex items-center gap-2 text-xs text-stone-400 p-2">
                    <Bot className="w-4 h-4 text-teal-600 animate-pulse" />
                    <span>正在通过 {llmConfig.model} 进行运筹推演...</span>
                  </div>
                )}
              </div>

              {/* 快捷提问气泡 */}
              <div className="space-y-1.5 pt-2 border-t border-stone-100">
                <span className="text-[11px] font-semibold text-stone-400">常见核心理论问题随诊：</span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      className="text-[11px] px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition-colors truncate max-w-xs text-left"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部输入框 (仅在 chat tab 显示) */}
        {activeTab === 'chat' && (
          <div className="p-3 border-t border-stone-200 bg-white">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  llmConfig.apiKey
                    ? `向 ${llmConfig.model} 提问任何指标赋权与多属性决策难题...`
                    : '请先在右上角【设置】中输入 API-Key 方可发起提问...'
                }
                className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-xs text-stone-800 focus:bg-white focus:border-teal-600 outline-hidden transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={isSending || !inputMessage.trim()}
                className="px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                发送
              </button>
            </div>
          </div>
        )}

        {/* 大模型设置弹层 (小齿轮触发) */}
        {isSettingsOpen && (
          <div className="absolute inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-2xl border border-stone-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-stone-50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-teal-700 text-white">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-stone-900">大模型连接与 API-Key 设置</h4>
                    <p className="text-[11px] text-stone-500">
                      支持部署至 GitHub Pages，纯前端浏览器直连调用
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-5 text-xs">
                {/* 1. 模型选择 */}
                <div className="space-y-2">
                  <label className="font-semibold text-stone-800 block">
                    1. 选择调用的大模型 (Select LLM)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTempModel('gemini 3 flash')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        tempModel === 'gemini 3 flash'
                          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                          : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-bold text-stone-900 text-xs mb-0.5">gemini 3 flash</div>
                      <div className="text-[10px] text-stone-500">Google Gemini 旗舰低延迟大模型</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTempModel('deepseek-v4-pro')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        tempModel === 'deepseek-v4-pro'
                          ? 'border-teal-600 bg-teal-50/60 ring-1 ring-teal-600'
                          : 'border-stone-200 bg-stone-50/50 hover:border-stone-300'
                      }`}
                    >
                      <div className="font-bold text-stone-900 text-xs mb-0.5">deepseek-v4-pro</div>
                      <div className="text-[10px] text-stone-500">DeepSeek 深度逻辑推理模型</div>
                    </button>
                  </div>
                </div>

                {/* 2. 手工输入 API-Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-stone-800">
                      2. 手工输入 API-Key (API Key Required)
                    </label>
                    <span className="text-[10px] text-stone-400">保存在本地浏览器 LocalStorage</span>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={tempApiKey}
                      onChange={(e) => setTempApiKey(e.target.value)}
                      placeholder={
                        tempModel === 'gemini 3 flash'
                          ? '输入 Google AI Studio API-Key (如 AIzaSy...)'
                          : '输入 DeepSeek API-Key (如 sk-...)'
                      }
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 text-xs text-stone-800 pr-10 focus:bg-white focus:border-teal-600 outline-hidden font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-normal">
                    项目部署在 GitHub 静态页面上，所有大模型调用必须输入 API-Key 后才能发起请求。Key 不经过任何中间服务器，完全在浏览器本地与官方接口通信。
                  </p>
                </div>

                {/* 可选：自定义反向代理或 Base URL */}
                <div className="space-y-1 pt-1">
                  <div className="text-[11px] font-medium text-stone-600">
                    可选: 自定义代理地址 (Custom Endpoint / Base URL)
                  </div>
                  <input
                    type="text"
                    value={tempCustomEndpoint}
                    onChange={(e) => setTempCustomEndpoint(e.target.value)}
                    placeholder={
                      tempModel === 'gemini 3 flash'
                        ? '留空使用默认 Google 官方 API 接口'
                        : '留空使用默认 https://api.deepseek.com/chat/completions'
                    }
                    className="w-full rounded-lg border border-stone-200 bg-stone-50/50 px-3 py-1.5 text-[11px] text-stone-700 font-mono outline-hidden"
                  />
                </div>

                {/* 3. 确认大模型按钮 */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        已确认并保存
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        确认大模型设置
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
