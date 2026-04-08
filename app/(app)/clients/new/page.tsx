"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";
import { getCycleMonths } from "@/lib/utils/cycle";
import type { FacilityTypeId } from "@/lib/constants/facility-types";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    facilityType: "",
    area: "",
    areaPyeong: "",
    address: "",
    contactName: "",
    contactPhone: "",
    notes: "",
    firstVisitDate: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const selectedCycle = form.facilityType
    ? getCycleMonths(form.facilityType as FacilityTypeId)
    : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          area: form.area ? Number(form.area) : null,
          areaPyeong: form.areaPyeong ? Number(form.areaPyeong) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push(`/clients/${data.id}`);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">고객 등록</h2>

      {error && (
        <div className="alert alert-error text-sm mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card bg-base-100 border border-base-300">
          <div className="card-body space-y-4">
            <h3 className="font-semibold">시설 정보</h3>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  시설명 <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="text"
                placeholder="예: 강남 그랜드 호텔"
                className="input input-bordered w-full"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  시설 유형 <span className="text-error">*</span>
                </span>
              </label>
              <select
                className="select select-bordered w-full"
                value={form.facilityType}
                onChange={(e) => updateField("facilityType", e.target.value)}
                required
              >
                <option value="">시설 유형 선택</option>
                {FACILITY_TYPES.map((ft) => (
                  <option key={ft.id} value={ft.id}>
                    {ft.label}
                  </option>
                ))}
              </select>
              {selectedCycle && (
                <label className="label">
                  <span className="label-text-alt text-primary">
                    법정 소독 주기: {selectedCycle}개월
                  </span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">주소</span>
              </label>
              <input
                type="text"
                placeholder="시설 주소"
                className="input input-bordered w-full"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">면적 (㎡)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={form.area}
                  onChange={(e) => updateField("area", e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">면적 (평)</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  value={form.areaPyeong}
                  onChange={(e) => updateField("areaPyeong", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body space-y-4">
            <h3 className="font-semibold">담당자 정보</h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">담당자명</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">연락처</span>
                </label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  className="input input-bordered w-full"
                  value={form.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">메모</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <h3 className="font-semibold">방문 스케줄</h3>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">
                  첫 방문 예정일 <span className="text-error">*</span>
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full"
                value={form.firstVisitDate}
                onChange={(e) => updateField("firstVisitDate", e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.back()}
          >
            취소
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "등록"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
