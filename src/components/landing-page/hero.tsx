import { siteCopy } from "@/content";

import { HeroScrollCapture } from "./hero-scroll-capture";

interface HeroProps {
  /** Override staticGraph (e.g. from subdomain context) */
  staticGraph?: { staticBonfireId: string; staticAgentId: string };
}

export default function Hero({ staticGraph: staticGraphProp }: HeroProps = {}) {
  const staticGraph =
    staticGraphProp ??
    ("staticGraph" in siteCopy ? siteCopy.staticGraph : undefined);

  return <HeroScrollCapture staticGraph={staticGraph} />;
}
