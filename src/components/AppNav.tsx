"use client";

import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Rank Map" },
  { href: "/posts", label: "Posts" },
  { href: "/reviews", label: "Reviews" },
  { href: "/heatmap", label: "Deep Scan" },
];

export default function AppNav({ businessName }: { businessName?: string }) {
  const pathname = usePathname();

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
      <div className="mx-auto max-w-5xl px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-5">
          <a href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">GBP Auto</span>
          </a>
          <div className="flex items-center gap-0.5 text-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-2.5 py-1.5 rounded-md transition-colors text-sm ${
                    isActive
                      ? "text-white font-medium"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {businessName && (
            <span className="text-xs text-slate-500 hidden sm:inline">{businessName}</span>
          )}
          <a href="/api/auth/logout" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
            Sign out
          </a>
        </div>
      </div>
    </nav>
  );
}
