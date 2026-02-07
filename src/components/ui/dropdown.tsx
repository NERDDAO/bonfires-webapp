import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

export default function Dropdown({
  trigger,
  placement = "end",
  className,
  children,
}: {
  trigger: (open: boolean, onToggle: () => void) => React.ReactNode;
  placement?: "start" | "end" | "center";
  className?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        containerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      )
        return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuClasses = cn(
    "dropdown-content z-100 mt-1 list-none rounded-b-lg rounded-t-none bg-brand-black shadow-lg border border-[#3B1517]",
    placement === "start" && "dropdown-start",
    placement === "end" && "dropdown-end",
    placement === "center" && "dropdown-center"
  );

  return (
    <div
      className={cn(
        "relative inline-block dropdown",
        open && "dropdown-open",
        menuClasses
      )}
      ref={containerRef}
    >
      {trigger(open, () => setOpen(true))}
      {open && (
        <div
          ref={menuRef}
          id="navbar-dropdown-menu"
          role="menu"
          aria-labelledby="navbar-dropdown-trigger"
          onMouseDown={(e) => e.stopPropagation()}
          className={cn(
            "dropdown-content z-100 mt-1 list-none rounded-b-lg rounded-t-none bg-brand-black shadow-lg border border-[#3B1517]",
            className
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
