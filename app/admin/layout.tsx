/**
 * Admin panel — shared layout with sidebar navigation.
 * Excluded from /admin/login by nested layout.
 */

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getAdminToken, clearAdminToken } from "@/lib/admin-client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Login page bypass
    if (pathname === "/admin/login") return;
    const token = getAdminToken();
    if (!token) router.replace("/admin/login");
  }, [pathname, router]);

  // Login page renders without sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (!mounted) return null;

  const navItems = [
    { href: "/admin", label: "概览" },
    { href: "/admin/users", label: "用户" },
    { href: "/admin/history", label: "问答记录" },
  ];

  const handleLogout = () => {
    clearAdminToken();
    router.replace("/admin/login");
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex">
      <aside className="w-56 bg-white border-r border-neutral-200 flex flex-col">
        <div className="px-6 py-6 border-b border-neutral-200">
          <div className="text-lg font-semibold">易命之书</div>
          <div className="text-xs text-neutral-500 mt-1">管理后台</div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((it) => {
            const active = pathname === it.href;
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`block px-3 py-2 rounded-md text-sm ${
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-neutral-200">
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 rounded-md text-sm text-neutral-600 hover:bg-neutral-100"
          >
            退出登录
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
