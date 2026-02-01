import { cn } from "@/lib/cn";
import { useEffect, useRef, useState } from "react";

export default function Dropdown({ trigger, className, children }: { trigger: (open: boolean, onToggle: () => void) => React.ReactNode, className?: string, children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={cn("relative inline-block dropdown dropdown-end", open && "dropdown-open")}
      ref={containerRef}>
      {trigger(open, () => setOpen(true))}
      {open && (
        <div
          ref={menuRef}
          id="navbar-dropdown-menu"
          role="menu"
          aria-labelledby="navbar-dropdown-trigger"
          onMouseDown={(e) => e.stopPropagation()}
          className={cn("dropdown-content z-100 mt-1 list-none rounded-b-lg rounded-t-none bg-brand-black shadow-lg border border-[#3B1517]", className)}>
          {children}
        </div>
      )}
    </div>
  );
}