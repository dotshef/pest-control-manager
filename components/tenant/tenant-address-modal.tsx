"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { FormField } from "@/components/ui/form-field";
import { Spinner } from "@/components/ui/spinner";

interface TenantAddressModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function TenantAddressModal({ open, onClose, onSaved }: TenantAddressModalProps) {
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setAddress("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const trimmed = address.trim();
    if (!trimmed) {
      setError("주소를 입력해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "저장에 실패했습니다");
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("서버 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tenant-address-modal-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-lg rounded-xl bg-popover border border-border shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 id="tenant-address-modal-title" className="text-lg font-bold">
            업체 주소 입력
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center p-1 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-base text-muted-foreground mb-4">
            증명서에 들어갈 업체 주소가 비어 있습니다. 주소를 입력하면 저장 후 바로 증명서가 생성됩니다.
          </p>

          {error && (
            <div className="flex items-center gap-3 rounded-lg p-3 bg-destructive/10 text-destructive border border-destructive/20 text-base mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField label={<>업체 주소 <span className="text-destructive">*</span></>}>
              <input
                type="text"
                className="w-full"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 서울특별시 강남구 테헤란로 123"
                required
                autoFocus
              />
            </FormField>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium hover:bg-muted transition-colors cursor-pointer"
                onClick={onClose}
                disabled={submitting}
              >
                취소
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-base font-medium bg-primary text-primary-foreground transition-colors disabled:opacity-50 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? <Spinner size="sm" /> : "저장하고 증명서 생성"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
