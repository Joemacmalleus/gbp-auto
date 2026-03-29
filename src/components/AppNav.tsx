"use client";

import { usePathname } from "next/navigation";

interface AppNavProps {
  businessName?: string;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/posts", label: "Posts" },
  { href: "/reviews", label: "Reviews" },
];

export default function AppNav({ businessName }: AppNavProps) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="mx-auto max-w-7xl px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-xs">G</span>
            </div>
            <span className="font-semibold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent">GBP Auto</span>
          </a>
          <div className="flex items-center gap-1 text-sm">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md transition ${
                    isActive
                      ? "bg-gray-100 text-gray-900 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
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
            <span className="text-sm text-gray-500 hidden sm:inline">{businessName}</span>
          )}
          <a
            href="/api/auth/logout"
            className="text-sm text-gray-400 hover:text-gray-600 transition"
          >
            Sign out
          </a>
        </div>
      </div>
    </nav>
  );
}
