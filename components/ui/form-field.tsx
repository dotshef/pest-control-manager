import type { ReactNode } from "react";

interface FormFieldProps {
  label: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, children, className }: FormFieldProps) {
  return (
    <div className={`form-control ${className ?? ""}`}>
      <label className="label mb-2">
        <span className="label-text text-base font-medium">{label}</span>
      </label>
      {children}
    </div>
  );
}
