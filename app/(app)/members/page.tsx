"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useSession } from "@/components/providers/session-provider";

interface Member {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function MembersPage() {
  const { userId } = useSession();
  const [members, setMembers] = useState<Member[] | null>(null);

  const loading = !members;

  async function fetchMembers() {
    const res = await fetch("/api/members");
    const data = await res.json();
    setMembers(data.members || []);
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      const res = await fetch("/api/members");
      const data = await res.json();
      if (!ignore) {
        setMembers(data.members || []);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, []);

  async function handleToggleActive(member: Member) {
    if (member.id === userId) return;
    const action = member.is_active ? "비활성화" : "활성화";
    if (!confirm(`${member.name}님을 ${action}하시겠습니까?`)) return;

    if (member.is_active) {
      await fetch(`/api/members/${member.id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: true }),
      });
    }
    fetchMembers();
  }

  const badgeBase = "inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-medium";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold"></h2>
        <Link href="/members/new" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors cursor-pointer">
          <Plus size={16} />
          직원 등록
        </Link>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>이름</th>
              <th style={{ width: "22%" }}>이메일</th>
              <th style={{ width: "15%" }}>연락처</th>
              <th style={{ width: "10%" }}>역할</th>
              <th style={{ width: "10%" }}>상태</th>
              <th style={{ width: "13%" }}>등록일</th>
              <th style={{ width: "18%" }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                {Array.from({ length: 7 }).map((_, i) => (
                  <td key={i}><div className="h-4 bg-muted rounded animate-pulse" /></td>
                ))}
              </tr>
            ) : members?.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  등록된 멤버가 없습니다
                </td>
              </tr>
            ) : (
              members?.map((member) => (
                <tr key={member.id}>
                  <td className="font-medium">{member.name}</td>
                  <td className="text-base">{member.email}</td>
                  <td className="text-base">{member.phone || "-"}</td>
                  <td>
                    <span className={`${badgeBase} bg-muted text-foreground`}>
                      {member.role === "admin" ? "관리자" : "직원"}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`${badgeBase} ${
                        member.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {member.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td className="text-base">
                    {new Date(member.created_at).toLocaleDateString("ko-KR")}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <Link
                        href={`/members/${member.id}/edit`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        수정
                      </Link>
                      {member.id !== userId && (
                        <button
                          onClick={() => handleToggleActive(member)}
                          className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                            member.is_active ? "text-destructive hover:bg-destructive/10" : "text-success hover:bg-success/10"
                          }`}
                        >
                          {member.is_active ? "비활성화" : "활성화"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
