import { cn } from "@/lib/cn";

/** Shared style tokens for the graph-explorer select panel. */
export const width = "w-full lg:w-50";
export const border =
  "bg-[#181818]/80 backdrop-blur-md rounded-2xl border-[0.78px] border-[#333333]";
export const skeletonClass = `${border} rounded-2xl ${width} px-4 lg:px-5 py-4 h-12 animate-pulse`;
export const errorClass = `${border} rounded-2xl ${width} px-4 lg:px-5 py-4 text-sm text-red-400`;
export const contentClass = "bg-[#0f0f0f] border-[#333333]";

export const labelClass =
  "font-montserrat text-sm lg:text-base font-bold text-white mb-2";
export const panelContainerClass = cn(
  "flex flex-col gap-3",
  border,
  "w-full max-w-full lg:w-[468px] px-4 lg:px-5 py-4"
);
