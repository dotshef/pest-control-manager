"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center px-16 text-primary-content">
        <h1 className="text-4xl font-bold mb-4">방역매니저</h1>
        <p className="text-lg opacity-90 mb-2">소독 방역업체를 위한</p>
        <p className="text-lg opacity-90 mb-8">올인원 관리 플랫폼</p>
        <p className="text-sm opacity-70 mb-12">
          스케줄 관리 · 증명서 발급 · 고객 이력
        </p>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-content/20 flex items-center justify-center">
              <span className="text-lg">📅</span>
            </div>
            <span className="opacity-90">스케줄 자동 관리</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-content/20 flex items-center justify-center">
              <span className="text-lg">📄</span>
            </div>
            <span className="opacity-90">증명서 원클릭 발급</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-content/20 flex items-center justify-center">
              <span className="text-lg">📋</span>
            </div>
            <span className="opacity-90">고객 이력 한눈에</span>
          </div>
        </div>
      </div>

      {/* 우측 — 로그인 폼 */}
      <div className="flex-1 flex items-center justify-center px-6 bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold">로그인</h2>
            <p className="text-base-content/60 mb-6">
              방역매니저에 오신 것을 환영합니다
            </p>

            {error && (
              <div className="alert alert-error text-sm">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">이메일</span>
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">비밀번호</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="text-sm">로그인 상태 유지</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
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
              <span className="text-sm text-base-content/60">
                계정이 없으신가요?{" "}
              </span>
              <Link
                href="/signup"
                className="text-sm text-primary font-medium hover:underline"
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
