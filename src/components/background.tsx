"use client";

const orbBackground =
  "radial-gradient(circle at center, #B2FF00 0%, #72A300 0%, #121212 50%)";
export function Background({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-brand-black">
      {/* Orb layer — fixed to viewport so orbs stay in place regardless of scroll/content */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        {/* Top-left orb — 40vh size, center at top-left corner (offset by half: 20vh) */}
        <div
          className="absolute opacity-30 -top-[372px] -left-[372px] h-[744px] w-[744px] rounded-full scale-200 blur-[100px]"
          style={{
            background: orbBackground,
          }}
        />

        {/* Bottom-right orb — negative offset so it sits partly off container edge */}
        <div
          className="absolute opacity-30 -bottom-[239px] -right-[239px] h-[439px] w-[439px] rounded-full scale-200 blur-[100px]"
          style={{
            background: orbBackground,
          }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
