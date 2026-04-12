"use client";

import { useEffect, useRef, useState } from "react";

interface HelpPopoverProps {
  children: React.ReactNode;
}

export function HelpPopover({ children }: HelpPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center justify-center size-5 rounded-full border border-border text-muted-foreground text-xs hover:bg-muted transition-colors cursor-pointer"
        onClick={() => setOpen((v) => !v)}
        aria-label="도움말"
      >
        ?
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-lg border border-border bg-popover p-4 text-sm shadow-lg space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}
