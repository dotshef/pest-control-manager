"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  FileText,
  Users,
  Settings,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "대시보드", icon: <LayoutDashboard size={20} /> },
  { href: "/calendar", label: "캘린더", icon: <Calendar size={20} /> },
  { href: "/clients", label: "고객 관리", icon: <Building2 size={20} /> },
  { href: "/certificates", label: "증명서", icon: <FileText size={20} /> },
  { href: "/members", label: "기사 관리", icon: <Users size={20} />, adminOnly: true },
  { href: "/settings", label: "설정", icon: <Settings size={20} /> },
];

export function Sidebar({ role }: { role: "admin" | "member" }) {
  const pathname = usePathname();

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || role === "admin"
  );

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-base-100 border-r border-base-300">
      {/* 로고 */}
      <div className="px-6 py-5 border-b border-base-300">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          방역매니저
        </Link>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {filteredItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-content"
                  : "text-base-content/70 hover:bg-base-200"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
