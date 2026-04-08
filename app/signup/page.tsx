"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    businessNumber: "",
    ownerName: "",
    phone: "",
    address: "",
    email: "",
    password: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        <p className="text-sm opacity-70">
          스케줄 관리 · 증명서 발급 · 고객 이력
        </p>
      </div>

      {/* 우측 — 회원가입 폼 */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold">회원가입</h2>
            <p className="text-base-content/60 mb-4">
              업체 정보와 관리자 계정을 등록해주세요
            </p>

            {error && (
              <div className="alert alert-error text-sm">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 업체 정보 */}
              <div className="divider text-xs text-base-content/40">
                업체 정보
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    업체명 <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="예: 그린방역"
                  className="input input-bordered w-full"
                  value={form.companyName}
                  onChange={(e) => updateField("companyName", e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">사업자등록번호</span>
                </label>
                <input
                  type="text"
                  placeholder="000-00-00000"
                  className="input input-bordered w-full"
                  value={form.businessNumber}
                  onChange={(e) =>
                    updateField("businessNumber", e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">대표자명</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={form.ownerName}
                    onChange={(e) => updateField("ownerName", e.target.value)}
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">전화번호</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="02-0000-0000"
                    className="input input-bordered w-full"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </div>

              {/* 관리자 계정 */}
              <div className="divider text-xs text-base-content/40">
                관리자 계정
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    이름 <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="관리자 이름"
                  className="input input-bordered w-full"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    이메일 <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  className="input input-bordered w-full"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">
                    비밀번호 <span className="text-error">*</span>
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="8자 이상"
                  className="input input-bordered w-full"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  required
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full mt-2"
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "회원가입"
                )}
              </button>
            </form>

            <div className="text-center mt-4">
              <span className="text-sm text-base-content/60">
                이미 계정이 있으신가요?{" "}
              </span>
              <Link
                href="/login"
                className="text-sm text-primary font-medium hover:underline"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
