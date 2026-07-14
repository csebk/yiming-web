"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { adminFetch, formatTime } from "@/lib/admin-client";

type HistoryItem = {
  id: string;
  question: string;
  answer: string;
  timestamp: string;
};

type User = {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
};

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      const data = await adminFetch(`/api/admin/users/${params.id}`);
      if (data.success) {
        setUser(data.user);
        setHistory(data.history || []);
      }
      setLoading(false);
    })();
  }, [params?.id]);

  if (loading) return <div className="text-neutral-500">加载中...</div>;
  if (!user) return <div className="text-red-600">用户不存在</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/users" className="text-sm text-neutral-500 hover:underline">← 返回用户列表</Link>
        <h1 className="text-2xl font-semibold mt-2">{user.username}</h1>
        <p className="text-sm text-neutral-500 mt-1">
          {user.email || "无邮箱"} · 注册于 {formatTime(user.created_at)} · 共 {history.length} 条记录
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg divide-y divide-neutral-100">
        {history.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">该用户尚未提问</div>
        ) : (
          history.map((h) => (
            <div key={h.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-900 mb-1">{h.question}</div>
                  <div className="text-xs text-neutral-400 tabular-nums">{formatTime(h.timestamp)}</div>
                </div>
                <button
                  onClick={() => setExpanded({ ...expanded, [h.id]: !expanded[h.id] })}
                  className="text-xs text-neutral-600 hover:text-neutral-900"
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
    </div>
  );
}
