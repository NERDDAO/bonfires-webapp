"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

interface CountdownTimerProps {
  endDate: string;
  className?: string;
}

export default function CountdownTimer({ endDate, className }: CountdownTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const end = new Date(endDate).getTime();
  const diff = Math.max(0, end - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);

  if (diff <= 0) {
    return <span className={cn("text-red-400 font-semibold", className)}>Ended</span>;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {days > 0 && (
        <div className="text-center">
          <span className="text-2xl font-bold text-dark-s-0 font-mono">{days}</span>
          <span className="block text-[10px] uppercase text-dark-s-80 tracking-wider">days</span>
        </div>
      )}
      <span className="text-dark-s-80 text-lg">:</span>
      <div className="text-center">
        <span className="text-2xl font-bold text-dark-s-0 font-mono">{hours}</span>
        <span className="block text-[10px] uppercase text-dark-s-80 tracking-wider">hrs</span>
      </div>
      <span className="text-dark-s-80 text-lg">:</span>
      <div className="text-center">
        <span className="text-2xl font-bold text-dark-s-0 font-mono">{String(mins).padStart(2, "0")}</span>
        <span className="block text-[10px] uppercase text-dark-s-80 tracking-wider">min</span>
      </div>
    </div>
  );
}
