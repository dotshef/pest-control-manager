"use client";

import { usePathname, useRouter } from "next/navigation";
import type { JwtPayload } from "@/lib/auth/jwt";

const pageTitles: Record<string, string> = {
  "/dashboard": "대시보드",
  "/calendar": "캘린더",
  "/clients": "고객 관리",
  "/certificates": "증명서",
  "/members": "기사 관리",
  "/settings": "설정",
};

export function Header({ session }: { session: JwtPayload }) {
  const pathname = usePathname();
  const router = useRouter();

  const title =
    Object.entries(pageTitles).find(([path]) =>
      pathname.startsWith(path)
    )?.[1] ?? "";

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-base-100 border-b border-base-300">
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="flex items-center gap-4">
        {session.role === "admin" && (
          <span className="badge badge-primary badge-sm">관리자</span>
        )}
        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-sm gap-2"
          >
            <span className="text-sm">{session.email}</span>
          </div>
          <ul
            tabIndex={0}
            className="dropdown-content menu bg-base-100 rounded-box z-10 w-40 p-2 shadow"
          >
            <li>
              <button onClick={handleLogout}>로그아웃</button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}
