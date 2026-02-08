"use client";

import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from "react";

import { cn } from "@/lib/cn";

import { LoadingSpinner } from "./LoadingSpinner";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "ghost"
  | "link"
  | "outline"
  | "error"
  | "success"
  | "warning"
  | "info";

type ButtonSize = "xs" | "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  ghost: "btn-ghost",
  link: "btn-link",
  outline: "btn-outline",
  error: "btn-error",
  success: "btn-success",
  warning: "btn-warning",
  info: "btn-info",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

/**
 * Button Component
 *
 * A customizable button component built on DaisyUI's btn class.
 * Supports variants, sizes, loading states, and icons.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          "btn",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <LoadingSpinner size={size === "lg" ? "md" : "sm"} />
        ) : (
          leftIcon
        )}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

export default Button;
