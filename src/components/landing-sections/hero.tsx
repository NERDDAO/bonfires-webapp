import Image from "next/image";
import { Button } from "../ui/button";
import { heroCopy } from "@/content";

export default function Hero() {
  const { logo, logoAlt, title, description, primaryCta, primaryCtaHref, secondaryCta, secondaryCtaHref } = heroCopy;
  return (
    <div className="flex flex-col px-7 lg:px-20 py-10.5 lg:justify-center min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-5rem)]">
      <div className="flex flex-col flex-1 lg:flex-auto justify-center gap-2 lg:gap-4 lg:max-w-[682px] z-10">
        <Image
          src={logo}
          alt={logoAlt}
          width={517}
          height={67}
          className="w-[251px] lg:w-[517px] h-auto"
        />
        <div className="font-montserrat text-2xl lg:text-5xl font-black max-w-[348px] lg:max-w-none">
          {heroCopy.title}
        </div>
        <div className="font-laro-soft text-sm lg:text-base max-w-[348px] lg:max-w-none">{heroCopy.description}</div>

        <div className="mt-auto lg:mt-3 flex gap-6 flex-col lg:flex-row lg:max-w-none">
          <Button variant="primary" className="z-10 w-full lg:w-auto" href={primaryCtaHref}>{primaryCta}</Button>
          <Button variant="outline" className="z-10 w-full lg:w-auto" href={secondaryCtaHref}>{secondaryCta}</Button>
        </div>
      </div>
    </div>
  );
}
