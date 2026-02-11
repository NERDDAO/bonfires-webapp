"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

import { cn } from "@/lib/cn";

const TooltipProvider = TooltipPrimitive.Provider;

const Tooltip = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-1000 max-w-40 lg:max-w-60 rounded-lg border border-[#22252B] bg-brand-black px-3 py-2 text-sm font-normal text-dark-s-0 shadow-lg",
        "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/** Info icon (circle with "i") used as tooltip trigger */
const InfoIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGAttributes<SVGSVGElement> & { size?: "sm" | "md" }
>(({ className, size = "md", ...props }, ref) => (
  <svg
    ref={ref}
    width="35"
    height="35"
    viewBox="0 0 35 35"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn(
      "cursor-help text-brand-primary shrink-0",
      size === "sm" && "h-4 w-4 lg:h-5 lg:w-5",
      size === "md" && "h-5 w-5 lg:h-8 lg:w-8",
      className
    )}
    aria-hidden
    {...props}
  >
    <circle
      cx="17.2651"
      cy="17.2651"
      r="15.937"
      stroke="currentColor"
      strokeWidth="2.65617"
    />
    <path
      d="M17.1324 23.8745H17.1458"
      stroke="currentColor"
      strokeWidth="2.65617"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.2809 13.25C13.5996 12.3717 14.2169 11.6333 15.0248 11.1639C15.8328 10.6945 16.78 10.5241 17.7009 10.6823C18.6218 10.8405 19.4578 11.3174 20.0627 12.0295C20.6676 12.7417 21.0031 13.6437 21.0103 14.5781C21.0103 17.2343 17.0261 18.5624 17.0261 18.5624"
      stroke="currentColor"
      strokeWidth="2.65617"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
));
InfoIcon.displayName = "InfoIcon";

export interface InfoTooltipProps {
  content: string | string[];
  /** Placement: bottom on small screens, right on lg+ by default */
  side?: "top" | "right" | "bottom" | "left";
  sideAtLg?: "top" | "right" | "bottom" | "left";
  iconSize?: "sm" | "md";
  className?: string;
  tooltipClassName?: string;
}

/**
 * Info icon with popup tooltip (Radix). Use instead of DaisyUI tooltip
 * to avoid ::before-based positioning issues.
 * Supports hover on desktop and tap-to-open on mobile.
 */
function InfoTooltip({
  content,
  side = "bottom",
  sideAtLg = "right",
  iconSize = "md",
  className,
  tooltipClassName,
}: InfoTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [placement, setPlacement] = React.useState(side);
  const ignoreNextCloseRef = React.useRef(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setPlacement(mq.matches ? sideAtLg : side);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [side, sideAtLg]);

  const handleOpenChange = React.useCallback((next: boolean) => {
    if (!next && ignoreNextCloseRef.current) {
      ignoreNextCloseRef.current = false;
      return;
    }
    setOpen(next);
  }, []);

  const handlePointerDown = React.useCallback(() => {
    setOpen((prev) => {
      if (!prev) {
        ignoreNextCloseRef.current = true;
        return true;
      }
      return false;
    });
  }, []);

  return (
    <Tooltip open={open} onOpenChange={handleOpenChange} delayDuration={200}>
      <TooltipTrigger asChild>
        <span
          className={cn("inline-flex touch-manipulation", className)}
          aria-label="More info"
          onPointerDown={handlePointerDown}
        >
          <InfoIcon size={iconSize} />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={placement}
        onPointerDownOutside={() => setOpen(false)}
        className={tooltipClassName}
      >
        {Array.isArray(content) ? content.map((item, index) => <p className={cn("mb-2", index === content.length - 1 ? "mb-0" : "")} key={index}>{item}</p>) : content}
      </TooltipContent>
    </Tooltip>
  );
}

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
  InfoTooltip,
  InfoIcon,
};
