"use client";

import { useEffect, useState } from "react";
import { adminFetch, formatTime } from "@/lib/admin-client";

type HistoryRow = {
  id: string;
  user_id: string;
  username: string;
  question: string;
  answer: string;
  timestamp: string;
};

export default function AdminHistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [inputQ, setInputQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const limit = 20;

  const load = async () => {
    setLoading(true);
    const sp = new URLSearchParams({ page: String(page), limit: String(limit), q });
    const data = await adminFetch(`/api/admin/history?${sp}`);
    if (data.success) {
      setRows(data.history || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, q]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">问答记录</h1>
          <p className="text-sm text-neutral-500 mt-1">共 {total} 条</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); setQ(inputQ); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputQ}
            onChange={(e) => setInputQ(e.target.value)}
            placeholder="搜索问题/回答内容"
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-neutral-900 w-64"
          />
          <button className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm">搜索</button>
        </form>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
        {loading ? (
          <div className="text-center py-8 text-neutral-400">加载中...</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-8 text-neutral-400">暂无记录</div>
        ) : (
          rows.map((h) => (
            <div key={h.id} className="p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded">
                      @{h.username || "unknown"}
                    </span>
                    <span className="text-xs text-neutral-400 tabular-nums">{formatTime(h.timestamp)}</span>
                  </div>
                  <div className="text-sm font-medium text-neutral-900">{h.question}</div>
                </div>
                <button
                  onClick={() => setExpanded({ ...expanded, [h.id]: !expanded[h.id] })}
                  className="text-xs text-neutral-600 hover:text-neutral-900 whitespace-nowrap"
                >
                  {expanded[h.id] ? "收起" : "展开"}
                </button>
              </div>
              {expanded[h.id] && (
                <div className="mt-3 pt-3 border-t border-neutral-100 text-sm text-neutral-700 whitespace-pre-wrap">
                  {h.answer}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center text-sm">
          <div className="text-neutral-500">第 {page} / {totalPages} 页</div>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-40">上一页</button>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-40">下一页</button>
          </div>
        </div>
      )}
    </div>
  );
}
