"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface AnswerRule {
  id: number;
  title: string;
  category: string;
  text: string;
}

interface AnswerRecord {
  id: string;
  question: string;
  answer: string;
  rules: AnswerRule[];
  timestamp: number;
}

interface ApiResponse {
  answer: string;
  rules: AnswerRule[];
  question: string;
  error?: string;
}

const CATEGORY_LABELS: Record<string, { label: string; badgeClass: string }> = {
  修身: { label: "修身", badgeClass: "badge-xiushen" },
  财富: { label: "财富", badgeClass: "badge-caifu" },
  人际: { label: "人际", badgeClass: "badge-renji" },
  心态: { label: "心态", badgeClass: "badge-xintai" },
  运势: { label: "运势", badgeClass: "badge-yunshi" },
};

const EXAMPLE_QUESTIONS = [
  { text: "最近工作压力很大，经常失眠，该怎么办？", icon: "😰" },
  { text: "想辞职创业，但又怕失败，怎么抉择？", icon: "🤔" },
  { text: "和伴侣经常吵架，感情越来越淡了", icon: "💔" },
  { text: "感觉人生没有方向，每天都在浑浑噩噩", icon: "🌫️" },
  { text: "朋友借钱不还，要不要翻脸？", icon: "😤" },
  { text: "总是焦虑未来，控制不住地胡思乱想", icon: "😟" },
];

