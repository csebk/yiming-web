"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("两次输入的密码不一致");
        setLoading(false);
        return;
      }
      const result = await register(username, password, email || undefined);
      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "注册失败");
      }
    } else {
      const result = await login(username, password);
      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "登录失败");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pattern px-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-amber-200/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-orange-200/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl border border-amber-200/60 shadow-xl p-8 w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-6">
          <span className="text-3xl">☯</span>
          <h1 className="text-xl font-bold text-stone-800 mt-2">
            {mode === "login" ? "登录易命之书" : "注册易命之书"}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            {mode === "login" ? "登录后历史记录云端同步" : "创建账号，开启你的易命之旅"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-4 py-2.5 border border-amber-200/60 rounded-xl bg-white/80 focus:outline-none focus:border-amber-400 text-stone-700"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-2.5 border border-amber-200/60 rounded-xl bg-white/80 focus:outline-none focus:border-amber-400 text-stone-700"
              required
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {mode === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">邮箱（可选）</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="用于找回密码"
                  className="w-full px-4 py-2.5 border border-amber-200/60 rounded-xl bg-white/80 focus:outline-none focus:border-amber-400 text-stone-700"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full px-4 py-2.5 border border-amber-200/60 rounded-xl bg-white/80 focus:outline-none focus:border-amber-400 text-stone-700"
                  required
                  autoComplete="new-password"
                />
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium rounded-xl shadow-lg hover:from-amber-700 hover:to-orange-700 disabled:opacity-50 transition-all"
          >
            {loading ? "处理中..." : mode === "login" ? "登录" : "注册"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="text-sm text-amber-600 hover:text-amber-700"
          >
            {mode === "login" ? "还没有账号？立即注册" : "已有账号？返回登录"}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-xs text-stone-400 hover:text-stone-600"
          >
            ← 返回问答首页
          </button>
        </div>
      </div>
    </div>
  );
}
