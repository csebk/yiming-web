"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAdminToken } from "@/lib/admin-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        setAdminToken(data.token);
        router.replace("/admin");
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-semibold text-neutral-900">易命之书</div>
          <div className="text-sm text-neutral-500 mt-2">管理后台</div>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-neutral-200 p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-neutral-900"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:border-neutral-900"
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-2 rounded-md text-sm hover:bg-neutral-800 disabled:opacity-50"
          >
            {loading ? "登录中..." : "登 录"}
          </button>
        </form>
      </div>
    </div>
  );
}