export default function Home() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerRecord | null>(null);
  const [history, setHistory] = useState<AnswerRecord[]>([]);
  const [error, setError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [dailyQuote, setDailyQuote] = useState<string>("");
  const resultRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 每日一句
  useEffect(() => {
    const quotes = [
      "灵若根，身若树，运若叶。叶虽凋落，苟灵不死、身不枯，逢其时，终见枝繁叶茂。",
      "容受万事，御运在己。洞明造化，即得真运。",
      "无待而常适者，天之所厚，亦至运也。",
      "遇不可解之事，避而俟之，或乃上策。",
      "正对内惧，乃得天眷。",
      "逢凶时，当先谋化吉之道。",
      "计其所有而不念所无者，斯为吉人之兆也。",
      "不贪者，贪之上境也。",
    ];
    const dayIndex = new Date().getDate() % quotes.length;
    setDailyQuote(quotes[dayIndex]);
  }, []);

  // 从 localStorage 加载历史
  useEffect(() => {
    try {
      const saved = localStorage.getItem("yiming_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // 保存历史到 localStorage
  const saveHistory = useCallback((records: AnswerRecord[]) => {
    setHistory(records);
    try {
      localStorage.setItem("yiming_history", JSON.stringify(records.slice(0, 20)));
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    setCurrentAnswer(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });

      const data: ApiResponse = await res.json();

      if (data.error) {
        setError(data.error);
      } else {
        const record: AnswerRecord = {
          id: Date.now().toString(),
          question: question.trim(),
          answer: data.answer,
          rules: data.rules,
          timestamp: Date.now(),
        };
        setCurrentAnswer(record);
        saveHistory([record, ...history]);
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err) {
      setError("网络请求失败，请检查网络连接后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleExampleClick = (text: string) => {
    setQuestion(text);
    textareaRef.current?.focus();
  };

  const handleHistoryClick = (record: AnswerRecord) => {
    setCurrentAnswer(record);
    setShowHistory(false);
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("yiming_history");
  };

  const handleReset = () => {
    setCurrentAnswer(null);
    setQuestion("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "刚刚";
    if (diffMin < 60) return `${diffMin}分钟前`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}小时前`;
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const getCategoryBadge = (category: string) => {
    const info = CATEGORY_LABELS[category] || { label: category, badgeClass: "" };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.badgeClass}`}>
        {info.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-pattern">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-orange-200/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-amber-100/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="glass border-b border-amber-200/50 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="text-2xl animate-float" style={{ animationDuration: "4s" }}>☯</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-stone-800 tracking-wide">易命之书 · 人生答疑</h1>
              <p className="text-[11px] text-stone-500">52条人生法则，为你指点迷津</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-3 py-1.5 text-xs bg-amber-50 border border-amber-200 rounded-lg text-stone-600 hover:bg-amber-100 transition-colors"
              >
                📜 历史记录 ({history.length})
              </button>
            )}
            {currentAnswer && (
              <button
                onClick={handleReset}
                className="px-3 py-1.5 text-xs bg-stone-100 border border-stone-200 rounded-lg text-stone-500 hover:bg-stone-200 transition-colors"
              >
                ✕ 关闭
              </button>
            )}
          </div>
        </div>
      </header>

      {/* History Panel */}
      {showHistory && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => setShowHistory(false)}>
          <div
            className="w-80 max-w-[85vw] bg-white/95 backdrop-blur-sm shadow-2xl border-l border-amber-200/50 overflow-y-auto animate-slide-down"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-amber-200/50 px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-stone-700">📜 问答历史</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleClearHistory}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  清空
                </button>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2">
              {history.map((record) => (
                <button
                  key={record.id}
                  onClick={() => handleHistoryClick(record)}
                  className="w-full text-left p-3 bg-stone-50 rounded-xl border border-stone-100 hover:border-amber-300 hover:bg-amber-50/50 transition-all group"
                >
                  <p className="text-sm text-stone-700 line-clamp-2 group-hover:text-stone-900">
                    {record.question}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">{formatTime(record.timestamp)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="relative max-w-3xl mx-auto px-4 py-6">
        {/* Daily Quote */}
        {!currentAnswer && !loading && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 text-6xl opacity-10">✦</div>
              <p className="text-[11px] text-amber-600 font-medium uppercase tracking-wider mb-2">
                ☀ 今日一句
              </p>
              <p className="text-stone-700 italic leading-relaxed text-sm">
                "{dailyQuote}"
              </p>
            </div>
          </div>
        )}

        {!currentAnswer && !loading && (
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full mb-4 shadow-inner">
              <span className="text-4xl">☯</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-800 mb-2">
              有什么困惑，想问问易命先生？
            </h2>
            <p className="text-stone-500 text-sm max-w-md mx-auto">
              写下你的问题，《易命之书》52条人生法则将为你解读
            </p>
          </div>
        )}

        {/* Question Input */}
        <section className={`${currentAnswer || loading ? "mb-6" : "mb-10"} animate-fade-in-up delay-100`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="描述你的困惑，越具体越好..."
                className="w-full h-28 px-5 py-4 border-2 border-amber-200/60 rounded-2xl bg-white/80 backdrop-blur-sm 
                           focus:outline-none focus:ring-0 focus:border-amber-400
                           text-stone-700 placeholder-stone-400 resize-none text-base leading-relaxed
                           transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={loading}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) {
                    handleSubmit(e);
                  }
                }}
              />
              <div className="absolute bottom-3 right-4 text-[11px] text-stone-400">
                {question.length > 0 && `${question.length}字`}
                <span className="ml-2 text-amber-400 hidden sm:inline">⌘ + Enter 发送</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-600 to-orange-600 
                         text-white font-medium rounded-xl shadow-lg shadow-amber-200/40
                         hover:from-amber-700 hover:to-orange-700 hover:shadow-xl hover:-translate-y-0.5
                         active:translate-y-0 active:shadow-md
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg
                         transition-all duration-200 text-base flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  易命先生正在思考...
                </>
              ) : (
                <>
                  <span className="text-lg">🔮</span>
                  求问易命
                </>
              )}
            </button>
          </form>

          {/* Example Questions */}
          <div className="mt-6">
            <p className="text-xs text-stone-400 mb-3 text-center">💡 试试这些问题，或直接输入你的困惑</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleExampleClick(q.text)}
                  disabled={loading}
                  className="px-3.5 py-2 text-xs bg-white/70 border border-amber-200/60 rounded-xl 
                             text-stone-600 hover:bg-amber-50 hover:border-amber-300 hover:text-stone-800
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  <span>{q.icon}</span>
                  <span className="truncate max-w-[160px]">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50/80 border border-red-200 rounded-xl text-red-700 text-sm animate-fade-in-up">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading && (
          <div className="mb-8 space-y-4 animate-fade-in">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-amber-200/50 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-xl">☯</span>
                <span className="font-semibold text-stone-600">易命先生正在思考...</span>
              </div>
              <div className="space-y-3">
                {[3, 4, 5, 3].map((w, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="h-4 bg-amber-100/80 rounded animate-pulse" style={{ width: `${w * 10}%` }} />
                  </div>
                ))}
              </div>
              <div className="pt-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Answer Section */}
        {currentAnswer && !loading && (
          <div ref={resultRef} className="space-y-6 animate-fade-in-up">
            {/* Question Summary */}
            <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-stone-200/50 px-4 py-3">
              <p className="text-xs text-stone-400">你的问题</p>
              <p className="text-sm text-stone-700 mt-0.5">{currentAnswer.question}</p>
            </div>

            {/* Answer Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-200/60 shadow-lg shadow-amber-100/30 overflow-hidden">
              <div className="bg-gradient-to-r from-amber-50 via-orange-50/50 to-amber-50 px-6 py-4 border-b border-amber-200/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <span className="text-white text-lg">☯</span>
                  </div>
                  <div>
                    <span className="font-semibold text-stone-700">易命先生的回答</span>
                    <p className="text-[11px] text-stone-400">
                      基于 {currentAnswer.rules.length} 条法则分析
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 prose prose-stone max-w-none">
                <div className="text-stone-700 leading-loose whitespace-pre-line text-[15px]">
                  {currentAnswer.answer}
                </div>
              </div>
              <div className="px-6 pb-4">
                <div className="flex items-center gap-2 pt-3 border-t border-amber-100/50">
                  <span className="text-xs text-stone-400">⏱ {formatTime(currentAnswer.timestamp)}</span>
                </div>
              </div>
            </div>

            {/* Rules Reference */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-amber-200/40 p-6">
              <h3 className="text-sm font-semibold text-stone-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <span>📜</span>
                参考法则
              </h3>
              <div className="space-y-3">
                {currentAnswer.rules.map((rule, index) => (
                  <div
                    key={rule.id}
                    className="p-4 bg-gradient-to-r from-amber-50/60 to-orange-50/30 rounded-xl border border-amber-100/80 hover:border-amber-300/60 transition-all duration-200 hover:shadow-sm"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-500 
                                       text-white text-sm font-bold rounded-full flex items-center justify-center shadow-sm">
                        {rule.id}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-medium text-stone-700">
                            第{rule.id}术 · {rule.title}
                          </span>
                          {getCategoryBadge(rule.category)}
                        </div>
                        <p className="text-sm text-stone-600 leading-relaxed">{rule.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="text-center py-4">
              <p className="text-xs text-stone-400 leading-relaxed">
                ☯ 易命之书 · 52条人生法则<br />
                <span className="text-stone-300">仅供参考，人生路靠自己走</span>
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!currentAnswer && !loading && (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-5xl mb-3 opacity-20">☯</div>
            <p className="text-stone-400 text-sm leading-relaxed">
              在上方输入你的困惑<br />
              《易命之书》将为你解读
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative text-center py-6 text-xs text-stone-300">
        <p>易命之书问答产品 · Web MVP</p>
      </footer>
    </div>
  );
}
