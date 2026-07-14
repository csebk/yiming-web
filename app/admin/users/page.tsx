"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, formatTime } from "@/lib/admin-client";

type UserRow = {
  id: string;
  username: string;
  email: string | null;
  created_at: string;
  history_count: number;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [inputSearch, setInputSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 20;

  const load = async () => {
    setLoading(true);
    const q = new URLSearchParams({ page: String(page), limit: String(limit), search });
    const data = await adminFetch(`/api/admin/users?${q}`);
    if (data.success) {
      setUsers(data.users || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, search]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">用户</h1>
          <p className="text-sm text-neutral-500 mt-1">共 {total} 个用户</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); setSearch(inputSearch); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
            placeholder="搜索用户名/邮箱"
            className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-neutral-900"
          />
          <button className="px-4 py-2 bg-neutral-900 text-white rounded-md text-sm">搜索</button>
        </form>
      </div>

      <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-neutral-700">用户名</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-700">邮箱</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-700">提问数</th>
              <th className="text-left px-4 py-3 font-medium text-neutral-700">注册时间</th>
              <th className="text-right px-4 py-3 font-medium text-neutral-700">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8 text-neutral-400">加载中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-neutral-400">暂无用户</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-3 text-neutral-900">{u.username}</td>
                  <td className="px-4 py-3 text-neutral-600">{u.email || "-"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{u.history_count}</td>
                  <td className="px-4 py-3 text-neutral-600 tabular-nums">{formatTime(u.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/users/${u.id}`} className="text-neutral-900 hover:underline">详情</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
