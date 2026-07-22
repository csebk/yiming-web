"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

interface Dimension {
  category: string;
  rules: string[];
  analysis: string;
}

interface Actions {
  immediate: string[];
  medium: string[];
  long_term: string[];
}

interface ReportData {
  conclusion: string;
  dimensions: Dimension[];
  conflicts: string;
  actions: Actions;
  quote: string;
  matched_rules?: Array<{ title: string; category: string; knowledgeBase?: string }>;
}

const DIMENSION_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  "修身": { bg: "bg-emerald-50/80", border: "border-emerald-200", text: "text-emerald-700", icon: "🧘" },
  "财富": { bg: "bg-amber-50/80", border: "border-amber-200", text: "text-amber-700", icon: "💰" },
  "人际": { bg: "bg-blue-50/80", border: "border-blue-200", text: "text-blue-700", icon: "🤝" },
  "心态": { bg: "bg-purple-50/80", border: "border-purple-200", text: "text-purple-700", icon: "💭" },
  "运势": { bg: "bg-rose-50/80", border: "border-rose-200", text: "text-rose-700", icon: "⭐" },
};

function getDimStyle(category: string) {
  return DIMENSION_COLORS[category] || { bg: "bg-stone-50/80", border: "border-stone-200", text: "text-stone-700", icon: "📋" };
}

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [report, setReport] = useState<ReportData | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeDim, setActiveDim] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    fetchReport();
  }, [user, authLoading]);

  async function fetchReport() {
    try {
      const res = await fetch(`/api/deep-analysis/report/${params.id}`);
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "获取报告失败");
        return;
      }
      setMeta({
        id: data.report.id,
        type: data.report.type,
        question: data.report.question,
        created_at: data.report.created_at,
      });
      setReport(data.report.data);
    } catch (e: any) {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-pulse">☯</div>
          <p className="text-stone-400 text-sm">加载报告...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-4xl">😔</div>
          <p className="text-stone-500 text-sm">{error}</p>
          <button
            onClick={() => router.push("/pricing")}
            className="text-amber-600 text-sm underline hover:text-amber-700"
          >
            返回定价页
          </button>
        </div>
      </div>
    );
  }

  if (!report || !meta) return null;

  const typeLabels: Record<string, string> = {
    deep_analysis: "单次深度分析",
    monthly_report: "月度运势报告",
    yearly_plan: "年度人生规划",
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark border-b border-amber-200/30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push("/pricing")}
            className="flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">返回</span>
          </button>
          <span className="text-sm text-stone-400 font-medium">深度分析报告</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Report Header */}
        <div className="text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-amber-100/60 text-amber-700 text-xs font-medium px-3 py-1 rounded-full mb-3">
            <span>☯</span>
            {typeLabels[meta.type] || "深度分析"}
          </div>
          <h1 className="text-2xl font-bold text-stone-800">
            易命深度分析报告
          </h1>
          <p className="text-xs text-stone-400 mt-2">
            生成时间：{new Date(meta.created_at).toLocaleString("zh-CN")}
          </p>
        </div>

        {/* Question */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-stone-200/50 px-5 py-4 animate-fade-in-up">
          <p className="text-xs text-stone-400 mb-1">你的问题</p>
          <p className="text-sm text-stone-700 leading-relaxed">{meta.question}</p>
        </div>

        {/* Core Conclusion */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl border border-amber-200/60 p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔮</span>
            <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
              核心结论
            </h2>
          </div>
          <p className="text-stone-700 leading-relaxed text-[15px]">{report.conclusion}</p>
        </div>

        {/* Multi-dimensional Analysis */}
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <span className="text-lg">📊</span>
            <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
              多维分析
            </h2>
          </div>

          {/* Dimension tabs */}
          <div className="flex flex-wrap gap-2">
            {report.dimensions.map((dim, i) => {
              const style = getDimStyle(dim.category);
              return (
                <button
                  key={i}
                  onClick={() => setActiveDim(i)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    activeDim === i
                      ? `${style.bg} ${style.border} ${style.text} shadow-sm`
                      : "bg-white/60 border-stone-200 text-stone-500 hover:border-stone-300"
                  }`}
                >
                  {style.icon} {dim.category}
                </button>
              );
            })}
          </div>

          {/* Active dimension */}
          {report.dimensions[activeDim] && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{getDimStyle(report.dimensions[activeDim].category).icon}</span>
                <h3 className="text-base font-semibold text-stone-700">
                  {report.dimensions[activeDim].category}
                </h3>
              </div>
              {report.dimensions[activeDim].rules.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {report.dimensions[activeDim].rules.map((rule, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200/50"
                    >
                      📜 {rule}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-stone-600 leading-relaxed">
                {report.dimensions[activeDim].analysis}
              </p>
            </div>
          )}
        </div>

        {/* Key Conflicts */}
        {report.conflicts && (
          <div className="bg-gradient-to-br from-rose-50 to-orange-50/30 rounded-2xl border border-rose-200/50 p-6 animate-fade-in-up">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⚖️</span>
              <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                关键矛盾
              </h2>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{report.conflicts}</p>
          </div>
        )}

        {/* Action Suggestions */}
        {report.actions && (
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🎯</span>
              <h2 className="text-sm font-bold text-stone-700 uppercase tracking-wider">
                行动建议
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { key: "immediate", label: "立即行动", sub: "本周内", color: "from-amber-600 to-orange-500" },
                { key: "medium", label: "中期规划", sub: "1-3个月", color: "from-violet-500 to-purple-500" },
                { key: "long_term", label: "长期方向", sub: "3-12个月", color: "from-rose-500 to-pink-500" },
              ].map((section) => {
                const items = (report.actions as any)[section.key] as string[];
                if (!items || items.length === 0) return null;
                return (
                  <div
                    key={section.key}
                    className="bg-white/80 backdrop-blur-sm rounded-xl border border-stone-200 p-4"
                  >
                    <div className={`inline-block bg-gradient-to-r ${section.color} text-white text-[10px] font-bold px-2 py-0.5 rounded-full mb-2`}>
                      {section.sub}
                    </div>
                    <h3 className="text-sm font-semibold text-stone-700 mb-2">{section.label}</h3>
                    <ul className="space-y-1.5">
                      {items.map((item, i) => (
                        <li key={i} className="text-xs text-stone-600 flex items-start gap-1.5">
                          <span className="text-amber-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quote */}
        {report.quote && (
          <div className="bg-gradient-to-br from-stone-50 to-amber-50/30 rounded-2xl border border-stone-200 p-6 text-center animate-fade-in-up">
            <div className="text-2xl mb-2">💌</div>
            <p className="text-stone-600 italic text-sm leading-relaxed max-w-md mx-auto">
              "{report.quote}"
            </p>
            <p className="text-xs text-stone-400 mt-3">— 易命之书寄语</p>
          </div>
        )}

        {/* Matched rules summary */}
        {report.matched_rules && report.matched_rules.length > 0 && (
          <details className="animate-fade-in-up">
            <summary className="text-xs text-stone-400 cursor-pointer hover:text-stone-600 transition-colors">
              本次分析参考了 {report.matched_rules.length} 条法则
            </summary>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {report.matched_rules.map((r, i) => (
                <span
                  key={i}
                  className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full"
                >
                  {r.category} · {r.title}
                </span>
              ))}
            </div>
          </details>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-stone-400 leading-relaxed">
            ☯ 易命之书 · 深度分析<br />
            <span className="text-stone-300">仅供参考，人生路靠自己走</span>
          </p>
        </div>
      </main>
    </div>
  );
}