"use client";

import * as React from "react";

import { cn } from "@/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

type ButtonVariant = "primary" | "outline";

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { variant?: ButtonVariant }
>(({ className = "", children, variant = "primary", onPointerDown, onPointerUp, onPointerLeave, onPointerEnter, ...props }, ref) => {
  const [pressed, setPressed] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Defer so the browser paints the current state before we change it;
    // otherwise the transition from hover/rest → pressed is skipped and looks instant.
    requestAnimationFrame(() => setPressed(true));
    onPointerDown?.(e);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    setPressed(false);
    onPointerUp?.(e);
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLButtonElement>) => {
    setPressed(false);
    setHovered(false);
    onPointerLeave?.(e);
  };

  const handlePointerEnter = (e: React.PointerEvent<HTMLButtonElement>) => {
    setHovered(true);
    onPointerEnter?.(e);
  };

  // Rest: up (-6px), Hover: halfway (-3px), Pressed: fully down (0)
  const offset = -6;
  const frontTransform = pressed
    ? "translateY(0)"
    : hovered
      ? `translateY(${offset/1.5}px)`
      : `translateY(${offset}px)`;

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "group relative block w-fit cursor-pointer rounded-lg border-none p-0 font-bold outline-none overflow-visible",
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      {...props}
    >
      {/* Invisible strut: sets button size (both divs are absolute) */}
      <span
        className="pointer-events-none invisible block py-3 px-3.5 font-bold whitespace-nowrap"
        aria-hidden
      >
        {children}
      </span>

      {/* Back div: border / shadow layer (no CSS border) */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg",
          variant === "primary" && "bg-brand-secondary",
          variant === "outline" && "border border-brand-secondary"
        )}
        aria-hidden
      />

      {/* Front div: face layer on top, moves on hover (halfway) and click (fully down) */}
      <div
        className={cn(
          "absolute left-0 top-0 flex items-center justify-center rounded-lg py-3 px-3.5 text-black transition-transform duration-75 ease-out whitespace-nowrap",
          variant === "primary" && "right-0 bg-brand-primary",
          variant === "outline" && "right-0 bg-brand-black text-brand-primary border border-brand-primary"
        )}
        style={{ transform: frontTransform }}
        aria-hidden
      >
        {children}
      </div>
    </button>
  );
});

Button.displayName = "Button";

export { Button };
