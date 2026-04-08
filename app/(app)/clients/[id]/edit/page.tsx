"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { FACILITY_TYPES } from "@/lib/constants/facility-types";

export default function EditClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
  });

  const fetchClient = useCallback(async () => {
    const res = await fetch(`/api/clients/${id}`);
    if (!res.ok) {
      router.push("/clients");
      return;
    }
    const data = await res.json();
    setForm({
      name: data.name || "",
      facilityType: data.facility_type || "",
      area: data.area?.toString() || "",
      areaPyeong: data.area_pyeong?.toString() || "",
      address: data.address || "",
      contactName: data.contact_name || "",
      contactPhone: data.contact_phone || "",
      notes: data.notes || "",
    });
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
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

      router.push(`/clients/${id}`);
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">고객 정보 수정</h2>

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
                className="input input-bordered w-full"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">시설 유형</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={form.facilityType}
                onChange={(e) => updateField("facilityType", e.target.value)}
              >
                <option value="">시설 유형 선택</option>
                {FACILITY_TYPES.map((ft) => (
                  <option key={ft.id} value={ft.id}>
                    {ft.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">주소</span>
              </label>
              <input
                type="text"
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
            disabled={saving}
          >
            {saving ? (
              <span className="loading loading-spinner loading-sm" />
            ) : (
              "저장"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
