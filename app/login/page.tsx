"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarCheck, FileText, ClipboardList } from "lucide-react";
import { FormField } from "@/components/ui/form-field";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* 좌측 — 브랜드 소개 */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center px-16 text-primary-content">
        <div className="w-full max-w-sm">
        <h1 className="text-4xl font-bold mb-4">방역매니저</h1>
        <p className="text-lg opacity-90 mb-10">소독/방역업체를 위한 올인원 관리 플랫폼</p>
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-content/15 flex items-center justify-center">
              <CalendarCheck size={20} />
            </div>
            <span className="text-base opacity-80">스케줄 자동 관리</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-content/15 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <span className="text-base opacity-80">증명서 원클릭 발급</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-content/15 flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
            <span className="text-base opacity-80">고객 이력 한눈에</span>
          </div>
        </div>
        </div>
      </div>

      {/* 우측 — 로그인 폼 */}
      <div className="flex-1 flex items-center justify-center px-6 bg-base-200">
        <div className="card w-full max-w-md">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold">로그인</h2>
            <p className="text-base-content/60 mb-6">
              방역매니저에 오신 것을 환영합니다
            </p>

            {error && (
              <div className="alert alert-error text-base">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField label="이메일">
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="비밀번호">
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormField>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-base">로그인 상태 유지</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-base text-primary hover:underline"
                >
                  비밀번호 찾기
                </Link>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "로그인"
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-base text-base-content/60">
                계정이 없으신가요?{" "}
              </span>
              <Link
                href="/signup"
                className="text-base text-primary font-medium hover:underline"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
