"use client";

import * as React from "react";

import Link from "next/link";

import { cn } from "@/lib/cn";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  href?: string;
  /** When true (default), the button shows a raised/elevated front panel. */
  showElevation?: boolean;
  /** Image src for an icon shown to the left of the label. */
  leftIcon?: string;
  /** Class name for the inner element. */
  innerClassName?: string;
  /* Border color */
  borderColor?: string;
}

type ButtonVariant = "primary" | "outline" | "outline-white";

type ButtonRef = HTMLButtonElement | HTMLAnchorElement;

const Button = React.forwardRef<
  ButtonRef,
  ButtonProps & { variant?: ButtonVariant }
>(
  (
    {
      className = "",
      innerClassName = "",
      borderColor,
      children,
      variant = "primary",
      href,
      showElevation = true,
      leftIcon,
      onPointerDown,
      onPointerUp,
      onPointerLeave,
      onPointerEnter,
      type,
      ...props
    },
    ref
  ) => {
    const [pressed, setPressed] = React.useState(false);
    const [hovered, setHovered] = React.useState(false);

    const handlePointerDown = (
      e: React.PointerEvent<HTMLButtonElement & HTMLAnchorElement>
    ) => {
      requestAnimationFrame(() => setPressed(true));
      onPointerDown?.(e);
    };

    const handlePointerUp = (
      e: React.PointerEvent<HTMLButtonElement & HTMLAnchorElement>
    ) => {
      setPressed(false);
      onPointerUp?.(e);
    };

    const handlePointerLeave = (
      e: React.PointerEvent<HTMLButtonElement & HTMLAnchorElement>
    ) => {
      setPressed(false);
      setHovered(false);
      onPointerLeave?.(e);
    };

    const handlePointerEnter = (
      e: React.PointerEvent<HTMLButtonElement & HTMLAnchorElement>
    ) => {
      setHovered(true);
      onPointerEnter?.(e);
    };

    const offset = -6;
    const frontTransform = showElevation
      ? pressed
        ? "translateY(0)"
        : hovered
          ? `translateY(${offset / 1.5}px)`
          : `translateY(${offset}px)`
      : "translateY(0)";

    const sharedClassName = cn(
      "group relative block w-fit cursor-pointer rounded-lg border-none p-0 font-bold outline-none overflow-visible",
      className
    );

    const iconEl = leftIcon ? (
      <img
        src={leftIcon}
        alt=""
        className="size-5 shrink-0 mr-1.5"
        aria-hidden
      />
    ) : null;

    const inner = (
      <>
        <span
          className="pointer-events-none invisible flex items-center py-3 px-3.5 font-bold whitespace-nowrap"
          aria-hidden
        >
          {iconEl}
          {children}
        </span>
        <div
          className={cn(
            "absolute inset-0 rounded-lg",
            variant === "primary" && "bg-brand-secondary",
            variant === "outline" &&
              "border bg-brand-black",
            variant === "outline" && (borderColor ?? "border-brand-secondary"),
            variant === "outline-white" && "border bg-brand-black",
            variant === "outline-white" && (borderColor ?? "border-white")
          )}
          aria-hidden
        />
        <div
          className={cn(
            "absolute left-0 top-0 flex items-center justify-center rounded-lg py-3 px-3.5 text-black transition-transform duration-75 ease-out whitespace-nowrap",
            variant === "primary" && "right-0 bg-brand-primary",
            variant === "outline" &&
              "right-0 bg-brand-black text-brand-primary border",
            variant === "outline" && (borderColor ?? "border-brand-primary"),
            variant === "outline-white" &&
              "right-0 bg-brand-black text-brand-primary border",
            variant === "outline-white" && (borderColor ?? "border-white"),
            innerClassName
          )}
          style={{ transform: frontTransform }}
          aria-hidden
        >
          {iconEl}
          {children}
        </div>
      </>
    );

    if (href) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          className={sharedClassName}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onPointerEnter={handlePointerEnter}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type ?? "button"}
        className={sharedClassName}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerEnter={handlePointerEnter}
        {...props}
      >
        {inner}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
