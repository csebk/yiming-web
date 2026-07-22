"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    type: "deep_analysis",
    name: "单次深度分析",
    price: "¥9.9",
    desc: "一次问题，5维度系统分析",
    features: [
      "全知识库多维度检索",
      "修身·财富·人际·心态·运势",
      "关键矛盾分析",
      "分阶段行动建议",
      "个性化人生寄语",
    ],
    badge: "尝鲜价",
    color: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50/60",
  },
  {
    type: "monthly_report",
    name: "月度运势报告",
    price: "¥29.9",
    desc: "每月一份运势全览",
    features: [
      "月度运势趋势分析",
      "当月关键节点提示",
      "综合运势评分",
      "行动建议汇总",
      "历史对比回顾",
    ],
    badge: "热销",
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50/60",
    popular: true,
  },
  {
    type: "yearly_plan",
    name: "年度人生规划",
    price: "¥99",
    desc: "全年深度规划与追踪",
    features: [
      "年度运势全景分析",
      "12个月分段规划",
      "重大决策窗口提示",
      "季度复盘报告",
      "专属顾问式建议",
    ],
    badge: "超值",
    color: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50/60",
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("deep_analysis");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "order" | "result">("select");
  const [orderResult, setOrderResult] = useState<any>(null);
  const [reportResult, setReportResult] = useState<any>(null);
  const [error, setError] = useState("");

  const selectedPlan = PLANS.find((p) => p.type === selectedType);

  async function handleCreateOrder() {
    if (!user) {
      router.push("/auth");
      return;
    }
    if (!question.trim() || question.trim().length < 2) {
      setError("请输入您的问题（至少2个字符）");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/deep-analysis/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedType, question: question.trim() }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "创建订单失败");
        setLoading(false);
        return;
      }
      setOrderResult(data.order);
      setStep("order");
    } catch (e: any) {
      setError("网络错误，请稍后重试");
    }
    setLoading(false);
  }

  async function handlePay() {
    if (!orderResult) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/deep-analysis/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderResult.id }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "支付失败");
        setLoading(false);
        return;
      }
      setReportResult(data.report);
      setStep("result");
    } catch (e: any) {
      setError("网络错误，请稍后重试");
    }
    setLoading(false);
  }

  function handleViewReport() {
    if (reportResult) {
      router.push(`/report/${reportResult.id}`);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-dark border-b border-amber-200/30">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-stone-600 hover:text-amber-700 transition-colors"
          >
            <span className="text-lg">☯</span>
            <span className="text-sm font-medium">易命之书</span>
          </button>
          <span className="text-sm text-stone-400 font-medium">深度分析</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8 text-sm">
          {[
            { key: "select", label: "选择方案" },
            { key: "order", label: "确认订单" },
            { key: "result", label: "获取报告" },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s.key
                    ? "bg-amber-500 text-white shadow-md"
                    : ["select", "order"].indexOf(step) >=
                      ["select", "order", "result"].indexOf(s.key)
                    ? "bg-amber-200 text-amber-800"
                    : "bg-stone-200 text-stone-400"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`hidden sm:inline ${
                  step === s.key ? "text-amber-700 font-medium" : "text-stone-400"
                }`}
              >
                {s.label}
              </span>
              {i < 2 && <span className="text-stone-300">—</span>}
            </div>
          ))}
        </div>

        {/* Step 1: Select plan */}
        {step === "select" && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-stone-800">
                易命深度分析
              </h1>
              <p className="text-stone-500 mt-1 text-sm">
                选择适合你的分析方案，获取《易命之书》的系统性人生报告
              </p>
            </div>

            {/* Plan cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map((plan) => {
                const isSelected = selectedType === plan.type;
                return (
                  <button
                    key={plan.type}
                    onClick={() => {
                      setSelectedType(plan.type);
                      setError("");
                    }}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-amber-500 bg-white shadow-lg shadow-amber-100/50"
                        : "border-stone-200 bg-white/70 hover:border-amber-300 hover:shadow-md"
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-sm">
                        {plan.badge}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${plan.color}`}
                      />
                      <span className="text-sm font-semibold text-stone-700">
                        {plan.name}
                      </span>
                      {!plan.popular && (
                        <span className="text-[10px] text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                          {plan.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-stone-800 mb-3">
                      {plan.price}
                    </div>
                    <p className="text-xs text-stone-400 mb-3">{plan.desc}</p>
                    <ul className="space-y-1.5">
                      {plan.features.map((f, i) => (
                        <li
                          key={i}
                          className="text-xs text-stone-500 flex items-start gap-1.5"
                        >
                          <span className="text-amber-400 mt-0.5">✓</span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Question input */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-6">
              <label className="block text-sm font-medium text-stone-700 mb-2">
                输入您的问题（困惑、抉择、焦虑...）
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例：最近工作压力很大，经常失眠，不知道该怎么调整..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white/80
                  text-stone-700 text-sm placeholder:text-stone-300
                  focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-300
                  transition-all resize-none"
              />
              {error && (
                <p className="text-red-500 text-xs mt-2">{error}</p>
              )}
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="mt-4 w-full py-3 bg-gradient-to-r from-amber-600 to-orange-500
                  text-white rounded-xl font-medium text-sm shadow-lg shadow-amber-200/50
                  hover:shadow-xl hover:shadow-amber-200/60 hover:from-amber-500 hover:to-orange-400
                  active:scale-[0.98] transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "正在创建订单..." : !user ? "请先登录" : `立即获取 — ${selectedPlan?.price}`}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirm order */}
        {step === "order" && orderResult && (
          <div className="max-w-md mx-auto space-y-6 animate-fade-in-up">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-stone-200 p-6">
              <h2 className="text-lg font-bold text-stone-800 mb-4">确认订单</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">报告类型</span>
                  <span className="text-stone-700 font-medium">
                    {selectedPlan?.name}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">问题</span>
                  <span className="text-stone-700 text-right max-w-[200px] truncate">
                    {orderResult.question}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">金额</span>
                  <span className="text-amber-700 font-bold text-lg">
                    ¥{orderResult.price}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-stone-500">状态</span>
                  <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                    待支付
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-xs text-center">{error}</p>
            )}

            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-500
                text-white rounded-xl font-medium text-sm shadow-lg shadow-amber-200/50
                hover:shadow-xl hover:shadow-amber-200/60 hover:from-amber-500 hover:to-orange-400
                active:scale-[0.98] transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "正在支付..." : `确认支付 ¥${orderResult.price}`}
            </button>
            <p className="text-center text-[11px] text-stone-400">
              ⚡ MVP阶段使用Mock支付，无需真实扣款
            </p>
          </div>
        )}

        {/* Step 3: Result */}
        {step === "result" && reportResult && (
          <div className="max-w-md mx-auto text-center space-y-6 animate-fade-in-up">
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 rounded-2xl border border-amber-200/50 p-8">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-bold text-stone-800 mb-2">
                报告已生成！
              </h2>
              <p className="text-sm text-stone-500">
                您的深度分析报告已准备就绪，点击下方按钮查看
              </p>
            </div>

            <button
              onClick={handleViewReport}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-500
                text-white rounded-xl font-medium text-sm shadow-lg shadow-amber-200/50
                hover:shadow-xl hover:shadow-amber-200/60 hover:from-amber-500 hover:to-orange-400
                active:scale-[0.98] transition-all duration-200"
            >
              查看报告
            </button>
          </div>
        )}
      </main>
    </div>
  );
}