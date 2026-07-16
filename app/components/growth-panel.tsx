/**
 * 个人成长记录 — 前端组件
 * 功能：每日打卡（心情+日记）、日历视图、连续天数统计
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";

interface GrowthRecord {
  id: string;
  date: string;
  mood: number;
  content: string;
  tags: string[];
}

const MOOD_LABELS: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "😢", label: "很差", color: "bg-red-100 text-red-600 border-red-200" },
  2: { emoji: "😔", label: "不太好", color: "bg-orange-100 text-orange-600 border-orange-200" },
  3: { emoji: "😐", label: "一般", color: "bg-yellow-100 text-yellow-600 border-yellow-200" },
  4: { emoji: "🙂", label: "不错", color: "bg-lime-100 text-lime-600 border-lime-200" },
  5: { emoji: "😊", label: "很好", color: "bg-green-100 text-green-600 border-green-200" },
};

const MOOD_OPTIONS = [
  { value: 5, emoji: "😊", label: "很好" },
  { value: 4, emoji: "🙂", label: "不错" },
  { value: 3, emoji: "😐", label: "一般" },
  { value: 2, emoji: "😔", label: "不太好" },
  { value: 1, emoji: "😢", label: "很差" },
];

const COMMON_TAGS = ["工作", "学习", "家庭", "健康", "社交", "理财", "成长", "休息"];

export default function GrowthPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [records, setRecords] = useState<GrowthRecord[]>([]);
  const [streak, setStreak] = useState(0);
  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadRecords = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/growth/month?year=${currentYear}&month=${currentMonth}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setStreak(data.streak || 0);
        const today = new Date().toISOString().slice(0, 10);
        setTodayCheckedIn(data.records?.some((r: GrowthRecord) => r.date === today) || false);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user, currentYear, currentMonth]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleCheckin = async () => {
    if (!user) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/growth/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood: selectedMood, content: content.trim(), tags: selectedTags }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "🎉 打卡成功！" });
        setContent("");
        setSelectedTags([]);
        loadRecords();
      } else {
        setMessage({ type: "error", text: data.error || "打卡失败" });
      }
    } catch {
      setMessage({ type: "error", text: "网络错误" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Build calendar grid
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const recordByDate = new Map(records.map(r => [r.date, r]));

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div
        className="w-[480px] max-w-[90vw] bg-white/95 backdrop-blur-sm shadow-2xl border-l border-amber-200/50 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-amber-200/50 px-5 py-4 flex items-center justify-between z-10">
          <h2 className="font-semibold text-stone-700 flex items-center gap-2">
            🌱 个人成长记录
            {streak > 0 && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                🔥 连续 {streak} 天
              </span>
            )}
          </h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg">✕</button>
        </div>

        <div className="p-5 space-y-6">
          {/* Check-in Form */}
          {!todayCheckedIn && user ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200/60 p-5 space-y-4">
              <h3 className="text-sm font-medium text-stone-700">📝 今日打卡</h3>

              {/* Mood Selector */}
              <div>
                <p className="text-xs text-stone-500 mb-2">今天心情怎么样？</p>
                <div className="flex gap-2">
                  {MOOD_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSelectedMood(opt.value)}
                      className={`flex-1 py-2 rounded-lg text-center text-sm transition-all ${
                        selectedMood === opt.value
                          ? `${MOOD_LABELS[opt.value].color} border-2 shadow-sm scale-105`
                          : "bg-white border border-stone-200 text-stone-500 hover:border-amber-300"
                      }`}
                    >
                      <div className="text-lg">{opt.emoji}</div>
                      <div className="text-[10px] mt-0.5">{opt.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="记录今天的感悟、收获或反思..."
                  rows={3}
                  className="w-full px-3 py-2 border border-amber-200/60 rounded-lg text-sm text-stone-700 placeholder-stone-400 resize-none focus:outline-none focus:border-amber-400 bg-white/80"
                />
              </div>

              {/* Tags */}
              <div>
                <p className="text-xs text-stone-500 mb-2">标签（可选）</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                        selectedTags.includes(tag)
                          ? "bg-amber-100 border-amber-300 text-amber-700"
                          : "bg-white border-stone-200 text-stone-500 hover:border-amber-200"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCheckin}
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition-all"
              >
                {submitting ? "提交中..." : "✅ 完成今日打卡"}
              </button>

              {message && (
                <p className={`text-xs text-center ${message.type === "success" ? "text-green-600" : "text-red-500"}`}>
                  {message.text}
                </p>
              )}
            </div>
          ) : todayCheckedIn && user ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/60 p-5 text-center">
              <p className="text-lg mb-1">✅</p>
              <p className="text-sm font-medium text-green-700">今日已打卡</p>
              <p className="text-xs text-green-500 mt-1">继续保持！</p>
            </div>
          ) : (
            <div className="bg-amber-50 rounded-xl border border-amber-200/60 p-5 text-center">
              <p className="text-sm text-stone-500">
                <a href="/auth" className="text-amber-600 underline hover:text-amber-800">登录</a>后即可每日打卡
              </p>
            </div>
          )}

          {/* Calendar View */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <button onClick={prevMonth} className="text-stone-400 hover:text-stone-600 px-2">‹</button>
              <h3 className="text-sm font-medium text-stone-700">
                {currentYear}年{currentMonth}月
              </h3>
              <button onClick={nextMonth} className="text-stone-400 hover:text-stone-600 px-2">›</button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-sm text-stone-400">加载中...</div>
            ) : (
              <>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {["日", "一", "二", "三", "四", "五", "六"].map((d, i) => (
                    <div key={i} className="text-center text-[10px] text-stone-400 font-medium py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, i) => {
                    if (day === null) return <div key={`empty-${i}`} />;
                    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const record = recordByDate.get(dateStr);
                    const isToday = dateStr === new Date().toISOString().slice(0, 10);

                    return (
                      <div
                        key={dateStr}
                        className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative ${
                          isToday ? "ring-2 ring-amber-400 ring-offset-1" : ""
                        } ${
                          record
                            ? `border ${MOOD_LABELS[record.mood]?.color || "border-stone-200"}`
                            : "border border-stone-100"
                        }`}
                      >
                        <span className={`font-medium ${isToday ? "text-amber-700" : "text-stone-600"}`}>
                          {day}
                        </span>
                        {record && (
                          <span className="text-[16px] leading-none mt-0.5">
                            {MOOD_LABELS[record.mood]?.emoji || "✅"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Recent Records */}
          {records.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-700 mb-3">📋 本月记录</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {[...records].reverse().slice(0, 20).map((rec) => (
                  <div key={rec.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-stone-400">{rec.date}</span>
                      <span className="text-sm">
                        {MOOD_LABELS[rec.mood]?.emoji} {MOOD_LABELS[rec.mood]?.label}
                      </span>
                    </div>
                    {rec.content && (
                      <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">{rec.content}</p>
                    )}
                    {rec.tags && rec.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5">
                        {rec.tags.map((tag) => (
                          <span key={tag} className="text-[10px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}