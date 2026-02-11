import Image from "next/image";

export default function SpecularCircle({
  icon,
  count,
}: {
  icon: string;
  count: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center h-24 w-24 rounded-full z-20"
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--color-brand-primary) 15%, #121212)",
      }}
    >
      <Image
        src={icon}
        alt="Upload File"
        width={36}
        height={40}
        className="z-30"
      />

      <div className="z-30 absolute -top-2 -right-2 rounded-full flex items-center justify-center h-7 w-7 bg-brand-primary text-brand-black text-sm font-bold shadow-[0_4px_4px_rgba(0,0,0,0.25)]">
        {count}
      </div>

      <div
        className="absolute opacity-30 h-36 w-36 rounded-full scale-180 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle at center, var(--color-brand-primary) 0%, var(--color-brand-secondary) 0%, #121212 50%)",
        }}
      />

      {/* Specular highlight: light from 45°, caught only on the border, 80% opacity */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none scale-140 rotate-60"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 49.5%, var(--color-brand-primary) 50%, transparent 52%)",
          mask: "conic-gradient(from 200deg at 50% 50%, transparent 0deg, var(--color-brand-primary) 50deg, transparent 100deg)",
          WebkitMask:
            "conic-gradient(from 200deg at 50% 50%, transparent 0deg, var(--color-brand-primary) 50deg, transparent 100deg)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 rounded-full pointer-events-none scale-140 -rotate-110"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 49.5%, var(--color-brand-primary) 50%, transparent 52%)",
          mask: "conic-gradient(from 200deg at 50% 50%, transparent 0deg, var(--color-brand-primary) 50deg, transparent 100deg)",
          WebkitMask:
            "conic-gradient(from 200deg at 50% 50%, transparent 0deg, var(--color-brand-primary) 50deg, transparent 100deg)",
        }}
        aria-hidden
      />
    </div>
  );
}
