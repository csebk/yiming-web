"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Stats = {
  user_count: number;
  history_count: number;
  users_last_24h: number;
  history_last_24h: number;
  history_last_7d: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<{ date: string; count: number }[]>([]);
  const [topRules, setTopRules] = useState<{ rule: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await adminFetch("/api/admin/stats");
      if (data.success) {
        setStats(data.stats);
        setTrend(data.trend || []);
        setTopRules(data.top_rules || []);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-neutral-500">加载中...</div>;
  if (!stats) return <div className="text-red-600">数据加载失败</div>;

  const kpis = [
    { label: "用户总数", value: stats.user_count },
    { label: "累计问答", value: stats.history_count },
    { label: "24小时新增用户", value: stats.users_last_24h },
    { label: "24小时提问数", value: stats.history_last_24h },
    { label: "7日提问数", value: stats.history_last_7d },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">概览</h1>
        <p className="text-sm text-neutral-500 mt-1">易命之书运营数据</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white border border-neutral-200 rounded-lg p-5">
            <div className="text-xs text-neutral-500">{k.label}</div>
            <div className="text-3xl font-semibold mt-2 text-neutral-900">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="text-sm font-medium text-neutral-900 mb-4">最近30天提问趋势</div>
        {trend.length === 0 ? (
          <div className="text-sm text-neutral-400 py-8 text-center">暂无数据</div>
        ) : (
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#171717" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg p-6">
        <div className="text-sm font-medium text-neutral-900 mb-4">Top 10 命中规则</div>
        {topRules.length === 0 ? (
          <div className="text-sm text-neutral-400 py-8 text-center">暂无数据</div>
        ) : (
          <div className="space-y-2">
            {topRules.map((r, i) => {
              const max = topRules[0].count || 1;
              const pct = (r.count / max) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 text-xs text-neutral-400 tabular-nums">{i + 1}</div>
                  <div className="flex-1">
                    <div className="text-sm text-neutral-800 mb-1 truncate">{r.rule}</div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="w-10 text-right text-sm tabular-nums text-neutral-600">{r.count}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
