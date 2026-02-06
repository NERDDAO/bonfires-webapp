import Image from "next/image";
import { Button } from "../ui/button";
import { heroCopy, siteCopy } from "@/content";
import { HeroRecentActivity } from "./hero-recent-activity";

interface HeroProps {
  /** Override staticGraph (e.g. from subdomain context) */
  staticGraph?: { staticBonfireId: string; staticAgentId: string };
}

export default function Hero({ staticGraph: staticGraphProp }: HeroProps = {}) {
  const { logo, logoAlt, title, description, primaryCta, primaryCtaHref, secondaryCta, secondaryCtaMobile, secondaryCtaHref } = heroCopy;
  const staticGraph =
    staticGraphProp ??
    ("staticGraph" in siteCopy ? siteCopy.staticGraph : undefined);

  return (
    <div className="flex flex-col lg:flex-row lg:items-stretch gap-6 lg:gap-10 px-6 lg:px-20 py-10.5 lg:justify-center min-h-[calc(100svh-4rem)] lg:min-h-[calc(100dvh-5rem)]">
      <div className="flex flex-col flex-1 lg:flex-auto justify-center gap-2 lg:gap-4 lg:max-w-[682px] z-10">
        <Image
          src={logo}
          alt={logoAlt}
          width={517}
          height={67}
          className="w-[251px] lg:w-[517px] h-auto"
        />
        <div className="font-montserrat text-2xl lg:text-5xl font-black max-w-[348px] lg:max-w-none">
          {title}
        </div>
        <div className="font-laro-soft text-sm lg:text-base max-w-[348px] lg:max-w-none">{description}</div>

        <div className="mt-3 lg:mt-3 flex gap-3 lg:gap-6 flex-row flex-wrap lg:max-w-none">
          <Button variant="primary" className="z-10 w-auto" href={primaryCtaHref}>{primaryCta}</Button>
          <Button variant="outline" className="z-10 w-auto" href={secondaryCtaHref}>
            <span className="block lg:hidden">{secondaryCtaMobile}</span>
            <span className="hidden lg:inline">{secondaryCta}</span>
          </Button>
        </div>
      </div>

      {staticGraph && (
        <div className="mt-8 shrink-0 lg:w-[468px] lg:max-h-[calc(100dvh-8rem)] flex flex-col z-10">
          <HeroRecentActivity staticGraph={staticGraph} className="lg:absolute" />
        </div>
      )}
    </div>
  );
}
